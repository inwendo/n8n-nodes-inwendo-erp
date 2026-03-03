import type { INodeProperties } from 'n8n-workflow';

export const invoiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['invoice'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an invoice',
				action: 'Create an invoice',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an invoice by ID',
				action: 'Get an invoice',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many invoices',
				action: 'Get many invoices',
			},
			{
				name: 'Get PDF',
				value: 'getPdf',
				description: 'Get the PDF of an invoice',
				action: 'Get invoice PDF',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an invoice (PATCH)',
				action: 'Update an invoice',
			},
		],
		default: 'getAll',
	},
];

export const invoiceFields: INodeProperties[] = [
	// ----------------------------------
	//         invoice:get / update / getPdf
	// ----------------------------------
	{
		displayName: 'Invoice ID',
		name: 'invoiceId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['get', 'update', 'getPdf'],
			},
		},
		description: 'The ID of the invoice',
	},

	// ----------------------------------
	//         invoice:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['invoice'],
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
				resource: ['invoice'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Search String',
		name: 'searchString',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter invoices',
	},

	// ----------------------------------
	//         invoice:create
	// ----------------------------------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Invoice message / note',
			},
			{
				displayName: 'Accounting Type ID',
				name: 'accountingType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tax ID',
				name: 'tax',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Type ID',
				name: 'paymentType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Goal ID',
				name: 'paymentGoal',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Offer ID',
				name: 'offer',
				type: 'string',
				default: '',
				description: 'Link to an existing offer',
			},
			{
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional data as JSON string',
			},
		],
	},

	// ----------------------------------
	//         invoice:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Accounting Type ID',
				name: 'accountingType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tax ID',
				name: 'tax',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Type ID',
				name: 'paymentType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Goal ID',
				name: 'paymentGoal',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional data as JSON string',
			},
		],
	},
];
