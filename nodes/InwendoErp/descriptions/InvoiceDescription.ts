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
		],
		default: 'getAll',
	},
];

export const invoiceFields: INodeProperties[] = [
	// ----------------------------------
	//         invoice:get / getPdf
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
				operation: ['get', 'getPdf'],
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
		displayName: 'Accounting Type ID',
		name: 'accountingType',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		description: 'ID of the accounting type (determines booking account)',
	},
	{
		displayName: 'Tax ID',
		name: 'tax',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		description: 'ID of the tax configuration (e.g. 19% VAT)',
	},
	{
		displayName: 'Payment Type ID',
		name: 'paymentType',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		description: 'ID of the payment type (e.g. bank transfer, direct debit)',
	},
	{
		displayName: 'Payment Goal ID',
		name: 'paymentGoal',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		description: 'ID of the payment goal (due date configuration)',
	},
	{
		displayName: 'Buyer Name',
		name: 'buyerName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		description: 'Name of the buyer (company or person) printed on the invoice',
	},
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
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional custom data as JSON string',
			},
			{
				displayName: 'Billing Payment Profile ID',
				name: 'billingPaymentProfile',
				type: 'string',
				default: '',
				description: 'ID of the billing payment profile (e.g. SEPA mandate)',
			},
			{
				displayName: 'Booking ID',
				name: 'baseBooking',
				type: 'string',
				default: '',
				description: 'ID of the booking this invoice bills',
			},
			{
				displayName: 'Buyer Reference ID',
				name: 'buyerReferenceId',
				type: 'string',
				default: '',
				description: 'Buyer reference (Leitweg-ID) for e-invoices',
			},
			{
				displayName: 'Buyer Secondary Name',
				name: 'buyerSecondaryName',
				type: 'string',
				default: '',
				description: 'Second name line of the buyer',
			},
			{
				displayName: 'Buyer Tax Number',
				name: 'buyerTaxnumber',
				type: 'string',
				default: '',
				description: 'Tax number of the buyer',
			},
			{
				displayName: 'Buyer VAT ID',
				name: 'buyerVatId',
				type: 'string',
				default: '',
				description: 'VAT identification number of the buyer',
			},
			{
				displayName: 'Event Sign-Up ID',
				name: 'baseEventSignUp',
				type: 'string',
				default: '',
				description: 'ID of the event sign-up this invoice bills',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message / note printed on the invoice',
			},
			{
				displayName: 'Offer ID',
				name: 'offer',
				type: 'string',
				default: '',
				description: 'ID of the offer this invoice is based on',
			},
		],
	},
];
