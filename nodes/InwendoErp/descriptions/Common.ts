import type { INodeProperties } from 'n8n-workflow';

/** A required ID parameter of one resource, shown for the given operations. */
export function idField(
	resource: string,
	name: string,
	displayName: string,
	operations: string[],
	description: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: [resource], operation: operations } },
		description,
	};
}

/** "Return All" and "Limit" of the list operations of one resource. */
export function listFields(resource: string, operations: string[]): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			displayOptions: { show: { resource: [resource], operation: operations } },
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			displayOptions: { show: { resource: [resource], operation: operations, returnAll: [false] } },
			description: 'Max number of results to return',
		},
	];
}
