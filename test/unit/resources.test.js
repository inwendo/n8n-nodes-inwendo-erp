'use strict';
/**
 * Offline tests of the resources added for inventory loans, shifts, volunteer hours, membership
 * pauses, general meetings, occupancy, usage counters, notifications and ticket SLA fields:
 * which request the node sends and how the answer becomes items. Run with `npm test`.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const dist = path.resolve(__dirname, '../../dist/nodes/InwendoErp');
const { InwendoErp } = require(path.join(dist, 'InwendoErp.node.js'));
const actions = require(path.join(dist, 'ResourceActions.js'));

/** Runs the node once with `params`; `answer(options)` gives the ERP answer of each request. */
async function run(params, answer = () => ({ id: 1 })) {
	const requests = [];
	const ctx = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name, i, fallback) => (name in params ? params[name] : fallback),
		getNode: () => ({ name: 'inwendo ERP', type: 'n8n-nodes-inwendo-erp.inwendoErp', typeVersion: 1, parameters: {} }),
		getCredentials: async () => ({ host: 'https://erp.example.com', apiToken: 'jwt' }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (type, options) => {
				requests.push(options);
				const body = answer(options);
				return options.returnFullResponse ? { body, headers: { 'x-iw-max-pages': '1' }, statusCode: 200 } : body;
			},
		},
	};
	const [items] = await new InwendoErp().execute.call(ctx);
	return { items: items.map((item) => item.json), requests };
}

const URL = 'https://erp.example.com';

describe('every resource has its operations and fields', () => {
	it('each new resource is selectable and has an operation parameter', () => {
		const { properties } = new InwendoErp().description;
		const resources = properties.find((p) => p.name === 'resource').options.map((o) => o.value);
		for (const resource of actions.ACTION_RESOURCES) {
			assert.ok(resources.includes(resource), `${resource} missing in the resource list`);
			assert.ok(
				properties.some((p) => p.name === 'operation' && p.displayOptions.show.resource.includes(resource)),
				`${resource} has no operations`,
			);
		}
	});
});

describe('inventory loan', () => {
	it('lists the overdue loans', async () => {
		const { items, requests } = await run(
			{ resource: 'inventoryLoan', operation: 'getAll', returnAll: false, limit: 5, filters: { state: 'OVERDUE', person: '' } },
			() => [{ id: 1 }, { id: 2 }],
		);
		assert.equal(requests[0].url, `${URL}/api/event/inventory_loan`);
		assert.deepEqual(requests[0].qs, { state: 'OVERDUE', page: '0', pageSize: '5' });
		assert.equal(items.length, 2);
	});

	it('hands over, returns and extends', async () => {
		const handOver = await run({ resource: 'inventoryLoan', operation: 'create', loanBookingId: '55', additionalFields: { quantity: 2, note: '' } });
		assert.equal(handOver.requests[0].method, 'POST');
		assert.deepEqual(handOver.requests[0].body, { booking: 55, quantity: 2 });

		const ret = await run({ resource: 'inventoryLoan', operation: 'return', inventoryLoanId: '9', returnFields: { retained_amount: 5, condition: 'scratched' } });
		assert.equal(ret.requests[0].method, 'PUT');
		assert.equal(ret.requests[0].url, `${URL}/api/event/inventory_loan/9/return`);
		assert.deepEqual(ret.requests[0].body, { retained_amount: 5, condition: 'scratched' });

		const extend = await run({ resource: 'inventoryLoan', operation: 'extend', inventoryLoanId: '9', extendDueAt: '2026-10-20T18:00:00', extendForce: false });
		assert.equal(extend.requests[0].url, `${URL}/api/event/inventory_loan/9/extend`);
		assert.deepEqual(extend.requests[0].body, { due_at: '2026-10-20T18:00:00', force: false });
	});

	it('reads stock and availability', async () => {
		const stock = await run({ resource: 'inventoryLoan', operation: 'getStock' }, () => [{ bookable: 3 }, { bookable: 4 }]);
		assert.equal(stock.requests[0].url, `${URL}/api/event/inventory_loan_stock`);
		assert.equal(stock.items.length, 2);

		const availability = await run(
			{ resource: 'inventoryLoan', operation: 'getAvailability', availabilityBookableId: '3', availabilityStart: '2026-10-11T10:00:00', availabilityEnd: '2026-10-12T10:00:00' },
			() => ({ quantity: 5, used: 2, available: 3 }),
		);
		assert.equal(availability.requests[0].url, `${URL}/api/event/inventory_loan_availability/3`);
		assert.deepEqual(availability.items[0], { bookable_id: 3, quantity: 5, used: 2, available: 3 });
	});
});

describe('shift plan entry', () => {
	it('reads own shifts from a start time and clocks in / out', async () => {
		const own = await run({ resource: 'shiftPlanEntry', operation: 'getOwn', returnAll: true, ownFilters: { startFrom: '2026-10-11T00:00:00.000+02:00' } }, () => []);
		assert.equal(own.requests[0].url, `${URL}/api/time/shift_plan_entry/own`);
		assert.equal(own.requests[0].qs.startDateCMP, 'gte,IW_DATE_TIME_2026-10-11 00:00:00');

		const clockIn = await run({ resource: 'shiftPlanEntry', operation: 'clockIn', shiftPlanEntryId: '17' });
		assert.equal(clockIn.requests[0].method, 'POST');
		assert.equal(clockIn.requests[0].url, `${URL}/api/time/shift_plan_entry/17/clock_in`);
		const clockOut = await run({ resource: 'shiftPlanEntry', operation: 'clockOut', shiftPlanEntryId: '17' });
		assert.equal(clockOut.requests[0].url, `${URL}/api/time/shift_plan_entry/17/clock_out`);
	});

	it('reads the coverage with dates', async () => {
		const { requests } = await run({ resource: 'shiftPlanEntry', operation: 'getCoverage', coverageFrom: '2026-10-01T00:00:00', coverageUntil: '2026-10-31', coverageOptions: { employment_contract_group: '4' } });
		assert.deepEqual(requests[0].qs, { employment_contract_group: '4', from: '2026-10-01', until: '2026-10-31' });
	});
});

describe('volunteer hours and helper shifts', () => {
	it('creates, approves and rejects volunteer hours', async () => {
		const created = await run({ resource: 'volunteerHourEntry', operation: 'create', volunteerPersonId: '12', workDate: '2026-10-10T09:30:00', durationMinutes: 90, additionalFields: { description: 'Platzpflege' } });
		assert.deepEqual(created.requests[0].body, { data: { person: '12', workDate: '2026-10-10 09:30:00', durationMinutes: 90, description: 'Platzpflege' } });

		const approved = await run({ resource: 'volunteerHourEntry', operation: 'approve', volunteerHourEntryId: '3' });
		assert.equal(approved.requests[0].url, `${URL}/api/time/volunteer_hour_entry/3/approve`);
		const rejected = await run({ resource: 'volunteerHourEntry', operation: 'reject', volunteerHourEntryId: '3', reason: 'doppelt' });
		assert.deepEqual(rejected.requests[0].body, { data: { reason: 'doppelt' } });
	});

	it('assigns a helper and marks the attendance', async () => {
		const assigned = await run({ resource: 'helperShift', operation: 'assign', helperShiftId: '8', helperPersonId: '12', note: '' });
		assert.equal(assigned.requests[0].url, `${URL}/api/time/volunteer_shift_assignment`);
		assert.deepEqual(assigned.requests[0].body, { data: { shift: '8', person: '12' } });

		const status = await run({ resource: 'helperShift', operation: 'setAssignmentStatus', assignmentId: '21', assignmentStatus: 'attended' });
		assert.equal(status.requests[0].method, 'PATCH');
		assert.deepEqual(status.requests[0].body, { data: { status: 'attended' } });
	});
});

describe('membership pause and general meeting', () => {
	it('decides on a membership pause with query parameters', async () => {
		const { requests } = await run({ resource: 'membershipPause', operation: 'decide', membershipPauseId: '6', decision: 'DECLINED', comment: 'zu kurz' });
		assert.equal(requests[0].method, 'PUT');
		assert.equal(requests[0].url, `${URL}/api/crm/membership_pause_request/6/decide`);
		assert.deepEqual(requests[0].qs, { decision: 'DECLINED', comment: 'zu kurz' });
	});

	it('checks a member in: finds the participant, then sets the attendance', async () => {
		const { requests, items } = await run(
			{ resource: 'generalMeeting', operation: 'checkIn', generalMeetingId: '2', meetingPersonId: '12', attendance: 'ONSITE' },
			(options) => (options.method === 'GET' ? [{ id: 77 }] : { id: 77, attendance: 'ONSITE' }),
		);
		assert.deepEqual(requests[0].qs, { meeting: '2', person: '12' });
		assert.equal(requests[1].url, `${URL}/api/crm/general_meeting_participant/77`);
		assert.deepEqual(requests[1].body, { attendance: 'ONSITE' });
		assert.equal(items[0].attendance, 'ONSITE');
	});

	it('refuses the check-in of a person who is no participant', async () => {
		await assert.rejects(
			run({ resource: 'generalMeeting', operation: 'checkIn', generalMeetingId: '2', meetingPersonId: '12' }, () => []),
			/no participant/,
		);
	});
});

describe('occupancy, usage counter, notification', () => {
	it('returns one item per bookable', async () => {
		const { requests, items } = await run({ resource: 'occupancy', operation: 'get', occupancyBookables: '7, 8' }, () => ({
			generated_at: '2026-10-11T17:59:30+02:00',
			bookables: [{ id: 7, occupied: true }, { id: 8, occupied: false }],
		}));
		assert.equal(requests[0].url, `${URL}/api/event/bookable_occupancy`);
		assert.deepEqual(requests[0].qs, { bookable: '7,8' });
		assert.deepEqual(items, [
			{ id: 7, occupied: true, generated_at: '2026-10-11T17:59:30+02:00' },
			{ id: 8, occupied: false, generated_at: '2026-10-11T17:59:30+02:00' },
		]);
	});

	it('sets the value of a usage counter', async () => {
		const { requests } = await run({ resource: 'usageCounter', operation: 'updateValue', usageCounterId: '3', counterValue: 1240.2 });
		assert.equal(requests[0].method, 'PATCH');
		assert.equal(requests[0].url, `${URL}/api/event/base_bookable_usage_counter/3`);
		assert.deepEqual(requests[0].body, { data: { counterValue: 1240.2 } });
	});

	it('lists the usage counters of a bookable', async () => {
		const { requests } = await run({ resource: 'usageCounter', operation: 'getAll', returnAll: false, limit: 10, usageCounterBookable: '7' }, () => []);
		assert.deepEqual(requests[0].qs, { baseBookable: '7', page: '0', pageSize: '10' });
	});

	it('sends a push notification to persons as a mass notification', async () => {
		const { requests } = await run({
			resource: 'notification', operation: 'send', recipientType: 'person', recipientIds: '12, 34', text: 'Halle gesperrt',
			longText: 'Heute kein Training', channels: ['sendPush', 'sendMail'], additionalFields: {},
		});
		assert.equal(requests[0].url, `${URL}/api/notification/mass_notification`);
		assert.deepEqual(requests[0].body, {
			data: {
				referenceClassName: 'person', referenceIds: [12, 34], text: 'Halle gesperrt', longText: 'Heute kein Training',
				sendPush: true, sendMail: true, sendLetter: false, sendSms: false, sendWhatsapp: false,
			},
		});
	});
});

describe('ticket SLA fields', () => {
	const sla = (first, resolution) => ({
		priority: 2,
		first_response: { due: '2026-10-11T10:00:00+02:00', done_at: null, status: first },
		resolution: { due: '2026-10-12T10:00:00+02:00', done_at: null, status: resolution },
	});

	it('puts the SLA state at the top level and filters by it', async () => {
		const { items } = await run(
			{ resource: 'ticket', operation: 'getAll', returnAll: false, limit: 10, slaStatus: ['breached', 'warning'] },
			() => [{ id: 1, sla: sla('breached', 'open') }, { id: 2, sla: sla('met', 'open') }, { id: 3, sla: null }, { id: 4, sla: sla('met', 'warning') }],
		);
		assert.deepEqual(items.map((t) => t.id), [1, 4]);
		assert.equal(items[0].sla_first_response_status, 'breached');
		assert.equal(items[0].sla_resolution_due, '2026-10-12T10:00:00+02:00');
	});

	it('leaves tickets without SLA unchanged', () => {
		assert.deepEqual(actions.flattenTicketSla({ id: 3, sla: null }), { id: 3, sla: null });
		assert.deepEqual(actions.filterTicketsBySla([{ id: 3 }], []), [{ id: 3 }]);
	});
});

describe('date helpers', () => {
	it('converts n8n dates to ERP form values', () => {
		assert.equal(actions.toErpDateTime('2026-10-11T18:05:00.000+02:00'), '2026-10-11 18:05:00');
		assert.equal(actions.toErpDateTime('2026-10-11T18:05'), '2026-10-11 18:05:00');
		assert.equal(actions.toErpDate('2026-10-11T18:05:00'), '2026-10-11');
		assert.deepEqual(actions.idList(' 7, 8,,9 '), ['7', '8', '9']);
	});
});
