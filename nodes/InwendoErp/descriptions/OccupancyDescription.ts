import type { INodeProperties } from 'n8n-workflow';

const R = 'occupancy';

export const occupancyOperations: INodeProperties[] = [
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
				description:
					'Whether bookables are occupied right now, the current and next booking, lead / lag time and opening hours',
				action: 'Get the occupancy of bookables',
			},
		],
		default: 'get',
	},
];

export const occupancyFields: INodeProperties[] = [
	{
		displayName: 'Bookable IDs',
		name: 'occupancyBookables',
		type: 'string',
		default: '',
		placeholder: '7,8',
		displayOptions: { show: { resource: [R], operation: ['get'] } },
		description: 'Comma-separated bookable IDs (empty: all bookables)',
	},
];
