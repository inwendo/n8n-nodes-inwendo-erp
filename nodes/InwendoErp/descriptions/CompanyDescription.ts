import type { INodeProperties } from 'n8n-workflow';

export const companyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['company'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a company',
				action: 'Create a company',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a company by ID',
				action: 'Get a company',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many companies',
				action: 'Get many companies',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a company (PATCH)',
				action: 'Update a company',
			},
		],
		default: 'getAll',
	},
];

export const companyFields: INodeProperties[] = [
	// ----------------------------------
	//         company:get
	// ----------------------------------
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the company',
	},

	// ----------------------------------
	//         company:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['company'],
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
				resource: ['company'],
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
				resource: ['company'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter companies',
	},

	// ----------------------------------
	//         company:create
	// ----------------------------------
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['create'],
			},
		},
		description: 'The name of the company',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Short Name',
				name: 'shortName',
				type: 'string',
				default: '',
				description: 'Short name / abbreviation of the company',
			},
			{
				displayName: 'Secondary Name',
				name: 'secondaryName',
				type: 'string',
				default: '',
				description: 'Secondary name of the company',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'Category of the company',
			},
			{
				displayName: 'Is Customer',
				name: 'isCustomer',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Is Supplier',
				name: 'isSupplier',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Is Member',
				name: 'isMember',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'VAT ID',
				name: 'vatid',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tax Number',
				name: 'taxnumber',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tax',
				name: 'tax',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Type',
				name: 'paymentType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Goal',
				name: 'paymentGoal',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Interval',
				name: 'paymentInterval',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Invoice Email',
				name: 'invoiceEmail',
				type: 'string',
				default: '',
				description: 'Email address for invoices',
			},
			{
				displayName: 'Time Report Email',
				name: 'timeReportEmail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Info',
				name: 'info',
				type: 'string',
				default: '',
				description: 'Additional info text',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Direct Dial',
				name: 'directDial',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Slack Channel',
				name: 'slackchannel',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visible for Customer',
				name: 'visibleForCustomer',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Send Invoice Email',
				name: 'sendInvoiceEmail',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Send Invoice Letter',
				name: 'sendInvoiceLetter',
				type: 'boolean',
				default: false,
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
	//         company:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Short Name',
				name: 'shortName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Secondary Name',
				name: 'secondaryName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Is Customer',
				name: 'isCustomer',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Is Supplier',
				name: 'isSupplier',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Is Member',
				name: 'isMember',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'VAT ID',
				name: 'vatid',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tax Number',
				name: 'taxnumber',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Tax',
				name: 'tax',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Type',
				name: 'paymentType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Goal',
				name: 'paymentGoal',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Interval',
				name: 'paymentInterval',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Invoice Email',
				name: 'invoiceEmail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Time Report Email',
				name: 'timeReportEmail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Info',
				name: 'info',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Direct Dial',
				name: 'directDial',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Slack Channel',
				name: 'slackchannel',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visible for Customer',
				name: 'visibleForCustomer',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Send Invoice Email',
				name: 'sendInvoiceEmail',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Send Invoice Letter',
				name: 'sendInvoiceLetter',
				type: 'boolean',
				default: false,
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
