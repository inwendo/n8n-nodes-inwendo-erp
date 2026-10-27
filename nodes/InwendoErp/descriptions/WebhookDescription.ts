import type { INodeProperties } from 'n8n-workflow';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a webhook',
				action: 'Create a webhook',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a webhook by ID',
				action: 'Get a webhook',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many webhooks',
				action: 'Get many webhooks',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a webhook',
				action: 'Update a webhook',
			},
		],
		default: 'getAll',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the webhook',
	},

	// ----------------------------------
	//         webhook:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// ----------------------------------
	//         webhook:create
	// ----------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		description: 'Name of the webhook',
	},
	{
		displayName: 'Notification URL',
		name: 'notificationUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		description: 'The URL to send webhook notifications to',
	},
	{
		displayName: 'Reference Class Name',
		name: 'referenceClassName',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Booking', value: 'BaseBooking' },
			{ name: 'CRM Company', value: 'CRMCompany' },
			{ name: 'CRM Person', value: 'CRMPerson' },
			{ name: 'CRM Project', value: 'CRMProject' },
			{ name: 'Event', value: 'BaseEvent' },
			{ name: 'Event Sign-Up', value: 'BaseEventSignUp' },
			{ name: 'Invoice', value: 'Invoice' },
			{ name: 'News Article', value: 'MediaNewsArticle' },
			{ name: 'Offer', value: 'Offer' },
			{ name: 'Ticket', value: 'CustomerTicket' },
			{ name: 'Time Entry', value: 'TimeEntry' },
		],
		default: 'CRMCompany',
		description: 'The entity type to watch for changes',
	},
	{
		displayName: 'Database Action',
		name: 'databaseAction',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'Create', value: 'create' },
			{ name: 'Delete', value: 'delete' },
			{ name: 'Update', value: 'update' },
		],
		default: 'update',
		description: 'The database action to trigger on',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Client ID',
				name: 'notificationClientId',
				type: 'string',
				default: '',
				description: 'Client ID sent as X-IW-Client-ID header',
			},
			{
				displayName: 'Client Token',
				name: 'notificationClientToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Token sent as X-IW-Webhook-Token header',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Include Write Permission',
				name: 'includeWritePermission',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Notification Type',
				name: 'notificationType',
				type: 'options',
				options: [
					{ name: 'HTTP PATCH', value: 'HTTP_PATCH' },
					{ name: 'HTTP POST', value: 'HTTP_POST' },
					{ name: 'HTTP PUT', value: 'HTTP_PUT' },
				],
				default: 'HTTP_POST',
			},
			{
				displayName: 'Reference IDs',
				name: 'referenceIds',
				type: 'string',
				default: '',
				description: 'Comma-separated IDs to restrict webhook to specific entities',
			},
			{
				displayName: 'Request Timeout',
				name: 'requestTimeout',
				type: 'number',
				default: 30,
				description: 'Timeout in seconds for webhook HTTP request',
			},
		],
	},

	// ----------------------------------
	//         webhook:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Client ID',
				name: 'notificationClientId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Client Token',
				name: 'notificationClientToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
			},
			{
				displayName: 'Database Action',
				name: 'databaseAction',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Deleted',
				name: 'deleted',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Notification Type',
				name: 'notificationType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Notification URL',
				name: 'notificationUrl',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Reference Class Name',
				name: 'referenceClassName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Reference IDs',
				name: 'referenceIds',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Request Timeout',
				name: 'requestTimeout',
				type: 'number',
				default: 30,
			},
		],
	},
];
