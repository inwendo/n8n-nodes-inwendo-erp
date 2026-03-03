import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

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
					'If set, validates the X-IW-Webhook-Token header from incoming requests. ' +
					'Must match the notificationClientToken configured on the webhook in the ERP.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Webhooks are manually configured in the ERP, so always return true
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// Webhook registration happens in the ERP via the Webhook resource
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// Webhook deletion happens in the ERP
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const headerData = this.getHeaderData() as IDataObject;

		// Validate webhook token if configured
		const expectedToken = this.getNodeParameter('webhookToken', '') as string;
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
