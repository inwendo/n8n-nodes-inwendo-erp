import type { INodeProperties } from 'n8n-workflow';

import { listFields } from './Common';

const R = 'notification';

export const notificationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get the mass notifications sent so far',
				action: 'Get many mass notifications',
			},
			{
				name: 'Get Own Notifications',
				value: 'getOwn',
				description: "Get the notifications of the token's own user",
				action: 'Get own notifications',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'Send a notification (push to the app, e-mail, SMS, …) to persons, companies or event sign-ups',
				action: 'Send a notification',
			},
		],
		default: 'send',
	},
];

export const notificationFields: INodeProperties[] = [
	{
		displayName: 'Recipient Type',
		name: 'recipientType',
		type: 'options',
		options: [
			{ name: 'Company', value: 'company' },
			{ name: 'Event Sign-Up', value: 'base_event_sign_up' },
			{ name: 'Membership (Person Log Book Entry)', value: 'person_log_book_entry' },
			{ name: 'Person', value: 'person' },
		],
		default: 'person',
		displayOptions: { show: { resource: [R], operation: ['send'] } },
	},
	{
		displayName: 'Recipient IDs',
		name: 'recipientIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12,34',
		displayOptions: { show: { resource: [R], operation: ['send'] } },
		description: 'Comma-separated IDs of the recipients (one notification each)',
	},
	{
		displayName: 'Title',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: [R], operation: ['send'] } },
		description: 'Title of the push notification and subject of the e-mail; Twig placeholders like {{ person.firstName }} work',
	},
	{
		displayName: 'Message',
		name: 'longText',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: { show: { resource: [R], operation: ['send'] } },
		description: 'Text of the notification and the e-mail',
	},
	{
		displayName: 'Channels',
		name: 'channels',
		type: 'multiOptions',
		options: [
			{ name: 'E-Mail', value: 'sendMail' },
			{ name: 'Letter', value: 'sendLetter' },
			{ name: 'Push (App)', value: 'sendPush' },
			{ name: 'SMS', value: 'sendSms' },
			{ name: 'WhatsApp', value: 'sendWhatsapp' },
		],
		default: ['sendPush'],
		displayOptions: { show: { resource: [R], operation: ['send'] } },
		description: 'Every notification also appears in the app notification list',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [R], operation: ['send'] } },
		options: [
			{
				displayName: 'HTML Text',
				name: 'htmlText',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'HTML body of the e-mail',
			},
			{
				displayName: 'Skip Duplicates',
				name: 'checkForDuplicates',
				type: 'boolean',
				default: false,
				description: 'Whether to skip recipients that already got the same notification',
			},
			{
				displayName: 'Template ID',
				name: 'template',
				type: 'string',
				default: '',
				description: 'ID of a document / mail template to use instead of the texts',
			},
		],
	},
	...listFields(R, ['getAll', 'getOwn']),
];
