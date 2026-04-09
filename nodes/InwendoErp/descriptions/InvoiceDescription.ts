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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Internal name / title for this invoice',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message / note printed on the invoice',
			},
			{
				displayName: 'Accounting Type ID',
				name: 'accountingType',
				type: 'string',
				default: '',
				description: 'ID of the accounting type (determines booking account)',
			},
			{
				displayName: 'Tax ID',
				name: 'tax',
				type: 'string',
				default: '',
				description: 'ID of the tax configuration (e.g. 19% VAT)',
			},
			{
				displayName: 'Payment Type ID',
				name: 'paymentType',
				type: 'string',
				default: '',
				description: 'ID of the payment type (e.g. bank transfer, direct debit)',
			},
			{
				displayName: 'Payment Goal ID',
				name: 'paymentGoal',
				type: 'string',
				default: '',
				description: 'ID of the payment goal (due date configuration)',
			},
			{
				displayName: 'Offer ID',
				name: 'offer',
				type: 'string',
				default: '',
				description: 'ID of the offer this invoice is based on',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Service / billing period start date',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Service / billing period end date',
			},
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
				description: 'Date the invoice was paid',
			},
			{
				displayName: 'Send via Email',
				name: 'mitShouldSendEmail',
				type: 'boolean',
				default: false,
				description: 'Whether to send this invoice via email automatically',
			},
			{
				displayName: 'Send via Post',
				name: 'mitShouldSendPostal',
				type: 'boolean',
				default: false,
				description: 'Whether to send this invoice via postal mail automatically',
			},
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether to archive this invoice',
			},
			{
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional custom data as JSON string',
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Internal name / title for this invoice',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message / note printed on the invoice',
			},
			{
				displayName: 'Accounting Type ID',
				name: 'accountingType',
				type: 'string',
				default: '',
				description: 'ID of the accounting type (determines booking account)',
			},
			{
				displayName: 'Tax ID',
				name: 'tax',
				type: 'string',
				default: '',
				description: 'ID of the tax configuration (e.g. 19% VAT)',
			},
			{
				displayName: 'Payment Type ID',
				name: 'paymentType',
				type: 'string',
				default: '',
				description: 'ID of the payment type (e.g. bank transfer, direct debit)',
			},
			{
				displayName: 'Payment Goal ID',
				name: 'paymentGoal',
				type: 'string',
				default: '',
				description: 'ID of the payment goal (due date configuration)',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Service / billing period start date',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Service / billing period end date',
			},
			{
				displayName: 'Payment Date',
				name: 'paymentDate',
				type: 'dateTime',
				default: '',
				description: 'Date the invoice was paid',
			},
			{
				displayName: 'Send via Email',
				name: 'mitShouldSendEmail',
				type: 'boolean',
				default: false,
				description: 'Whether to send this invoice via email automatically',
			},
			{
				displayName: 'Send via Post',
				name: 'mitShouldSendPostal',
				type: 'boolean',
				default: false,
				description: 'Whether to send this invoice via postal mail automatically',
			},
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether to archive this invoice',
			},
			{
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional custom data as JSON string',
			},
		],
	},
];
