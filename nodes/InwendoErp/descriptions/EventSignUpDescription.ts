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
					{ name: 'Male', value: 'M' },
					{ name: 'Female', value: 'W' },
					{ name: 'Diverse', value: 'D' },
				],
				default: 'M',
				description: 'Gender of the participant',
			},
			{
				displayName: 'Birthday',
				name: 'birthday',
				type: 'dateTime',
				default: '',
				description: 'Date of birth of the participant',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'Contact email for this sign-up',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Contact phone number for this sign-up',
			},
			{
				displayName: 'Address Street',
				name: 'addressStreetLevel',
				type: 'string',
				default: '',
				description: "Participant's street and house number",
			},
			{
				displayName: 'Address City',
				name: 'addressCity',
				type: 'string',
				default: '',
				description: "Participant's city",
			},
			{
				displayName: 'Address ZIP',
				name: 'addressZip',
				type: 'string',
				default: '',
				description: "Participant's postal / ZIP code",
			},
			{
				displayName: 'Address Country',
				name: 'addressCountry',
				type: 'string',
				default: '',
				description: "Participant's country code (e.g. DE, AT, CH)",
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'ID of the CRM person to link this sign-up to',
			},
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
				description: 'ID of the company to associate with this sign-up',
			},
			{
				displayName: 'Event ID',
				name: 'baseEvent',
				type: 'string',
				default: '',
				description: 'ID of the event this person is signing up for',
			},
			{
				displayName: 'Booking ID',
				name: 'baseBooking',
				type: 'string',
				default: '',
				description: 'ID of the specific booking slot for this sign-up',
			},
			{
				displayName: 'Confirmed',
				name: 'confirmed',
				type: 'boolean',
				default: false,
				description: 'Whether this sign-up is confirmed',
			},
			{
				displayName: 'Known Allergies',
				name: 'knownAllergies',
				type: 'string',
				default: '',
				description: 'Known allergies of the participant',
			},
			{
				displayName: 'Confirmed No Allergies',
				name: 'confirmedNoAllergies',
				type: 'boolean',
				default: false,
				description: 'Whether the participant has confirmed they have no allergies',
			},
			{
				displayName: 'Allow Photos',
				name: 'allowPhotos',
				type: 'boolean',
				default: false,
				description: 'Whether the participant consents to photos being taken',
			},
			{
				displayName: 'Needs Support',
				name: 'needsSupport',
				type: 'boolean',
				default: false,
				description: 'Whether the participant requires additional support',
			},
			{
				displayName: 'Support Description',
				name: 'supportDescription',
				type: 'string',
				default: '',
				description: 'Description of the support required',
			},
			{
				displayName: 'Financial Support',
				name: 'financialSupport',
				type: 'boolean',
				default: false,
				description: 'Whether the participant receives financial support / subsidy',
			},
			{
				displayName: 'Financial Support Number',
				name: 'financialSupportNumber',
				type: 'string',
				default: '',
				description: 'Reference number for the financial support',
			},
			{
				displayName: 'Grade Level',
				name: 'gradeLevel',
				type: 'number',
				default: 0,
				description: 'School grade level of the participant',
			},
			{
				displayName: 'School Class',
				name: 'schoolClass',
				type: 'string',
				default: '',
				description: 'School class of the participant (e.g. 5a)',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				description: 'Internal note for this sign-up',
			},
			{
				displayName: 'Free Note One',
				name: 'freeNoteOne',
				type: 'string',
				default: '',
				description: 'Custom free-text field 1 (configured per event)',
			},
			{
				displayName: 'Free Note Two',
				name: 'freeNoteTwo',
				type: 'string',
				default: '',
				description: 'Custom free-text field 2 (configured per event)',
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
					{ name: 'Male', value: 'M' },
					{ name: 'Female', value: 'W' },
					{ name: 'Diverse', value: 'D' },
				],
				default: 'M',
				description: 'Gender of the participant',
			},
			{
				displayName: 'Birthday',
				name: 'birthday',
				type: 'dateTime',
				default: '',
				description: 'Date of birth of the participant',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'Contact email for this sign-up',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Contact phone number for this sign-up',
			},
			{
				displayName: 'Address Street',
				name: 'addressStreetLevel',
				type: 'string',
				default: '',
				description: "Participant's street and house number",
			},
			{
				displayName: 'Address City',
				name: 'addressCity',
				type: 'string',
				default: '',
				description: "Participant's city",
			},
			{
				displayName: 'Address ZIP',
				name: 'addressZip',
				type: 'string',
				default: '',
				description: "Participant's postal / ZIP code",
			},
			{
				displayName: 'Address Country',
				name: 'addressCountry',
				type: 'string',
				default: '',
				description: "Participant's country code (e.g. DE, AT, CH)",
			},
			{
				displayName: 'Confirmed',
				name: 'confirmed',
				type: 'boolean',
				default: false,
				description: 'Whether this sign-up is confirmed',
			},
			{
				displayName: 'Waiting',
				name: 'waiting',
				type: 'boolean',
				default: false,
				description: 'Whether this sign-up is on the wait list',
			},
			{
				displayName: 'Billed',
				name: 'billed',
				type: 'boolean',
				default: false,
				description: 'Whether this sign-up has been billed',
			},
			{
				displayName: 'Deleted',
				name: 'deleted',
				type: 'boolean',
				default: false,
				description: 'Whether to soft-delete this sign-up',
			},
			{
				displayName: 'Known Allergies',
				name: 'knownAllergies',
				type: 'string',
				default: '',
				description: 'Known allergies of the participant',
			},
			{
				displayName: 'Confirmed No Allergies',
				name: 'confirmedNoAllergies',
				type: 'boolean',
				default: false,
				description: 'Whether the participant has confirmed they have no allergies',
			},
			{
				displayName: 'Allow Photos',
				name: 'allowPhotos',
				type: 'boolean',
				default: false,
				description: 'Whether the participant consents to photos being taken',
			},
			{
				displayName: 'Needs Support',
				name: 'needsSupport',
				type: 'boolean',
				default: false,
				description: 'Whether the participant requires additional support',
			},
			{
				displayName: 'Support Description',
				name: 'supportDescription',
				type: 'string',
				default: '',
				description: 'Description of the support required',
			},
			{
				displayName: 'Financial Support',
				name: 'financialSupport',
				type: 'boolean',
				default: false,
				description: 'Whether the participant receives financial support / subsidy',
			},
			{
				displayName: 'Financial Support Number',
				name: 'financialSupportNumber',
				type: 'string',
				default: '',
				description: 'Reference number for the financial support',
			},
			{
				displayName: 'Grade Level',
				name: 'gradeLevel',
				type: 'number',
				default: 0,
				description: 'School grade level of the participant',
			},
			{
				displayName: 'School Class',
				name: 'schoolClass',
				type: 'string',
				default: '',
				description: 'School class of the participant (e.g. 5a)',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				description: 'Internal note for this sign-up',
			},
			{
				displayName: 'Free Note One',
				name: 'freeNoteOne',
				type: 'string',
				default: '',
				description: 'Custom free-text field 1 (configured per event)',
			},
			{
				displayName: 'Free Note Two',
				name: 'freeNoteTwo',
				type: 'string',
				default: '',
				description: 'Custom free-text field 2 (configured per event)',
			},
			{
				displayName: 'Free Note Three',
				name: 'freeNoteThree',
				type: 'string',
				default: '',
				description: 'Custom free-text field 3 (configured per event)',
			},
			{
				displayName: 'Free Note Four',
				name: 'freeNoteFour',
				type: 'string',
				default: '',
				description: 'Custom free-text field 4 (configured per event)',
			},
		],
	},
];
