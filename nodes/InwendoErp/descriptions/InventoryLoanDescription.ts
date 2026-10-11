import type { INodeProperties } from 'n8n-workflow';

import { idField, listFields } from './Common';

const R = 'inventoryLoan';

export const inventoryLoanOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Extend',
				value: 'extend',
				description: 'Move the due date of a lent loan',
				action: 'Extend an inventory loan',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an inventory loan by ID',
				action: 'Get an inventory loan',
			},
			{
				name: 'Get Availability',
				value: 'getAvailability',
				description: 'Free pieces of one inventory item between two dates (bookings and loans counted)',
				action: 'Get the availability of an inventory item',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many inventory loans, e.g. the overdue ones',
				action: 'Get many inventory loans',
			},
			{
				name: 'Get Stock',
				value: 'getStock',
				description: 'Every inventory item with stock, lent, overdue and free pieces right now',
				action: 'Get the inventory stock',
			},
			{
				name: 'Hand Over',
				value: 'create',
				description: 'Hand the item of a booking over (creates the loan; item and borrower come from the booking)',
				action: 'Hand over an inventory item',
			},
			{
				name: 'Return',
				value: 'return',
				description: 'Take a lent item back, with the condition and the deposit settlement',
				action: 'Return an inventory loan',
			},
		],
		default: 'getAll',
	},
];

export const inventoryLoanFields: INodeProperties[] = [
	idField(R, 'inventoryLoanId', 'Inventory Loan ID', ['get', 'return', 'extend'], 'The ID of the inventory loan'),

	// ----------------------------------
	//         inventoryLoan:getAll
	// ----------------------------------
	...listFields(R, ['getAll']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Booking ID',
				name: 'booking',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Deposit State',
				name: 'depositState',
				type: 'options',
				options: [
					{ name: 'Held', value: 'HELD' },
					{ name: 'None', value: 'NONE' },
					{ name: 'Partially Retained', value: 'PARTIALLY_RETAINED' },
					{ name: 'Refunded', value: 'REFUNDED' },
					{ name: 'Retained', value: 'RETAINED' },
				],
				default: 'HELD',
			},
			{
				displayName: 'Inventory Item (Bookable) ID',
				name: 'bookable',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Person ID',
				name: 'person',
				type: 'string',
				default: '',
				description: 'The borrower',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{ name: 'Lent', value: 'LENT' },
					{ name: 'Overdue (Lent and Past the Due Date)', value: 'OVERDUE' },
					{ name: 'Returned', value: 'RETURNED' },
				],
				default: 'LENT',
			},
		],
	},

	// ----------------------------------
	//         inventoryLoan:create
	// ----------------------------------
	idField(R, 'loanBookingId', 'Booking ID', ['create'], 'The booking (Termin) whose inventory item is handed over'),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['create'] } },
		options: [
			{
				displayName: 'Condition',
				name: 'condition',
				type: 'string',
				default: '',
				description: 'Condition of the item when handed over',
			},
			{
				displayName: 'Deposit Amount',
				name: 'deposit_amount',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				description: 'Default: the deposit of the item times the quantity',
			},
			{
				displayName: 'Due At',
				name: 'due_at',
				type: 'dateTime',
				default: '',
				description: 'Default: the end of the booking',
			},
			{
				displayName: 'Ignore Stock Check',
				name: 'force',
				type: 'boolean',
				default: false,
				description: 'Whether to hand the item over even when the stock check fails',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
			},
		],
	},

	// ----------------------------------
	//         inventoryLoan:return
	// ----------------------------------
	{
		displayName: 'Return Fields',
		name: 'returnFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['return'] } },
		options: [
			{
				displayName: 'Condition',
				name: 'condition',
				type: 'string',
				default: '',
				description: 'Condition of the item when returned',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Retained Amount',
				name: 'retained_amount',
				type: 'number',
				typeOptions: { numberPrecision: 2 },
				default: 0,
				description: 'The part of the deposit that is kept (e.g. for damage)',
			},
			{
				displayName: 'Returned At',
				name: 'returned_at',
				type: 'dateTime',
				default: '',
				description: 'Default: now',
			},
		],
	},

	// ----------------------------------
	//         inventoryLoan:extend
	// ----------------------------------
	{
		displayName: 'New Due Date',
		name: 'extendDueAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [R], operation: ['extend'] } },
	},
	{
		displayName: 'Ignore Stock Check',
		name: 'extendForce',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: [R], operation: ['extend'] } },
		description: 'Whether to extend even when the item is needed elsewhere',
	},

	// ----------------------------------
	//         inventoryLoan:getAvailability
	// ----------------------------------
	idField(R, 'availabilityBookableId', 'Inventory Item (Bookable) ID', ['getAvailability'], 'The inventory item'),
	{
		displayName: 'Start',
		name: 'availabilityStart',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getAvailability'] } },
	},
	{
		displayName: 'End',
		name: 'availabilityEnd',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getAvailability'] } },
	},
];
