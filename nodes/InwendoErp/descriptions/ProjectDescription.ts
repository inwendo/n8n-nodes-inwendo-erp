import type { INodeProperties } from 'n8n-workflow';

export const projectOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['project'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a project',
				action: 'Create a project',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a project by ID',
				action: 'Get a project',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many projects',
				action: 'Get many projects',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a project (PATCH)',
				action: 'Update a project',
			},
		],
		default: 'getAll',
	},
];

export const projectFields: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the project',
	},

	// ----------------------------------
	//         project:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['project'],
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
				resource: ['project'],
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
				resource: ['project'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter projects',
	},

	// ----------------------------------
	//         project:create
	// ----------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['create'],
			},
		},
		description: 'The name of the project',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Category ID',
				name: 'category',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
				description: 'ID of the associated company',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Invoice Email',
				name: 'invoiceEmail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Name for Customer',
				name: 'nameForCustomer',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Time Report Email',
				name: 'timeReportEmail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visible for Customer',
				name: 'visibleForCustomer',
				type: 'boolean',
				default: false,
			},
		],
	},

	// ----------------------------------
	//         project:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Billed',
				name: 'billed',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Category ID',
				name: 'category',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Closed',
				name: 'closed',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Invoice Email',
				name: 'invoiceEmail',
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
				displayName: 'Name for Customer',
				name: 'nameForCustomer',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Time Report Email',
				name: 'timeReportEmail',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visible for Customer',
				name: 'visibleForCustomer',
				type: 'boolean',
				default: false,
			},
		],
	},
];
