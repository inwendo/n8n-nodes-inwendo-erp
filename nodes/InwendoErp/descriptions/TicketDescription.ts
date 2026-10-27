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
	{
		displayName: 'SLA Status',
		name: 'slaStatus',
		type: 'multiOptions',
		options: [
			{ name: 'Breached', value: 'breached' },
			{ name: 'Met', value: 'met' },
			{ name: 'Missed', value: 'missed' },
			{ name: 'Open', value: 'open' },
			{ name: 'Warning', value: 'warning' },
		],
		default: [],
		displayOptions: {
			show: {
				resource: ['ticket'],
				operation: ['getAll'],
			},
		},
		description:
			'Only tickets whose first response or resolution has one of these service-level states (ERP setting customer_panel_ticket_sla_enabled). Applied to the fetched tickets.',
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
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional custom data as JSON string',
			},
			{
				displayName: 'Assigned User ID',
				name: 'assignedUser',
				type: 'string',
				default: '',
				description: 'ID of the user this ticket is assigned to',
			},
			{
				displayName: 'Business Value',
				name: 'businessValue',
				type: 'number',
				default: 0,
				description: 'Business value / story points for prioritisation',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
				description: 'ID of the company associated with this ticket',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the ticket',
			},
			{
				displayName: 'Due Date',
				name: 'duedate',
				type: 'dateTime',
				default: '',
				description: 'Deadline for this ticket',
			},
			{
				displayName: 'Estimated Time (Hours)',
				name: 'estimatedTimeInHours',
				type: 'number',
				default: 0,
				description: 'Estimated effort in hours',
			},
			{
				displayName: 'In Portal',
				name: 'inportal',
				type: 'boolean',
				default: false,
				description: 'Whether the ticket is visible in the customer portal',
			},
			{
				displayName: 'Issue Category',
				name: 'issuecategory',
				type: 'string',
				default: '',
				description: 'Internal category for this ticket',
			},
			{
				displayName: 'Issue Type',
				name: 'issuetype',
				type: 'string',
				default: '',
				description: 'Type of issue (e.g. bug, task, story)',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'ID of the CRM person linked to this ticket',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'High', value: 2 },
					{ name: 'Low', value: 4 },
					{ name: 'Medium', value: 3 },
					{ name: 'On Fire (Critical)', value: 1 },
				],
				default: 3,
				description: 'Priority level of the ticket (1 = highest, 4 = lowest)',
			},
			{
				displayName: 'Project ID',
				name: 'crmProject',
				type: 'string',
				default: '',
				description: 'ID of the associated CRM project. Required for creating a ticket when the API token has the CRM Project scope.',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				description: 'Current status of the ticket (e.g. open, in-progress, done)',
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
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional custom data as JSON string',
			},
			{
				displayName: 'Assigned User ID',
				name: 'assignedUser',
				type: 'string',
				default: '',
				description: 'ID of the user this ticket is assigned to',
			},
			{
				displayName: 'Business Value',
				name: 'businessValue',
				type: 'number',
				default: 0,
				description: 'Business value / story points for prioritisation',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
				description: 'ID of the company associated with this ticket',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Detailed description of the ticket',
			},
			{
				displayName: 'Due Date',
				name: 'duedate',
				type: 'dateTime',
				default: '',
				description: 'Deadline for this ticket',
			},
			{
				displayName: 'Estimated Time (Hours)',
				name: 'estimatedTimeInHours',
				type: 'number',
				default: 0,
				description: 'Estimated effort in hours',
			},
			{
				displayName: 'Headline',
				name: 'headline',
				type: 'string',
				default: '',
				description: 'The headline / title of the ticket',
			},
			{
				displayName: 'In Portal',
				name: 'inportal',
				type: 'boolean',
				default: false,
				description: 'Whether the ticket is visible in the customer portal',
			},
			{
				displayName: 'Issue Category',
				name: 'issuecategory',
				type: 'string',
				default: '',
				description: 'Internal category for this ticket',
			},
			{
				displayName: 'Issue Type',
				name: 'issuetype',
				type: 'string',
				default: '',
				description: 'Type of issue (e.g. bug, task, story)',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'ID of the CRM person linked to this ticket',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'High', value: 2 },
					{ name: 'Low', value: 4 },
					{ name: 'Medium', value: 3 },
					{ name: 'On Fire (Critical)', value: 1 },
				],
				default: 3,
				description: 'Priority level of the ticket (1 = highest, 4 = lowest)',
			},
			{
				displayName: 'Project ID',
				name: 'crmProject',
				type: 'string',
				default: '',
				description: 'ID of the associated CRM project',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				description: 'Current status of the ticket (e.g. open, in-progress, done)',
			},
		],
	},
];
