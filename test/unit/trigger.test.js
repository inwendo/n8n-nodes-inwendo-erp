'use strict';
/**
 * Offline tests of the inwendo ERP Trigger: registration of entity events and timed booking
 * events, filtering and the output of incoming webhooks. Run with `npm test`.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { InwendoErpTrigger, triggerOutput, actionMatches } = require(
	path.resolve(__dirname, '../../dist/nodes/InwendoErp/InwendoErpTrigger.node.js'),
);

function context(params, { fail, staticData = {} } = {}) {
	const requests = [];
	return {
		requests,
		staticData,
		getNode: () => ({ name: 'inwendo ERP Trigger', type: 'n8n-nodes-inwendo-erp.inwendoErpTrigger', typeVersion: 1, parameters: {} }),
		// hidden parameters (entityType for timed events) are not available, like in n8n
		getNodeParameter: (name, fallback) => {
			if (name in params) return params[name];
			if (fallback !== undefined) return fallback;
			throw new Error(`Could not get parameter "${name}"`);
		},
		getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/abc/inwendo-erp',
		getWorkflowStaticData: () => staticData,
		getCredentials: async () => ({ host: 'https://erp.example.com', apiToken: 'jwt' }),
		helpers: {
			httpRequestWithAuthentication: async (type, options) => {
				requests.push(options);
				if (fail) throw fail;
				return { status: 'created', webhook_id: 5 };
			},
			returnJsonArray: (data) => (Array.isArray(data) ? data : [data]).map((json) => ({ json })),
		},
	};
}

function receive(params, body, staticData = { generatedToken: 't' }) {
	const ctx = context(params, { staticData });
	return new InwendoErpTrigger().webhook.call({
		...ctx,
		getBodyData: () => body,
		getHeaderData: () => ({ 'x-iw-webhook-token': 't' }),
	});
}

const timedBody = (type, bookableId = 7) => ({
	iw_action: type,
	iw_entity_class: 'Inwendo\\EventBundle\\Entity\\BaseBooking',
	iw_entity_short_class: 'booking',
	iw_entity_id: 123,
	iw_dt: 1760131200,
	iw_timed_event: {
		type, due_at: '2026-10-11T18:00:00+02:00', booking_id: 123, booking_title: 'Training U12',
		start: '2026-10-11T18:00:00+02:00', end: '2026-10-11T19:30:00+02:00', bookable_id: bookableId,
		bookable_name: 'Halle 1', location_id: 2, location_name: 'Sportzentrum', participants: 14,
		pre_start_minutes: 30, post_end_minutes: 15,
	},
	data: { id: 123, title: 'Training U12' },
});

describe('inwendo ERP Trigger: timed booking events', () => {
	const hooks = new InwendoErpTrigger().webhookMethods.default;

	it('registers the timed action with BaseBooking', async () => {
		const ctx = context({ autoRegister: true, action: 'booking_pre_start' });
		await hooks.create.call(ctx);
		const body = ctx.requests[0].body;
		assert.equal(ctx.requests[0].url, 'https://erp.example.com/api/n8n/webhook');
		assert.equal(body.database_action, 'booking_pre_start');
		assert.equal(body.reference_class_name, 'BaseBooking');
		assert.ok(body.webhook_token);

		const all = context({ autoRegister: true, action: 'booking_timed', entityType: 'CRMCompany' });
		await hooks.create.call(all);
		assert.equal(all.requests[0].body.database_action, 'booking_timed');
		assert.equal(all.requests[0].body.reference_class_name, 'BaseBooking');
	});

	it('names the setting when timed events are switched off', async () => {
		const fail = Object.assign(new Error('Request failed with status code 400'), {
			response: { status: 400, headers: { 'x-iw-error-code': '404', 'x-iw-error-json': '["feature disabled: integration_booking_timed_events_enabled"]' } },
		});
		await assert.rejects(hooks.create.call(context({ autoRegister: true, action: 'booking_start' }, { fail })), (err) => {
			assert.match(err.message, /switched off.*integration_booking_timed_events_enabled/);
			return true;
		});
	});

	it('says so when the ERP does not know timed events yet', async () => {
		const fail = Object.assign(new Error('Request failed with status code 400'), {
			response: { status: 400, headers: { 'x-iw-error-code': '400', 'x-iw-error-json': '["database_action must be one of create|update|delete or null"]' } },
		});
		await assert.rejects(hooks.create.call(context({ autoRegister: true, action: 'booking_end' }, { fail })), /does not support timed booking events/);
	});

	it('outputs the timed event fields at the top level plus the booking', async () => {
		const result = await receive({ action: 'booking_start' }, timedBody('booking_start'));
		const json = result.workflowData[0][0].json;
		assert.equal(json.type, 'booking_start');
		assert.equal(json.booking_title, 'Training U12');
		assert.equal(json.bookable_id, 7);
		assert.equal(json.iw_action, 'booking_start');
		assert.deepEqual(json.data, { id: 123, title: 'Training U12' });
	});

	it('filters by timed action and bookable', async () => {
		assert.equal((await receive({ action: 'booking_start' }, timedBody('booking_end'))).webhookResponse, 'Filtered');
		assert.ok((await receive({ action: 'booking_timed' }, timedBody('booking_post_end'))).workflowData);
		assert.equal((await receive({ action: 'booking_timed' }, { ...timedBody('booking_end'), iw_action: 'update' })).webhookResponse, 'Filtered');
		assert.equal((await receive({ action: 'booking_timed', bookableFilter: '8, 9' }, timedBody('booking_start', 7))).webhookResponse, 'Filtered');
		assert.ok((await receive({ action: 'booking_timed', bookableFilter: '8, 7' }, timedBody('booking_start', 7))).workflowData);
	});

	it('matches actions', () => {
		assert.equal(actionMatches('all', 'booking_start'), true);
		assert.equal(actionMatches('booking_timed', 'booking_pre_start'), true);
		assert.equal(actionMatches('booking_timed', 'create'), false);
		assert.equal(actionMatches('create', 'create'), true);
	});
});

describe('inwendo ERP Trigger: entity events', () => {
	it('registers a new entity type by its class name', async () => {
		const ctx = context({ autoRegister: true, entityType: 'EventInventoryLoan', action: 'create' });
		await new InwendoErpTrigger().webhookMethods.default.create.call(ctx);
		assert.deepEqual(
			{ cls: ctx.requests[0].body.reference_class_name, action: ctx.requests[0].body.database_action },
			{ cls: 'EventInventoryLoan', action: 'create' },
		);
	});

	it('puts webhook_data of smart lock log and check-in events at the top level', async () => {
		const body = {
			iw_action: 'create', iw_entity_class: 'Inwendo\\EventBundle\\Entity\\SmartLockLog', iw_entity_short_class: 'smart_lock_log',
			iw_entity_id: 99, data: { id: 99 },
			webhook_data: { type: 'access', smart_lock_id: 4, smart_lock_name: 'Haupteingang', action: 'unlock', success: true },
		};
		const result = await receive({ entityType: 'SmartLockLog', action: 'create' }, body);
		const json = result.workflowData[0][0].json;
		assert.equal(json.type, 'access');
		assert.equal(json.smart_lock_name, 'Haupteingang');
		assert.equal(json.iw_entity_id, 99);

		const checkIn = await receive({ entityType: 'AttendanceListEntry', action: 'all' }, {
			iw_action: 'create', iw_entity_class: 'Inwendo\\EventBundle\\Entity\\AttendanceListEntry', iw_entity_short_class: 'attendancelistentry',
			iw_entity_id: 5, webhook_data: { type: 'check_in', checked_in: true },
		});
		assert.equal(checkIn.workflowData[0][0].json.type, 'check_in');
		assert.equal((await receive({ entityType: 'SmartLockLog', action: 'all' }, { ...body, iw_entity_class: 'Inwendo\\EventBundle\\Entity\\AttendanceListEntry', iw_entity_short_class: 'attendancelistentry' })).webhookResponse, 'Filtered');
	});

	it('never lets a summary overwrite the envelope', () => {
		assert.equal(triggerOutput({ iw_action: 'create', webhook_data: { iw_action: 'x', type: 'access' } }).iw_action, 'create');
		assert.deepEqual(triggerOutput({ iw_action: 'update' }), { iw_action: 'update' });
	});
});
