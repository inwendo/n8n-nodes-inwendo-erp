import type { INodeProperties } from 'n8n-workflow';

export const bookingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['booking'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a booking',
				action: 'Create a booking',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a booking by ID',
				action: 'Get a booking',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many bookings',
				action: 'Get many bookings',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a booking (PATCH)',
				action: 'Update a booking',
			},
		],
		default: 'getAll',
	},
];

export const bookingFields: INodeProperties[] = [
	{
		displayName: 'Booking ID',
		name: 'bookingId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['booking'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the booking',
	},

	// ----------------------------------
	//         booking:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['booking'],
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
				resource: ['booking'],
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
				resource: ['booking'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter bookings',
	},

	// ----------------------------------
	//         booking:create
	// ----------------------------------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['booking'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Event ID',
				name: 'baseEvent',
				type: 'string',
				default: '',
				description: 'ID of the associated event',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Booking Type',
				name: 'bookingType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Booking Status',
				name: 'bookingStatus',
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
				displayName: 'Confirmed',
				name: 'confirmed',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Waiting',
				name: 'waiting',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Billed',
				name: 'billed',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'External',
				name: 'external',
				type: 'boolean',
				default: false,
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
				displayName: 'Participant ID',
				name: 'participant',
				type: 'string',
				default: '',
				description: 'ID of the participant person',
			},
			{
				displayName: 'Participant Name',
				name: 'participantName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Participant Email',
				name: 'participantEmail',
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
	//         booking:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['booking'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Booking Type',
				name: 'bookingType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Booking Status',
				name: 'bookingStatus',
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
				displayName: 'Confirmed',
				name: 'confirmed',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Waiting',
				name: 'waiting',
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
				displayName: 'Billed',
				name: 'billed',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'External',
				name: 'external',
				type: 'boolean',
				default: false,
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
				displayName: 'Addon Data',
				name: 'addonData',
				type: 'string',
				default: '',
				description: 'Additional data as JSON string',
			},
		],
	},
];
