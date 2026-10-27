import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import type { ErpResponse } from './GenericFunctions';
import {
	asNodeError,
	inwendoErpApiRequest,
	inwendoErpApiRequestAllItems,
	inwendoErpApiRequestBinary,
} from './GenericFunctions';

import { companyOperations, companyFields } from './descriptions/CompanyDescription';
import { personOperations, personFields } from './descriptions/PersonDescription';
import { invoiceOperations, invoiceFields } from './descriptions/InvoiceDescription';
import { offerOperations, offerFields } from './descriptions/OfferDescription';
import { ticketOperations, ticketFields } from './descriptions/TicketDescription';
import { projectOperations, projectFields } from './descriptions/ProjectDescription';
import { timeEntryOperations, timeEntryFields } from './descriptions/TimeEntryDescription';
import { bookingOperations, bookingFields } from './descriptions/BookingDescription';
import { eventOperations, eventFields } from './descriptions/EventDescription';
import { eventSignUpOperations, eventSignUpFields } from './descriptions/EventSignUpDescription';
import { newsArticleOperations, newsArticleFields } from './descriptions/NewsArticleDescription';
import { webhookOperations, webhookFields } from './descriptions/WebhookDescription';
import { smartLockOperations, smartLockFields } from './descriptions/SmartLockDescription';
import { inventoryLoanOperations, inventoryLoanFields } from './descriptions/InventoryLoanDescription';
import { shiftPlanEntryOperations, shiftPlanEntryFields } from './descriptions/ShiftPlanEntryDescription';
import {
	volunteerHourEntryOperations,
	volunteerHourEntryFields,
	helperShiftOperations,
	helperShiftFields,
} from './descriptions/VolunteerDescription';
import { membershipPauseOperations, membershipPauseFields } from './descriptions/MembershipPauseDescription';
import { generalMeetingOperations, generalMeetingFields } from './descriptions/GeneralMeetingDescription';
import { occupancyOperations, occupancyFields } from './descriptions/OccupancyDescription';
import { usageCounterOperations, usageCounterFields } from './descriptions/UsageCounterDescription';
import { notificationOperations, notificationFields } from './descriptions/NotificationDescription';
import {
	ACTION_RESOURCES,
	executeResourceAction,
	filterTicketsBySla,
	flattenTicketSla,
} from './ResourceActions';

/** Smart lock operations that are no plain CRUD request. */
const SMART_LOCK_ACTIONS = ['unlock', 'lock', 'status', 'checkAccess', 'getLog'];

/**
 * Map of resource names to their API endpoint paths.
 */
const RESOURCE_ENDPOINTS: Record<string, string> = {
	company: '/api/crm/crmcompanies',
	person: '/api/crm/crmpeople',
	project: '/api/crm/crmprojects',
	ticket: '/api/crm/tickets',
	timeEntry: '/api/time/entries',
	invoice: '/api/invoice/invoices',
	offer: '/api/invoice/offers',
	booking: '/api/event/base_booking',
	event: '/api/event/base_event',
	eventSignUp: '/api/event/base_event_signup',
	newsArticle: '/api/media/news_article',
	webhook: '/api/dw/webhook',
	smartLock: '/api/event/smart_lock',
};

/**
 * Map of resource names to the Symfony form block prefix expected by the
 * ERP API. POST/PATCH/PUT bodies must be wrapped under this key so that
 * $form->handleRequest() reads them correctly on the server side.
 */
const RESOURCE_BLOCK_PREFIXES: Record<string, string> = {
	company: 'crmcompany',
	person: 'crmperson',
	project: 'crmproject',
	ticket: 'ticket',
	timeEntry: 'time_entry',
	invoice: 'invoice',
	offer: 'offer',
	booking: 'data',
	event: 'data',
	eventSignUp: 'data',
	newsArticle: 'data',
	webhook: 'data',
	smartLock: 'data',
};

/**
 * Additional fields of invoices and offers that go into the nested `buyer` form.
 */
const BUYER_FIELDS: Record<string, string> = {
	buyerSecondaryName: 'secondaryName',
	buyerVatId: 'vatId',
	buyerTaxnumber: 'taxnumber',
	buyerReferenceId: 'buyerReferenceId',
};

/**
 * Map of resource names to the field name that holds their ID parameter.
 */
const RESOURCE_ID_FIELDS: Record<string, string> = {
	company: 'companyId',
	person: 'personId',
	project: 'projectId',
	ticket: 'ticketId',
	timeEntry: 'timeEntryId',
	invoice: 'invoiceId',
	offer: 'offerId',
	booking: 'bookingId',
	event: 'eventId',
	eventSignUp: 'eventSignUpId',
	newsArticle: 'newsArticleId',
	webhook: 'webhookId',
	smartLock: 'smartLockId',
};

/** n8n items carry an object; plain ERP answers (a count, an id) are wrapped as { data }. */
function toJson(value: unknown): IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as IDataObject)
		: { data: value as IDataObject[keyof IDataObject] };
}

export class InwendoErp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'vynst (inwendo ERP)',
		name: 'inwendoErp',
		icon: { light: 'file:../../icons/vynst.svg', dark: 'file:../../icons/vynst.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the inwendo ERP API',
		defaults: {
			name: 'vynst (inwendo ERP)',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'inwendoErpApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Booking', value: 'booking' },
					{ name: 'Company', value: 'company' },
					{ name: 'Event', value: 'event' },
					{ name: 'Event Sign-Up', value: 'eventSignUp' },
					{ name: 'General Meeting', value: 'generalMeeting' },
					{ name: 'Generic API Request', value: 'genericRequest' },
					{ name: 'Helper Shift', value: 'helperShift' },
					{ name: 'Inventory Loan', value: 'inventoryLoan' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Membership Pause', value: 'membershipPause' },
					{ name: 'News Article', value: 'newsArticle' },
					{ name: 'Notification', value: 'notification' },
					{ name: 'Occupancy', value: 'occupancy' },
					{ name: 'Offer', value: 'offer' },
					{ name: 'Person', value: 'person' },
					{ name: 'Project', value: 'project' },
					{ name: 'Shift Plan Entry', value: 'shiftPlanEntry' },
					{ name: 'Smart Lock', value: 'smartLock' },
					{ name: 'Ticket', value: 'ticket' },
					{ name: 'Time Entry', value: 'timeEntry' },
					{ name: 'Usage Counter', value: 'usageCounter' },
					{ name: 'Volunteer Hour Entry', value: 'volunteerHourEntry' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'company',
			},

			// Generic API Request fields
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['genericRequest'],
					},
				},
				options: [
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'GET', value: 'GET' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
				],
				default: 'GET',
				description: 'The HTTP method to use',
			},
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['genericRequest'],
					},
				},
				default: '',
				placeholder: '/api/crm/crmcompanies',
				required: true,
				description: 'The API endpoint path (e.g. /api/crm/crmcompanies)',
			},
			{
				displayName: 'Body (JSON)',
				name: 'body',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['genericRequest'],
						httpMethod: ['POST', 'PUT', 'PATCH'],
					},
				},
				default: '{}',
				required: true,
				description: 'The request body as JSON',
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['genericRequest'],
					},
				},
				default: {},
				options: [
					{
						name: 'parameter',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},

			// All resource operations and fields
			...companyOperations,
			...companyFields,
			...personOperations,
			...personFields,
			...invoiceOperations,
			...invoiceFields,
			...offerOperations,
			...offerFields,
			...ticketOperations,
			...ticketFields,
			...projectOperations,
			...projectFields,
			...timeEntryOperations,
			...timeEntryFields,
			...bookingOperations,
			...bookingFields,
			...eventOperations,
			...eventFields,
			...eventSignUpOperations,
			...eventSignUpFields,
			...newsArticleOperations,
			...newsArticleFields,
			...webhookOperations,
			...webhookFields,
			...smartLockOperations,
			...smartLockFields,
			...inventoryLoanOperations,
			...inventoryLoanFields,
			...shiftPlanEntryOperations,
			...shiftPlanEntryFields,
			...volunteerHourEntryOperations,
			...volunteerHourEntryFields,
			...helperShiftOperations,
			...helperShiftFields,
			...membershipPauseOperations,
			...membershipPauseFields,
			...generalMeetingOperations,
			...generalMeetingFields,
			...occupancyOperations,
			...occupancyFields,
			...usageCounterOperations,
			...usageCounterFields,
			...notificationOperations,
			...notificationFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				// Handle Generic API Request
				if (resource === 'genericRequest') {
					const method = this.getNodeParameter('httpMethod', i) as string;
					const endpoint = this.getNodeParameter('endpoint', i) as string;
					const queryParams = this.getNodeParameter(
						'queryParameters.parameter',
						i,
						[],
					) as Array<{ name: string; value: string }>;

					const qs: IDataObject = {};
					for (const param of queryParams) {
						qs[param.name] = param.value;
					}

					let body: IDataObject | undefined;
					if (['POST', 'PUT', 'PATCH'].includes(method)) {
						const bodyJson = this.getNodeParameter('body', i, '') as string;
						if (bodyJson) {
							body = JSON.parse(bodyJson) as IDataObject;
						}
					}

					const responseData = await inwendoErpApiRequest.call(
						this,
						method as IHttpRequestMethods,
						endpoint,
						body,
						qs,
					);
					for (const item of Array.isArray(responseData) ? responseData : [responseData]) {
						returnData.push({ json: toJson(item), pairedItem: { item: i } });
					}
					continue;
				}

				// Handle standard resources
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'smartLock' && SMART_LOCK_ACTIONS.includes(operation)) {
					const result = await executeSmartLockAction.call(this, operation, i);
					for (const item of Array.isArray(result) ? result : [result]) {
						returnData.push({ json: item, pairedItem: { item: i } });
					}
					continue;
				}
				if (ACTION_RESOURCES.includes(resource)) {
					const result = await executeResourceAction.call(this, resource, operation, i);
					for (const item of Array.isArray(result) ? result : [result]) {
						returnData.push({ json: toJson(item), pairedItem: { item: i } });
					}
					continue;
				}
				const basePath = RESOURCE_ENDPOINTS[resource];
				const idField = RESOURCE_ID_FIELDS[resource];

				if (!basePath) {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				let responseData: ErpResponse;

				switch (operation) {
					case 'get': {
						const id = this.getNodeParameter(idField, i) as string;
						responseData = await inwendoErpApiRequest.call(this, 'GET', `${basePath}/${id}`);
						break;
					}

					case 'getAll': {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const qs: IDataObject = {};

						// Add search string if available
						try {
							const searchString = this.getNodeParameter('searchString', i, '') as string;
							if (searchString) {
								qs.searchString = searchString;
							}
						} catch {
							// searchString not available for this resource
						}

						if (returnAll) {
							responseData = await inwendoErpApiRequestAllItems.call(
								this,
								'GET',
								basePath,
								qs,
							);
						} else {
							// The ERP only honours pageSize together with a (0-based) page.
							const limit = this.getNodeParameter('limit', i) as number;
							qs.page = '0';
							qs.pageSize = String(limit);
							responseData = await inwendoErpApiRequest.call(
								this,
								'GET',
								basePath,
								undefined,
								qs,
							);
							if (Array.isArray(responseData)) {
								responseData = responseData.slice(0, limit);
							}
						}
						break;
					}

					case 'create': {
						const body: IDataObject = {};

						// Collect required fields based on resource
						switch (resource) {
							case 'company':
								body.companyName = this.getNodeParameter('companyName', i) as string;
								break;
							case 'person':
								body.firstName = this.getNodeParameter('firstName', i) as string;
								body.lastName = this.getNodeParameter('lastName', i) as string;
								break;
							case 'ticket':
								body.headline = this.getNodeParameter('headline', i) as string;
								break;
							case 'project':
							case 'event':
							case 'newsArticle':
								body.name = this.getNodeParameter('name', i) as string;
								break;
							case 'timeEntry':
								body.start = this.getNodeParameter('start', i) as string;
								break;
							case 'invoice':
								body.accountingType = this.getNodeParameter('accountingType', i) as string;
								body.tax = this.getNodeParameter('tax', i) as string;
								body.paymentType = this.getNodeParameter('paymentType', i) as string;
								body.paymentGoal = this.getNodeParameter('paymentGoal', i) as string;
								body.buyer = { name: this.getNodeParameter('buyerName', i) as string };
								break;
							case 'offer':
								body.offerAccountingType = this.getNodeParameter('offerAccountingType', i) as string;
								body.tax = this.getNodeParameter('tax', i) as string;
								body.paymentGoal = this.getNodeParameter('paymentGoal', i) as string;
								body.buyer = { name: this.getNodeParameter('buyerName', i) as string };
								break;
							case 'eventSignUp':
								body.firstName = this.getNodeParameter('firstName', i) as string;
								body.lastName = this.getNodeParameter('lastName', i) as string;
								break;
							case 'webhook':
								body.name = this.getNodeParameter('name', i) as string;
								body.notificationUrl = this.getNodeParameter('notificationUrl', i) as string;
								body.referenceClassName = this.getNodeParameter('referenceClassName', i) as string;
								body.databaseAction = this.getNodeParameter('databaseAction', i) as string;
								break;
						}

						// Add additional fields; buyer* fields of invoices and offers belong to the nested buyer
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						for (const [key, value] of Object.entries(additionalFields)) {
							const buyerField = BUYER_FIELDS[key];
							if (buyerField && body.buyer) {
								(body.buyer as IDataObject)[buyerField] = value;
							} else {
								body[key] = value;
							}
						}

						responseData = await inwendoErpApiRequest.call(
							this,
							'POST',
							basePath,
							{ [RESOURCE_BLOCK_PREFIXES[resource]]: body },
						);
						break;
					}

					case 'update': {
						const id = this.getNodeParameter(idField, i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						if (Object.keys(updateFields).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'At least one update field must be set',
								{ itemIndex: i },
							);
						}

						// PATCH only changes the given fields; PUT would clear all others.
						responseData = await inwendoErpApiRequest.call(
							this,
							'PATCH',
							`${basePath}/${id}`,
							{ [RESOURCE_BLOCK_PREFIXES[resource]]: updateFields },
						);
						break;
					}

					case 'getPdf': {
						const id = this.getNodeParameter(
							resource === 'invoice' ? 'invoiceId' : 'offerId',
							i,
						) as string;
						const pdf = await inwendoErpApiRequestBinary.call(this, `${basePath}/${id}/pdf`);
						const binaryData = await this.helpers.prepareBinaryData(
							pdf.data,
							`${resource}-${id}.pdf`,
							pdf.contentType || 'application/pdf',
						);
						returnData.push({
							json: { id, resource },
							binary: { data: binaryData },
							pairedItem: { item: i },
						});
						continue;
					}

					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown operation: ${operation}`,
							{ itemIndex: i },
						);
				}

				// Tickets: service-level state at the top level, optional filter by it
				if (resource === 'ticket' && (operation === 'get' || operation === 'getAll')) {
					if (Array.isArray(responseData)) {
						const slaStatus = this.getNodeParameter('slaStatus', i, []) as string[];
						responseData = filterTicketsBySla(responseData, slaStatus).map(flattenTicketSla);
					} else if (responseData && typeof responseData === 'object') {
						responseData = flattenTicketSla(responseData);
					}
				}

				// Normalize response to array
				for (const item of Array.isArray(responseData) ? responseData : [responseData]) {
					returnData.push({ json: toJson(item), pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw asNodeError(this.getNode(), error, i);
			}
		}

		return [returnData];
	}
}

/**
 * Smart lock actions: open / lock / state through the lock's provider (with the rights of the
 * token's user, written to the smart lock log), the smart lock log and the access check of a reader
 * (/api/n8n/smart_lock/check_access, same rules as the app).
 */
async function executeSmartLockAction(this: IExecuteFunctions, operation: string, i: number): Promise<ErpResponse> {
	if (operation === 'getLog') {
		const qs: IDataObject = {};
		const smartLockId = String(this.getNodeParameter('logSmartLockId', i, '') || '').trim();
		if (smartLockId) {
			qs.smartLock = smartLockId;
		}
		if (this.getNodeParameter('returnAll', i) as boolean) {
			return await inwendoErpApiRequestAllItems.call(this, 'GET', '/api/event/smart_lock_log', qs);
		}
		const limit = this.getNodeParameter('limit', i) as number;
		const items = await inwendoErpApiRequest.call(this, 'GET', '/api/event/smart_lock_log', undefined, {
			...qs,
			page: '0',
			pageSize: String(limit),
		});
		return Array.isArray(items) ? items.slice(0, limit) : items;
	}

	const smartLockId = String(this.getNodeParameter('smartLockId', i) || '').trim();
	if (!smartLockId) {
		throw new NodeOperationError(this.getNode(), 'Smart Lock ID is required', { itemIndex: i });
	}
	switch (operation) {
		case 'unlock':
		case 'lock':
			return await inwendoErpApiRequest.call(this, 'POST', `/api/event/smart_lock/${smartLockId}/${operation}`, {});
		case 'status':
			return await inwendoErpApiRequest.call(this, 'GET', `/api/event/smart_lock/${smartLockId}/status`);
		default: {
			const credential = String(this.getNodeParameter('credential', i) ?? '').replace(/[\r\n\t\0]+/g, '').trim();
			if (!credential) {
				throw new NodeOperationError(this.getNode(), 'Credential is required', { itemIndex: i });
			}
			const answer = await inwendoErpApiRequest.call(this, 'POST', '/api/n8n/smart_lock/check_access', {
				smart_lock_id: Number(smartLockId),
				credential,
				credential_type: this.getNodeParameter('credentialType', i, 'auto') as string,
				open: this.getNodeParameter('open', i, false) as boolean,
			});
			return { ...answer, credential };
		}
	}
}
