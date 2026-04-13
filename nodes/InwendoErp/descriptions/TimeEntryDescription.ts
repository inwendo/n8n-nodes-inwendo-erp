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
		description: 'Start date and time of the time entry',
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
				description: 'End date and time of the time entry (leave empty for running timer)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the work performed',
			},
			{
				displayName: 'Ticket ID',
				name: 'ticket',
				type: 'string',
				default: '',
				description: 'ID of the ticket this time entry is logged against',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
				description: 'ID of the user this time entry belongs to (defaults to authenticated user)',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'ID of the CRM person (contact) associated with this time entry',
			},
			{
				displayName: 'Billable',
				name: 'billable',
				type: 'boolean',
				default: true,
				description: 'Whether this time entry is billable to the customer',
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
				description: 'Start date and time of the time entry',
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
				description: 'End date and time of the time entry',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Description of the work performed',
			},
			{
				displayName: 'Ticket ID',
				name: 'ticket',
				type: 'string',
				default: '',
				description: 'ID of the ticket this time entry is logged against',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
				description: 'ID of the user this time entry belongs to',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'ID of the CRM person (contact) associated with this time entry',
			},
			{
				displayName: 'Billable',
				name: 'billable',
				type: 'boolean',
				default: true,
				description: 'Whether this time entry is billable to the customer',
			},
		],
	},
];
