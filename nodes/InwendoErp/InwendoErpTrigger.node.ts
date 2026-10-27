import type {
	IDataObject,
	IHookFunctions,
	NodeApiError,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { randomBytes } from 'crypto';

import { asNodeError, featureDisabledSetting, inwendoErpApiRequest } from './GenericFunctions';

/** Timed booking events (ERP setting integration_booking_timed_events_enabled). */
export const TIMED_BOOKING_ACTIONS = ['booking_pre_start', 'booking_start', 'booking_end', 'booking_post_end'];
const TIMED_ALL = 'booking_timed';
const TIMED_SETTING = 'integration_booking_timed_events_enabled';

export function isTimedAction(action: string): boolean {
	return action === TIMED_ALL || TIMED_BOOKING_ACTIONS.includes(action);
}

/** Whether an incoming iw_action matches the configured action of the trigger. */
export function actionMatches(configured: string, incoming: string): boolean {
	if (configured === 'all') {
		return true;
	}
	if (configured === TIMED_ALL) {
		return TIMED_BOOKING_ACTIONS.includes(incoming);
	}
	return configured === incoming;
}

/** "7, 8" -> ["7", "8"] */
function bookableIds(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part !== '');
}

/**
 * The workflow item of an ERP webhook: the envelope as sent, plus the summary objects
 * (iw_timed_event of timed booking events, webhook_data of smart lock log / check-in events)
 * at the top level. Envelope keys are never overwritten.
 */
export function triggerOutput(body: IDataObject): IDataObject {
	const summary: IDataObject = {};
	for (const key of ['iw_timed_event', 'webhook_data']) {
		const value = body[key];
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			Object.assign(summary, value as IDataObject);
		}
	}
	return { ...summary, ...body };
}

export class InwendoErpTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'vynst (inwendo ERP) Trigger',
		name: 'inwendoErpTrigger',
		icon: { light: 'file:../../icons/vynst.svg', dark: 'file:../../icons/vynst.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["entityType"] + " " + $parameter["action"]}}',
		description: 'Starts the workflow when a vynst (inwendo ERP) event occurs via webhook',
		defaults: {
			name: 'vynst (inwendo ERP) Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
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
					'Whether to automatically create the matching RegisteredWebhook in vynst (inwendo ERP) when this workflow is activated, and remove it when the workflow is deactivated. Disable if you prefer to manage the webhook manually in the ERP. When enabled, valid vynst (inwendo ERP) API credentials must be configured on this node.',
			},
			{
				displayName:
					'Auto-registration requires the JWT token configured above to have ' +
					'Scope <b>Webhook</b> with <b>Write</b> access, and vynst (inwendo ERP) ' +
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
					{ name: 'Check-In (Attendance List Entry)', value: 'AttendanceListEntry' },
					{ name: 'Company', value: 'CRMCompany' },
					{ name: 'Event', value: 'BaseEvent' },
					{ name: 'Event Sign-Up', value: 'BaseEventSignUp' },
					{ name: 'General Meeting Participant', value: 'GeneralMeetingParticipant' },
					{ name: 'Helper Shift Assignment', value: 'VolunteerShiftAssignment' },
					{ name: 'Inventory Loan', value: 'EventInventoryLoan' },
					{ name: 'Invoice', value: 'Invoice' },
					{ name: 'Membership Pause', value: 'MembershipPauseRequest' },
					{ name: 'News Article', value: 'MediaNewsArticle' },
					{ name: 'Offer', value: 'Offer' },
					{ name: 'Person', value: 'CRMPerson' },
					{ name: 'Project', value: 'CRMProject' },
					{ name: 'Shift (Shift Plan Entry)', value: 'ShiftPlanEntry' },
					{ name: 'Smart Lock Log (Access)', value: 'SmartLockLog' },
					{ name: 'Ticket', value: 'CustomerTicket' },
					{ name: 'Time Entry', value: 'TimeEntry' },
					{ name: 'Usage Counter', value: 'BaseBookableUsageCounter' },
					{ name: 'Volunteer Hour Entry', value: 'VolunteerHourEntry' },
				],
				default: 'all',
				displayOptions: {
					hide: {
						action: [...TIMED_BOOKING_ACTIONS, TIMED_ALL],
					},
				},
				description: 'The entity type to listen for. Select "All" to receive all events.',
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{
						name: 'Booking: All Timed Events',
						value: 'booking_timed',
						description: 'Pre-start, start, end and post-end of every booking',
						action: 'On every timed booking event',
					},
					{
						name: 'Booking: End',
						value: 'booking_end',
						description: 'A booking ends',
						action: 'On booking end',
					},
					{
						name: 'Booking: Post-End',
						value: 'booking_post_end',
						description: 'The lag time after a booking ended (e.g. 15 minutes after: lights off, lock the door)',
						action: 'On booking post end',
					},
					{
						name: 'Booking: Pre-Start (Lead Time)',
						value: 'booking_pre_start',
						description: 'The lead time before a booking starts (e.g. 30 minutes before: heating on, open the door)',
						action: 'On booking pre start',
					},
					{
						name: 'Booking: Start',
						value: 'booking_start',
						description: 'A booking starts',
						action: 'On booking start',
					},
					{ name: 'Create', value: 'create' },
					{ name: 'Delete', value: 'delete' },
					{ name: 'Update', value: 'update' },
				],
				default: 'all',
				description:
					'The action to listen for. Select "All" to receive all create / update / delete actions. The timed booking events are sent by the ERP at the time of the booking (ERP setting integration_booking_timed_events_enabled).',
			},
			{
				displayName:
					'Timed booking events need the ERP setting <b>integration_booking_timed_events_enabled</b>. Lead and lag time: ' +
					'bookable addon data <b>automation_pre_start_minutes</b> / <b>automation_post_end_minutes</b>, else the settings ' +
					'integration_booking_timed_events_pre_start_minutes (30) / _post_end_minutes (15). Events can arrive 1-2 minutes late.',
				name: 'timedNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						action: [...TIMED_BOOKING_ACTIONS, TIMED_ALL],
					},
				},
			},
			{
				displayName: 'Bookable IDs',
				name: 'bookableFilter',
				type: 'string',
				default: '',
				placeholder: '7,8',
				displayOptions: {
					show: {
						action: [...TIMED_BOOKING_ACTIONS, TIMED_ALL],
					},
				},
				description: 'Only timed events of these bookables (comma-separated IDs; empty: all bookables)',
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
						'Auto Register Webhook in ERP is enabled but no vynst (inwendo ERP) API credentials are configured on this trigger. Configure credentials on the node, or disable Auto Register Webhook in ERP to manage the webhook manually.',
					);
				}

				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const action = this.getNodeParameter('action') as string;
				const timed = isTimedAction(action);
				// timed events only exist for bookings
				const entityType = timed ? 'BaseBooking' : (this.getNodeParameter('entityType', 'all') as string);
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

				let response: IDataObject;
				try {
					response = (await inwendoErpApiRequest.call(this, 'POST', '/api/n8n/webhook', body)) as IDataObject;
				} catch (error) {
					throw timed ? timedRegistrationError(this, error) : asNodeError(this.getNode(), error);
				}

				const webhookId = response?.webhook_id;
				if (!webhookId) {
					throw new NodeOperationError(
						this.getNode(),
						'vynst (inwendo ERP) did not return a webhook id after registration',
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
					this.logger.warn(
						`vynst (inwendo ERP) Trigger: removing the webhook failed: ${(error as Error).message}`,
					);
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

		const action = this.getNodeParameter('action') as string;
		const timed = isTimedAction(action);

		// Filter by entity type (timed events are booking events)
		const entityType = timed ? 'all' : (this.getNodeParameter('entityType', 'all') as string);
		if (entityType !== 'all') {
			const incomingEntityClass = (body.iw_entity_class as string) || '';
			const incomingShortClass = (body.iw_entity_short_class as string) || '';

			// Compare the class name without namespace ("TimeEntry" must not match "WorkTimeEntry")
			const incomingClassName = incomingEntityClass.split('\\').pop() || '';
			if (incomingClassName !== entityType && incomingShortClass !== entityType) {
				return {
					webhookResponse: 'Filtered',
				};
			}
		}

		// Filter by action
		if (!actionMatches(action, (body.iw_action as string) || '')) {
			return {
				webhookResponse: 'Filtered',
			};
		}

		// Filter timed events by bookable
		if (timed) {
			const wanted = bookableIds(this.getNodeParameter('bookableFilter', ''));
			const timedEvent = (body.iw_timed_event as IDataObject) || {};
			if (wanted.length > 0 && !wanted.includes(String(timedEvent.bookable_id ?? ''))) {
				return {
					webhookResponse: 'Filtered',
				};
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(triggerOutput(body))],
		};
	}
}

/**
 * A failed registration of timed booking events: the setting is off, or the ERP is too old to
 * know the timed database actions.
 */
function timedRegistrationError(ctx: IHookFunctions, error: unknown): NodeApiError | NodeOperationError {
	const err = error as { description?: unknown; message?: unknown } | undefined;
	const description = String(err?.description ?? '');
	const setting = featureDisabledSetting(undefined, description) ?? featureDisabledSetting(undefined, err?.message);
	if (setting || /switched off/.test(String(err?.message ?? ''))) {
		return new NodeOperationError(
			ctx.getNode(),
			`Timed booking events are switched off in vynst (inwendo ERP). Enable the ERP setting "${setting ?? TIMED_SETTING}".`,
		);
	}
	if (/database_action/.test(description)) {
		return new NodeOperationError(
			ctx.getNode(),
			'This vynst (inwendo ERP) installation does not support timed booking events yet (update the ERP, then enable the setting ' +
				`"${TIMED_SETTING}").`,
			{ description },
		);
	}
	return asNodeError(ctx.getNode(), error);
}
