import type { INodeProperties } from 'n8n-workflow';

export const timeEntryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['timeEntry'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a time entry',
				action: 'Create a time entry',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a time entry by ID',
				action: 'Get a time entry',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many time entries',
				action: 'Get many time entries',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a time entry (PATCH)',
				action: 'Update a time entry',
			},
		],
		default: 'getAll',
	},
];

export const timeEntryFields: INodeProperties[] = [
	{
		displayName: 'Time Entry ID',
		name: 'timeEntryId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['timeEntry'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the time entry',
	},

	// ----------------------------------
	//         timeEntry:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['timeEntry'],
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
				resource: ['timeEntry'],
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
				resource: ['timeEntry'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter time entries',
	},

	// ----------------------------------
	//         timeEntry:create
	// ----------------------------------
	{
		displayName: 'Start',
		name: 'start',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['timeEntry'],
				operation: ['create'],
			},
		},
		description: 'Start time of the entry',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['timeEntry'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
				description: 'End time of the entry',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Ticket ID',
				name: 'ticket',
				type: 'string',
				default: '',
				description: 'ID of the associated ticket',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
				description: 'ID of the user this entry belongs to',
			},
			{
				displayName: 'Billable',
				name: 'billable',
				type: 'boolean',
				default: true,
			},
		],
	},

	// ----------------------------------
	//         timeEntry:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['timeEntry'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Ticket ID',
				name: 'ticket',
				type: 'string',
				default: '',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Billable',
				name: 'billable',
				type: 'boolean',
				default: true,
			},
		],
	},
];
