import type { INodeProperties } from 'n8n-workflow';

export const personOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['person'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a person',
				action: 'Create a person',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a person by ID',
				action: 'Get a person',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many people',
				action: 'Get many people',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a person (PATCH)',
				action: 'Update a person',
			},
		],
		default: 'getAll',
	},
];

export const personFields: INodeProperties[] = [
	// ----------------------------------
	//         person:get / update
	// ----------------------------------
	{
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['person'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the person',
	},

	// ----------------------------------
	//         person:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['person'],
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
				resource: ['person'],
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
				resource: ['person'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter people',
	},

	// ----------------------------------
	//         person:create
	// ----------------------------------
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['person'],
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
				resource: ['person'],
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
				resource: ['person'],
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
				displayName: 'Address City',
				name: 'addressCity',
				type: 'string',
				default: '',
				description: 'City',
			},
			{
				displayName: 'Address Country',
				name: 'addressCountry',
				type: 'string',
				default: '',
				description: 'Country code (e.g. DE, AT, CH)',
			},
			{
				displayName: 'Address Street',
				name: 'addressStreetLevel',
				type: 'string',
				default: '',
				description: 'Street and house number',
			},
			{
				displayName: 'Address ZIP',
				name: 'addressZip',
				type: 'string',
				default: '',
				description: 'Postal / ZIP code',
			},
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether this person is archived',
			},
			{
				displayName: 'Birthday',
				name: 'birthday',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Category ID',
				name: 'category',
				type: 'string',
				default: '',
				description: 'ID of the person category',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Personal email address',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'options',
				options: [
					{ name: 'Diverse', value: 'D' },
					{ name: 'Female', value: 'W' },
					{ name: 'Male', value: 'M' },
					{ name: 'Undefined', value: 'U' },
				],
				default: 'M',
				description: 'Gender of the person (M/W/D/U)',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				description: 'Preferred language code (e.g. de, en)',
			},
			{
				displayName: 'Nickname',
				name: 'nickname',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				description: 'Internal note',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Personal phone number',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'string',
				default: '',
				description: 'Job position or role at the company',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Academic or honorific title (e.g. Dr., Prof.)',
			},
		],
	},

	// ----------------------------------
	//         person:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['person'],
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
				displayName: 'Address City',
				name: 'addressCity',
				type: 'string',
				default: '',
				description: 'City',
			},
			{
				displayName: 'Address Country',
				name: 'addressCountry',
				type: 'string',
				default: '',
				description: 'Country code (e.g. DE, AT, CH)',
			},
			{
				displayName: 'Address Street',
				name: 'addressStreetLevel',
				type: 'string',
				default: '',
				description: 'Street and house number',
			},
			{
				displayName: 'Address ZIP',
				name: 'addressZip',
				type: 'string',
				default: '',
				description: 'Postal / ZIP code',
			},
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether this person is archived',
			},
			{
				displayName: 'Birthday',
				name: 'birthday',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Category ID',
				name: 'category',
				type: 'string',
				default: '',
				description: 'ID of the person category',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Personal email address',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'options',
				options: [
					{ name: 'Diverse', value: 'D' },
					{ name: 'Female', value: 'W' },
					{ name: 'Male', value: 'M' },
					{ name: 'Undefined', value: 'U' },
				],
				default: 'M',
				description: 'Gender of the person (M/W/D/U)',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				description: 'Preferred language code (e.g. de, en)',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Nickname',
				name: 'nickname',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				description: 'Internal note',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Personal phone number',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'string',
				default: '',
				description: 'Job position or role at the company',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Academic or honorific title (e.g. Dr., Prof.)',
			},
		],
	},
];
