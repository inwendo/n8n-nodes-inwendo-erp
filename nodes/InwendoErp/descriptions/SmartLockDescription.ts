import type { INodeProperties } from 'n8n-workflow';

export const smartLockOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['smartLock'],
			},
		},
		options: [
			{
				name: 'Check Access',
				value: 'checkAccess',
				description:
					'Ask whether a credential a reader read (app QR code, member card QR, RFID card number) may open a smart lock',
				action: 'Check access to a smart lock',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a smart lock by ID (token with super admin functions)',
				action: 'Get a smart lock',
			},
			{
				name: 'Get Log',
				value: 'getLog',
				description: 'Get the smart lock log: who opened which lock, from where (token with super admin functions)',
				action: 'Get the smart lock log',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many smart locks (token with super admin functions)',
				action: 'Get many smart locks',
			},
			{
				name: 'Lock',
				value: 'lock',
				description: 'Lock a smart lock through its provider',
				action: 'Lock a smart lock',
			},
			{
				name: 'Status',
				value: 'status',
				description: 'Get the state of a smart lock',
				action: 'Get the state of a smart lock',
			},
			{
				name: 'Unlock',
				value: 'unlock',
				description: 'Open a smart lock through its provider (Nuki, LOQED, Home Assistant, Node-RED, n8n)',
				action: 'Unlock a smart lock',
			},
		],
		default: 'checkAccess',
	},
];

export const smartLockFields: INodeProperties[] = [
	{
		displayName: 'Smart Lock ID',
		name: 'smartLockId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['smartLock'],
				operation: ['get', 'unlock', 'lock', 'status', 'checkAccess'],
			},
		},
		description: 'The ID of the smart lock in the ERP',
	},
	{
		displayName: 'Credential',
		name: 'credential',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['smartLock'],
				operation: ['checkAccess'],
			},
		},
		placeholder: '04A1B2C3',
		description: 'What the reader read; line breaks are removed',
	},
	{
		displayName: 'Credential Type',
		name: 'credentialType',
		type: 'options',
		default: 'auto',
		displayOptions: {
			show: {
				resource: ['smartLock'],
				operation: ['checkAccess'],
			},
		},
		options: [
			{ name: 'Detect', value: 'auto', description: 'App QR code, member card QR or card number' },
			{ name: 'App QR Code', value: 'access_code', description: 'The QR code the app shows for this lock' },
			{ name: 'Digital Member Card (QR)', value: 'member_card' },
			{ name: 'RFID / Chip Card Number', value: 'card', description: 'The member card number stored at the person' },
		],
	},
	{
		displayName: 'Open When Granted',
		name: 'open',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['smartLock'],
				operation: ['checkAccess'],
			},
		},
		description:
			'Whether the ERP opens the lock itself when access is granted (locks of Nuki, LOQED, Home Assistant; Node-RED and n8n locks open in their own flow)',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['smartLock'],
				operation: ['getAll', 'getLog'],
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
				resource: ['smartLock'],
				operation: ['getAll', 'getLog'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Log of Smart Lock ID',
		name: 'logSmartLockId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['smartLock'],
				operation: ['getLog'],
			},
		},
		description: 'Only the entries of this smart lock (empty: all)',
	},
];
