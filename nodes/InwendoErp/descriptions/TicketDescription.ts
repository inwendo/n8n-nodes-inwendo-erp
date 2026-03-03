import type { INodeProperties } from 'n8n-workflow';

export const ticketOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ticket'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a ticket',
				action: 'Create a ticket',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a ticket by ID',
				action: 'Get a ticket',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many tickets',
				action: 'Get many tickets',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a ticket (PATCH)',
				action: 'Update a ticket',
			},
		],
		default: 'getAll',
	},
];

export const ticketFields: INodeProperties[] = [
	{
		displayName: 'Ticket ID',
		name: 'ticketId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the ticket',
	},

	// ----------------------------------
	//         ticket:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['ticket'],
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
				resource: ['ticket'],
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
				resource: ['ticket'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter tickets',
	},

	// ----------------------------------
	//         ticket:create
	// ----------------------------------
	{
		displayName: 'Headline',
		name: 'headline',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		description: 'The headline / title of the ticket',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Issue Type',
				name: 'issuetype',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Issue Category',
				name: 'issuecategory',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Normal', value: 'normal' },
					{ name: 'High', value: 'high' },
					{ name: 'Critical', value: 'critical' },
				],
				default: 'normal',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
				description: 'ID of the associated company',
			},
			{
				displayName: 'Project ID',
				name: 'crmProject',
				type: 'string',
				default: '',
				description: 'ID of the associated project',
			},
			{
				displayName: 'Assigned User ID',
				name: 'assignedUser',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Estimated Time (Hours)',
				name: 'estimatedTimeInHours',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Business Value',
				name: 'businessValue',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Due Date',
				name: 'duedate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'In Portal',
				name: 'inportal',
				type: 'boolean',
				default: false,
				description: 'Whether the ticket is visible in the customer portal',
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
	//         ticket:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Headline',
				name: 'headline',
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
				displayName: 'Issue Type',
				name: 'issuetype',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Normal', value: 'normal' },
					{ name: 'High', value: 'high' },
					{ name: 'Critical', value: 'critical' },
				],
				default: 'normal',
			},
			{
				displayName: 'Project ID',
				name: 'crmProject',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Assigned User ID',
				name: 'assignedUser',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Estimated Time (Hours)',
				name: 'estimatedTimeInHours',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Business Value',
				name: 'businessValue',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Due Date',
				name: 'duedate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'In Portal',
				name: 'inportal',
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
