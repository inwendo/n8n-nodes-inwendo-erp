import type { INodeProperties } from 'n8n-workflow';

import { idField, listFields } from './Common';

const R = 'shiftPlanEntry';

export const shiftPlanEntryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Clock In',
				value: 'clockIn',
				description: "Start the work time at one of the token user's own shifts (today)",
				action: 'Clock in at a shift',
			},
			{
				name: 'Clock Out',
				value: 'clockOut',
				description: 'End the running work time of an own shift',
				action: 'Clock out of a shift',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a shift by ID',
				action: 'Get a shift',
			},
			{
				name: 'Get Coverage',
				value: 'getCoverage',
				description: 'Staffing coverage per day: required versus planned persons (at most 62 days)',
				action: 'Get the shift coverage',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many shifts of the shift plan, drafts included (planners only)',
				action: 'Get many shifts',
			},
			{
				name: 'Get Own',
				value: 'getOwn',
				description: "Get the published shifts of the token's user",
				action: 'Get own shifts',
			},
		],
		default: 'getOwn',
	},
];

export const shiftPlanEntryFields: INodeProperties[] = [
	idField(R, 'shiftPlanEntryId', 'Shift ID', ['get', 'clockIn', 'clockOut'], 'The ID of the shift plan entry'),

	...listFields(R, ['getAll', 'getOwn']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Employment Contract Group ID',
				name: 'employmentContractGroup',
				type: 'string',
				default: '',
				description: 'The planning group',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Start Date From',
				name: 'start_date_from',
				type: 'dateTime',
				default: '',
				description: 'First day (inclusive)',
			},
			{
				displayName: 'Start Date Until',
				name: 'start_date_until',
				type: 'dateTime',
				default: '',
				description: 'Last day (inclusive)',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Cancelled', value: 'CANCELLED' },
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Published', value: 'PUBLISHED' },
				],
				default: 'PUBLISHED',
			},
		],
	},
	{
		displayName: 'Filters',
		name: 'ownFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['getOwn'] } },
		options: [
			{
				displayName: 'Start From',
				name: 'startFrom',
				type: 'dateTime',
				default: '',
				description: 'Only shifts starting at or after this time',
			},
		],
	},

	// ----------------------------------
	//         shiftPlanEntry:getCoverage
	// ----------------------------------
	{
		displayName: 'From',
		name: 'coverageFrom',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getCoverage'] } },
		description: 'First day',
	},
	{
		displayName: 'Until',
		name: 'coverageUntil',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getCoverage'] } },
		description: 'Last day, at most 62 days after From',
	},
	{
		displayName: 'Options',
		name: 'coverageOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['getCoverage'] } },
		options: [
			{
				displayName: 'Employment Contract Group ID',
				name: 'employment_contract_group',
				type: 'string',
				default: '',
				description: 'Limit the check to one planning group (required for a team lead without global time rights)',
			},
			{
				displayName: 'Employment Organization ID',
				name: 'employment_organization',
				type: 'string',
				default: '',
			},
		],
	},
];
