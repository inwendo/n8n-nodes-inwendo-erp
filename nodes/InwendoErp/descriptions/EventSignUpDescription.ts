import type { INodeProperties } from 'n8n-workflow';

export const eventSignUpOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an event sign-up',
				action: 'Create an event sign-up',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an event sign-up by ID',
				action: 'Get an event sign-up',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many event sign-ups',
				action: 'Get many event sign-ups',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an event sign-up (PATCH)',
				action: 'Update an event sign-up',
			},
		],
		default: 'getAll',
	},
];

export const eventSignUpFields: INodeProperties[] = [
	{
		displayName: 'Event Sign-Up ID',
		name: 'eventSignUpId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the event sign-up',
	},

	// ----------------------------------
	//         eventSignUp:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
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
				resource: ['eventSignUp'],
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
				resource: ['eventSignUp'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter sign-ups',
	},

	// ----------------------------------
	//         eventSignUp:create
	// ----------------------------------
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'options',
				options: [
					{ name: 'Male', value: 'male' },
					{ name: 'Female', value: 'female' },
					{ name: 'Diverse', value: 'diverse' },
				],
				default: 'male',
			},
			{
				displayName: 'Birthday',
				name: 'birthday',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'ID of the associated person',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Event ID',
				name: 'baseEvent',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Booking ID',
				name: 'baseBooking',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Confirmed',
				name: 'confirmed',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Free Note One',
				name: 'freeNoteOne',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Free Note Two',
				name: 'freeNoteTwo',
				type: 'string',
				default: '',
			},
		],
	},

	// ----------------------------------
	//         eventSignUp:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['eventSignUp'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'options',
				options: [
					{ name: 'Male', value: 'male' },
					{ name: 'Female', value: 'female' },
					{ name: 'Diverse', value: 'diverse' },
				],
				default: 'male',
			},
			{
				displayName: 'Confirmed',
				name: 'confirmed',
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
				displayName: 'Deleted',
				name: 'deleted',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Free Note One',
				name: 'freeNoteOne',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Free Note Two',
				name: 'freeNoteTwo',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Free Note Three',
				name: 'freeNoteThree',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Free Note Four',
				name: 'freeNoteFour',
				type: 'string',
				default: '',
			},
		],
	},
];
