import type { INodeProperties } from 'n8n-workflow';

import { idField, listFields } from './Common';

const R = 'usageCounter';

export const usageCounterOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a usage counter (meter) of a bookable by ID',
				action: 'Get a usage counter',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many usage counters',
				action: 'Get many usage counters',
			},
			{
				name: 'Update Value',
				value: 'updateValue',
				description: 'Set the reading of a usage counter (e.g. from a smart meter)',
				action: 'Update the value of a usage counter',
			},
		],
		default: 'getAll',
	},
];

export const usageCounterFields: INodeProperties[] = [
	idField(R, 'usageCounterId', 'Usage Counter ID', ['get', 'updateValue'], 'The ID of the usage counter'),
	...listFields(R, ['getAll']),
	{
		displayName: 'Bookable ID',
		name: 'usageCounterBookable',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getAll'] } },
		description: 'Only the counters of this bookable (empty: all)',
	},
	{
		displayName: 'Value',
		name: 'counterValue',
		type: 'number',
		typeOptions: { numberPrecision: 2 },
		required: true,
		default: 0,
		displayOptions: { show: { resource: [R], operation: ['updateValue'] } },
		description: 'The new reading',
	},
];
