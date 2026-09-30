import type { INodeProperties } from 'n8n-workflow';

export const offerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['offer'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an offer',
				action: 'Create an offer',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an offer by ID',
				action: 'Get an offer',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many offers',
				action: 'Get many offers',
			},
			{
				name: 'Get PDF',
				value: 'getPdf',
				description: 'Get the PDF of an offer',
				action: 'Get offer PDF',
			},
		],
		default: 'getAll',
	},
];

export const offerFields: INodeProperties[] = [
	{
		displayName: 'Offer ID',
		name: 'offerId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['offer'],
				operation: ['get', 'getPdf'],
			},
		},
		description: 'The ID of the offer',
	},

	// ----------------------------------
	//         offer:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['offer'],
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
				resource: ['offer'],
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
				resource: ['offer'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter offers',
	},

	// ----------------------------------
	//         offer:create
	// ----------------------------------
	{
		displayName: 'Offer Accounting Type ID',
		name: 'offerAccountingType',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['offer'],
				operation: ['create'],
			},
		},
		description: 'ID of the offer accounting type',
	},
	{
		displayName: 'Tax ID',
		name: 'tax',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['offer'],
				operation: ['create'],
			},
		},
		description: 'ID of the tax configuration (e.g. 19% VAT)',
	},
	{
		displayName: 'Payment Goal ID',
		name: 'paymentGoal',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['offer'],
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
				resource: ['offer'],
				operation: ['create'],
			},
		},
		description: 'Name of the buyer (company or person) printed on the offer',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['offer'],
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
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message / note printed on the offer',
			},
		],
	},
];
