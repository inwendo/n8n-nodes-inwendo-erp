import type { INodeProperties } from 'n8n-workflow';

import { idField, listFields } from './Common';

const ENTRY = 'volunteerHourEntry';
const SHIFT = 'helperShift';

export const volunteerHourEntryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [ENTRY] } },
		options: [
			{
				name: 'Approve',
				value: 'approve',
				description: 'Approve an entry (only approved entries count towards the required hours)',
				action: 'Approve volunteer hours',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Record volunteer hours for a member (approved at once)',
				action: 'Create volunteer hours',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a volunteer hour entry by ID',
				action: 'Get volunteer hours',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many volunteer hour entries',
				action: 'Get many volunteer hour entries',
			},
			{
				name: 'Reject',
				value: 'reject',
				description: 'Reject an entry, optionally with a reason shown to the member',
				action: 'Reject volunteer hours',
			},
		],
		default: 'getAll',
	},
];

export const volunteerHourEntryFields: INodeProperties[] = [
	idField(ENTRY, 'volunteerHourEntryId', 'Entry ID', ['get', 'approve', 'reject'], 'The ID of the volunteer hour entry'),
	...listFields(ENTRY, ['getAll']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [ENTRY], operation: ['getAll'] } },
		options: [
			{ displayName: 'Event ID', name: 'event', type: 'string', default: '' },
			{ displayName: 'Person ID', name: 'person', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Approved', value: 'approved' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: 'pending',
			},
		],
	},
	idField(ENTRY, 'volunteerPersonId', 'Person ID', ['create'], 'The member who did the work'),
	{
		displayName: 'Work Date',
		name: 'workDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [ENTRY], operation: ['create'] } },
	},
	{
		displayName: 'Duration (Minutes)',
		name: 'durationMinutes',
		type: 'number',
		required: true,
		typeOptions: { minValue: 1 },
		default: 60,
		displayOptions: { show: { resource: [ENTRY], operation: ['create'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [ENTRY], operation: ['create'] } },
		options: [
			{ displayName: 'Description', name: 'description', type: 'string', default: '' },
			{ displayName: 'Event ID', name: 'event', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: [ENTRY], operation: ['reject'] } },
		description: 'Shown to the member',
	},
];

export const helperShiftOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [SHIFT] } },
		options: [
			{
				name: 'Assign Person',
				value: 'assign',
				description: 'Sign a person up for a helper shift',
				action: 'Assign a person to a helper shift',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a helper shift',
				action: 'Create a helper shift',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a helper shift by ID',
				action: 'Get a helper shift',
			},
			{
				name: 'Get Assignments',
				value: 'getAssignments',
				description: 'Get the helpers signed up for shifts',
				action: 'Get helper shift assignments',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many helper shifts',
				action: 'Get many helper shifts',
			},
			{
				name: 'Set Assignment Status',
				value: 'setAssignmentStatus',
				description: 'Attended credits the shift; no-show / cancelled remove that credit again',
				action: 'Set the status of a helper shift assignment',
			},
		],
		default: 'getAll',
	},
];

export const helperShiftFields: INodeProperties[] = [
	idField(SHIFT, 'helperShiftId', 'Helper Shift ID', ['get', 'assign'], 'The ID of the helper shift'),
	...listFields(SHIFT, ['getAll', 'getAssignments']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [SHIFT], operation: ['getAll'] } },
		options: [{ displayName: 'Event ID', name: 'event', type: 'string', default: '' }],
	},
	{
		displayName: 'Filters',
		name: 'assignmentFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [SHIFT], operation: ['getAssignments'] } },
		options: [
			{ displayName: 'Helper Shift ID', name: 'shift', type: 'string', default: '' },
			{ displayName: 'Person ID', name: 'person', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Attended', value: 'attended' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'No Show', value: 'no_show' },
					{ name: 'Signed Up', value: 'signed_up' },
				],
				default: 'signed_up',
			},
		],
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: [SHIFT], operation: ['create'] } },
	},
	{
		displayName: 'Start',
		name: 'start',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [SHIFT], operation: ['create'] } },
	},
	{
		displayName: 'End',
		name: 'end',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [SHIFT], operation: ['create'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [SHIFT], operation: ['create'] } },
		options: [
			{
				displayName: 'Credited Minutes',
				name: 'creditedMinutes',
				type: 'number',
				default: 0,
				description: 'Minutes credited per helper (default: the length of the shift)',
			},
			{ displayName: 'Description', name: 'description', type: 'string', default: '' },
			{ displayName: 'Event ID', name: 'event', type: 'string', default: '' },
			{ displayName: 'Location', name: 'location', type: 'string', default: '' },
			{ displayName: 'Required Helpers', name: 'requiredHelpers', type: 'number', default: 1 },
			{ displayName: 'Sign-Up Until', name: 'signupUntil', type: 'dateTime', default: '' },
		],
	},
	idField(SHIFT, 'helperPersonId', 'Person ID', ['assign'], 'The helper'),
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: [SHIFT], operation: ['assign'] } },
	},
	idField(SHIFT, 'assignmentId', 'Assignment ID', ['setAssignmentStatus'], 'The ID of the helper shift assignment'),
	{
		displayName: 'Status',
		name: 'assignmentStatus',
		type: 'options',
		options: [
			{ name: 'Attended', value: 'attended' },
			{ name: 'Cancelled', value: 'cancelled' },
			{ name: 'No Show', value: 'no_show' },
			{ name: 'Signed Up', value: 'signed_up' },
		],
		default: 'attended',
		displayOptions: { show: { resource: [SHIFT], operation: ['setAssignmentStatus'] } },
	},
];
