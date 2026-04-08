import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { randomBytes } from 'crypto';

import { inwendoErpApiRequest } from './GenericFunctions';

export class InwendoErpTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'inwendo ERP Trigger',
		name: 'inwendoErpTrigger',
		icon: 'file:../../icons/inwendo.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["entityType"] + " " + $parameter["action"]}}',
		description: 'Starts the workflow when an inwendo ERP event occurs via webhook',
		defaults: {
			name: 'inwendo ERP Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'inwendoErpApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'inwendo-erp',
			},
		],
		properties: [
			{
				displayName: 'Auto Register Webhook in ERP',
				name: 'autoRegister',
				type: 'boolean',
				default: true,
				description:
					'Whether to automatically create the matching RegisteredWebhook in the inwendo ERP when this workflow is activated, and remove it when the workflow is deactivated. Disable if you prefer to manage the webhook manually in the ERP. When enabled, valid inwendo ERP API credentials must be configured on this node.',
			},
			{
				displayName:
					'Auto-registration requires the JWT token configured above to have ' +
					'Scope <b>Webhook</b> with <b>Write</b> access, and the inwendo ERP ' +
					'instance must provide the dedicated <b>/api/n8n/webhook</b> ' +
					'controller. Older ERP builds do not support this flow - turn ' +
					'this toggle off and configure the webhook manually in the ERP UI. ' +
					'See the package Readme for details.',
				name: 'autoRegisterNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						autoRegister: [true],
					},
				},
			},
			{
				displayName: 'Entity Type',
				name: 'entityType',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Booking', value: 'BaseBooking' },
					{ name: 'Company', value: 'CRMCompany' },
					{ name: 'Event', value: 'BaseEvent' },
					{ name: 'Event Sign-Up', value: 'BaseEventSignUp' },
					{ name: 'Invoice', value: 'Invoice' },
					{ name: 'News Article', value: 'MediaNewsArticle' },
					{ name: 'Offer', value: 'Offer' },
					{ name: 'Person', value: 'CRMPerson' },
					{ name: 'Project', value: 'CRMProject' },
					{ name: 'Ticket', value: 'CustomerTicket' },
					{ name: 'Time Entry', value: 'TimeEntry' },
				],
				default: 'all',
				description: 'The entity type to listen for. Select "All" to receive all events.',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Create', value: 'create' },
					{ name: 'Update', value: 'update' },
					{ name: 'Delete', value: 'delete' },
				],
				default: 'all',
				description: 'The action to listen for. Select "All" to receive all actions.',
			},
			{
				displayName: 'Webhook Token',
				name: 'webhookToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description:
					'Optional shared secret used to validate the X-IW-Webhook-Token header on incoming requests. ' +
					'With auto-registration enabled, leave this empty to have a random token generated and stored with the workflow. ' +
					'With auto-registration disabled, set it to the notificationClientToken configured on the webhook in the ERP.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const autoRegister = this.getNodeParameter('autoRegister', true) as boolean;
				// In manual mode: pretend the webhook exists so n8n does not
				// call create() - the user owns the ERP-side registration.
				//
				// In auto mode: always return false so n8n calls create() on
				// every activation. POST /api/n8n/webhook is idempotent on
				// (webhook_url, notificationClientId='n8n'), so any change to
				// entityType / action / webhookToken is absorbed in place by
				// the server. Returning false unconditionally avoids the
				// class of bugs where a client-side comparison misses a
				// parameter change and leaves the ERP webhook stale.
				return !autoRegister;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const autoRegister = this.getNodeParameter('autoRegister', true) as boolean;
				if (!autoRegister) {
					// User is managing the webhook manually.
					return true;
				}

				// Fail loudly if no ERP credentials are configured — otherwise
				// getCredentials() inside inwendoErpApiRequest would throw a
				// generic error. This message tells the user exactly what to do.
				try {
					await this.getCredentials('inwendoErpApi');
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						'Auto Register Webhook in ERP is enabled but no inwendo ERP API credentials are configured on this trigger. Configure credentials on the node, or disable Auto Register Webhook in ERP to manage the webhook manually.',
					);
				}

				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const entityType = this.getNodeParameter('entityType') as string;
				const action = this.getNodeParameter('action') as string;
				let token = this.getNodeParameter('webhookToken', '') as string;

				// If no token is supplied, auto-generate one and persist it in
				// static data so webhook() can validate incoming requests with it.
				const staticData = this.getWorkflowStaticData('node');
				if (!token) {
					token =
						(staticData.generatedToken as string) || randomBytes(24).toString('hex');
					staticData.generatedToken = token;
				}

				const body: IDataObject = {
					webhook_url: webhookUrl,
					reference_class_name: entityType === 'all' ? null : entityType,
					database_action: action === 'all' ? null : action,
					webhook_token: token,
				};

				const response = await inwendoErpApiRequest.call(
					this,
					'POST',
					'/api/n8n/webhook',
					body,
				);

				const webhookId = response?.webhook_id;
				if (!webhookId) {
					throw new NodeOperationError(
						this.getNode(),
						'inwendo ERP did not return a webhook id after registration',
					);
				}
				staticData.webhookId = webhookId;
				staticData.webhookUrl = webhookUrl;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const autoRegister = this.getNodeParameter('autoRegister', true) as boolean;
				if (!autoRegister) {
					// User is managing the webhook manually - do not touch
					// anything in the ERP, and leave any stored static data
					// alone in case they re-enable auto-registration later.
					return true;
				}

				const staticData = this.getWorkflowStaticData('node');
				const webhookUrl =
					(staticData.webhookUrl as string | undefined) ??
					(this.getNodeWebhookUrl('default') as string);
				if (!webhookUrl) {
					return true;
				}

				try {
					await inwendoErpApiRequest.call(
						this,
						'DELETE',
						'/api/n8n/webhook',
						{ webhook_url: webhookUrl },
					);
				} catch (error) {
					// DELETE /api/n8n/webhook failed (e.g. transient ERP
					// error). Keep the stored static data so the next
					// deactivation can retry cleanup, and do not block
					// workflow deactivation.
					return true;
				}

				// Only clear static data after the DELETE succeeded. The
				// ERP side soft-deletes the row; the trigger just needs to
				// forget its local handle on it.
				delete staticData.webhookId;
				delete staticData.webhookUrl;
				delete staticData.generatedToken;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headerData = this.getHeaderData() as IDataObject;

		// Validate webhook token. Accept either the user-supplied token or
		// the one that auto-registration stored in workflow static data.
		const staticData = this.getWorkflowStaticData('node');
		const expectedToken =
			(this.getNodeParameter('webhookToken', '') as string) ||
			(staticData.generatedToken as string) ||
			'';
		if (expectedToken) {
			const receivedToken =
				(headerData['x-iw-webhook-token'] as string) ||
				(headerData['X-IW-Webhook-Token'] as string) ||
				'';
			if (receivedToken !== expectedToken) {
				return {
					webhookResponse: 'Unauthorized',
				};
			}
		}

		// Filter by entity type
		const entityType = this.getNodeParameter('entityType') as string;
		if (entityType !== 'all') {
			const incomingEntityClass = (body.iw_entity_class as string) || '';
			const incomingShortClass = (body.iw_entity_short_class as string) || '';

			// Check both full class name and short class name
			if (
				!incomingEntityClass.includes(entityType) &&
				incomingShortClass !== entityType
			) {
				return {
					webhookResponse: 'Filtered',
				};
			}
		}

		// Filter by action
		const action = this.getNodeParameter('action') as string;
		if (action !== 'all') {
			const incomingAction = (body.iw_action as string) || '';
			if (incomingAction !== action) {
				return {
					webhookResponse: 'Filtered',
				};
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
