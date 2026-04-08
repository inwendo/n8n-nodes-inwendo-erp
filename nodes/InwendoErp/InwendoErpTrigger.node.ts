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
				if (!autoRegister) {
					// The user is managing the webhook manually in the ERP, so
					// there is nothing for us to check - pretend it exists so
					// n8n does not call create().
					return true;
				}

				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as number | undefined;
				if (!webhookId) {
					return false;
				}

				try {
					const response = await inwendoErpApiRequest.call(
						this,
						'GET',
						`/api/dw/webhook/${webhookId}`,
					);
					const data = response?.data;
					if (!data || data.deleted) {
						delete staticData.webhookId;
						return false;
					}

					// Force recreate if the URL changed (e.g. the workflow was
					// moved to a different n8n host).
					const currentUrl = this.getNodeWebhookUrl('default');
					if (data.notificationUrl !== currentUrl) {
						delete staticData.webhookId;
						return false;
					}
					return true;
				} catch (error) {
					delete staticData.webhookId;
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const autoRegister = this.getNodeParameter('autoRegister', true) as boolean;
				if (!autoRegister) {
					// User is managing the webhook manually.
					return true;
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

				const workflow = this.getWorkflow();
				const nodeName = this.getNode().name;
				const workflowName = (workflow?.name as string | undefined) ?? 'workflow';

				const body: IDataObject = {
					data: {
						description: `n8n: ${workflowName} / ${nodeName}`,
						deleted: false,
						referenceClassName: entityType === 'all' ? null : entityType,
						referenceIds: null,
						databaseAction: action === 'all' ? null : action,
						notificationType: 'HTTP_POST',
						notificationUrl: webhookUrl,
						notificationClientId: 'n8n',
						notificationClientToken: token,
						requestTimeout: 5,
					},
				};

				const response = await inwendoErpApiRequest.call(
					this,
					'POST',
					'/api/dw/webhook',
					body,
				);

				const webhookId = response?.data?.id;
				if (!webhookId) {
					throw new NodeOperationError(
						this.getNode(),
						'inwendo ERP did not return a webhook id after registration',
					);
				}
				staticData.webhookId = webhookId;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as number | undefined;
				if (!webhookId) {
					return true;
				}

				try {
					await inwendoErpApiRequest.call(
						this,
						'PATCH',
						`/api/dw/webhook/${webhookId}`,
						{ data: { deleted: true } },
					);
				} catch (error) {
					// Swallow - leaving a stale soft-deleted entry behind is
					// better than blocking workflow deactivation on a transient
					// ERP error.
				}

				delete staticData.webhookId;
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
