import type { INodeProperties } from 'n8n-workflow';

import { idField, listFields } from './Common';

const R = 'generalMeeting';

export const generalMeetingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [R] } },
		options: [
			{
				name: 'Check In',
				value: 'checkIn',
				description: 'Set the attendance of a member at a meeting (on site, online or absent)',
				action: 'Check a member in at a general meeting',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a general meeting with its statistics',
				action: 'Get a general meeting',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many general meetings, newest first',
				action: 'Get many general meetings',
			},
			{
				name: 'Get Participants',
				value: 'getParticipants',
				description: 'Get the participants of a meeting with response, attendance and voting right',
				action: 'Get the participants of a general meeting',
			},
		],
		default: 'getAll',
	},
];

export const generalMeetingFields: INodeProperties[] = [
	idField(R, 'generalMeetingId', 'General Meeting ID', ['get', 'getParticipants', 'checkIn'], 'The ID of the general meeting'),
	...listFields(R, ['getAll', 'getParticipants']),
	{
		displayName: 'State',
		name: 'state',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Cancelled', value: 'CANCELLED' },
			{ name: 'Closed', value: 'CLOSED' },
			{ name: 'Draft', value: 'DRAFT' },
			{ name: 'Invited', value: 'INVITED' },
			{ name: 'Running', value: 'RUNNING' },
		],
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getAll'] } },
	},
	{
		displayName: 'Attendance',
		name: 'attendanceFilter',
		type: 'options',
		options: [
			{ name: 'All', value: '' },
			{ name: 'Absent', value: 'ABSENT' },
			{ name: 'Online', value: 'ONLINE' },
			{ name: 'On Site', value: 'ONSITE' },
		],
		default: '',
		displayOptions: { show: { resource: [R], operation: ['getParticipants'] } },
	},
	idField(R, 'meetingPersonId', 'Person ID', ['checkIn'], 'The member (must be a participant of the meeting)'),
	{
		displayName: 'Attendance',
		name: 'attendance',
		type: 'options',
		options: [
			{ name: 'Absent (Check Out)', value: 'ABSENT' },
			{ name: 'Online', value: 'ONLINE' },
			{ name: 'On Site', value: 'ONSITE' },
		],
		default: 'ONSITE',
		displayOptions: { show: { resource: [R], operation: ['checkIn'] } },
	},
];
