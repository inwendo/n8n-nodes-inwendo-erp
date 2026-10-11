import type { INodeProperties } from 'n8n-workflow';

import { idField, listFields } from './Common';

const R = 'membershipPause';

export const membershipPauseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Decide',
				value: 'decide',
				description: 'Approve (writes the pause into the membership) or decline a requested membership pause',
				action: 'Decide on a membership pause',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a membership pause by ID',
				action: 'Get a membership pause',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many membership pauses, e.g. the requested ones',
				action: 'Get many membership pauses',
			},
		],
		default: 'getAll',
	},
];

export const membershipPauseFields: INodeProperties[] = [
	idField(R, 'membershipPauseId', 'Membership Pause ID', ['get', 'decide'], 'The ID of the membership pause request'),
	...listFields(R, ['getAll']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['getAll'] } },
		options: [
			{ displayName: 'Person ID', name: 'person', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Approved', value: 'APPROVED' },
					{ name: 'Declined', value: 'DECLINED' },
					{ name: 'Requested', value: 'REQUESTED' },
					{ name: 'Withdrawn', value: 'WITHDRAWN' },
				],
				default: 'REQUESTED',
			},
		],
	},
	{
		displayName: 'Decision',
		name: 'decision',
		type: 'options',
		options: [
			{ name: 'Approve', value: 'APPROVED' },
			{ name: 'Decline', value: 'DECLINED' },
		],
		default: 'APPROVED',
		displayOptions: { show: { resource: [R], operation: ['decide'] } },
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: [R], operation: ['decide'] } },
		description: 'Optional comment for the member',
	},
];
