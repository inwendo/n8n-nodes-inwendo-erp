import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
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
};

export class InwendoErp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'inwendo ERP',
		name: 'inwendoErp',
		icon: 'file:../../icons/inwendo.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the inwendo ERP API',
		defaults: {
			name: 'inwendo ERP',
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
					{ name: 'Generic API Request', value: 'genericRequest' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'News Article', value: 'newsArticle' },
					{ name: 'Offer', value: 'offer' },
					{ name: 'Person', value: 'person' },
					{ name: 'Project', value: 'project' },
					{ name: 'Ticket', value: 'ticket' },
					{ name: 'Time Entry', value: 'timeEntry' },
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
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'DELETE', value: 'DELETE' },
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
				default: '',
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
						method as any,
						endpoint,
						body,
						qs,
					);
					returnData.push({
						json: typeof responseData === 'object' ? responseData : { data: responseData },
					});
					continue;
				}

				// Handle standard resources
				const operation = this.getNodeParameter('operation', i) as string;
				const basePath = RESOURCE_ENDPOINTS[resource];
				const idField = RESOURCE_ID_FIELDS[resource];

				if (!basePath) {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				let responseData: any;

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

				// Normalize response to array
				if (Array.isArray(responseData)) {
					for (const item of responseData) {
						returnData.push({ json: item });
					}
				} else {
					returnData.push({
						json: typeof responseData === 'object' ? responseData : { data: responseData },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
