import type { INodeProperties } from 'n8n-workflow';

export const eventOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['event'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an event',
				action: 'Create an event',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an event by ID',
				action: 'Get an event',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many events',
				action: 'Get many events',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an event (PATCH)',
				action: 'Update an event',
			},
		],
		default: 'getAll',
	},
];

export const eventFields: INodeProperties[] = [
	{
		displayName: 'Event ID',
		name: 'eventId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the event',
	},

	// ----------------------------------
	//         event:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['event'],
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
				resource: ['event'],
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
				resource: ['event'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter events',
	},

	// ----------------------------------
	//         event:create
	// ----------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['create'],
			},
		},
		description: 'The name of the event',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['event'],
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
				displayName: 'Event Type',
				name: 'eventType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visibility Type',
				name: 'visibilityType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Start Time',
				name: 'startTime',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'End Time',
				name: 'endTime',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Contact Person ID',
				name: 'contactPerson',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Performing Person ID',
				name: 'performingPerson',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Location ID',
				name: 'baseLocation',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Bookable ID',
				name: 'baseBookable',
				type: 'string',
				default: '',
			},
			{
				displayName: 'People Limit',
				name: 'eventPeopleLimit',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'People Min Limit',
				name: 'eventPeopleMinLimit',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Has Wait List',
				name: 'hasWaitList',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Keywords',
				name: 'publicKeywords',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Slug Identifier',
				name: 'slugIdentifier',
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

	// ----------------------------------
	//         event:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
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
				displayName: 'Event Type',
				name: 'eventType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visibility Type',
				name: 'visibilityType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Start Time',
				name: 'startTime',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'End Time',
				name: 'endTime',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Contact Person ID',
				name: 'contactPerson',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Performing Person ID',
				name: 'performingPerson',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Location ID',
				name: 'baseLocation',
				type: 'string',
				default: '',
			},
			{
				displayName: 'People Limit',
				name: 'eventPeopleLimit',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Has Wait List',
				name: 'hasWaitList',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Deleted',
				name: 'deleted',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Slug Identifier',
				name: 'slugIdentifier',
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
