'use strict';
/**
 * Offline tests of the request helpers (no ERP needed): pagination and error details.
 * Run with `npm test` (builds first).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
	inwendoErpApiRequest,
	inwendoErpApiRequestAllItems,
} = require(path.resolve(__dirname, '../../dist/nodes/InwendoErp/GenericFunctions.js'));

/** A fake n8n context whose HTTP helper serves `pages` (0-based) and records the requests. */
function context({ pages = [], maxPagesHeader, fail } = {}) {
	const requests = [];
	return {
		requests,
		getNode: () => ({ name: 'inwendo ERP', type: 'n8n-nodes-inwendo-erp.inwendoErp', typeVersion: 1, parameters: {} }),
		getCredentials: async () => ({ host: 'https://erp.example.com/', apiToken: 'jwt' }),
		helpers: {
			httpRequestWithAuthentication: async (type, options) => {
				requests.push({ ...options });
				if (fail) throw fail;
				const page = Number(options.qs.page);
				const body = pages[page] ?? [];
				const headers = maxPagesHeader === undefined ? {} : { 'x-iw-max-pages': String(maxPagesHeader) };
				return options.returnFullResponse ? { body, headers, statusCode: 200 } : body;
			},
		},
	};
}

describe('inwendoErpApiRequestAllItems', () => {
	it('reads every 0-based page the ERP reports', async () => {
		const ctx = context({ pages: [[{ id: 1 }, { id: 2 }], [{ id: 3 }], [{ id: 4 }]], maxPagesHeader: 3 });
		const items = await inwendoErpApiRequestAllItems.call(ctx, 'GET', '/api/crm/crmcompanies', { searchString: 'x' });
		assert.deepEqual(items.map((i) => i.id), [1, 2, 3, 4]);
		assert.deepEqual(ctx.requests.map((r) => r.qs.page), ['0', '1', '2']);
		assert.equal(ctx.requests[0].qs.withMaxPageNumber, 'n8n');
		assert.equal(ctx.requests[0].qs.searchString, 'x');
		assert.equal(ctx.requests[0].url, 'https://erp.example.com/api/crm/crmcompanies');
		assert.equal(ctx.requests[0].headers['X-IW-Trigger-Source'], 'n8n');
	});

	it('without a page count it reads until an empty page', async () => {
		const ctx = context({ pages: [[{ id: 1 }], [{ id: 2 }]], maxPagesHeader: -1 });
		const items = await inwendoErpApiRequestAllItems.call(ctx, 'GET', '/api/x');
		assert.deepEqual(items.map((i) => i.id), [1, 2]);
		assert.equal(ctx.requests.length, 3);
	});

	it('accepts { data: [...] } pages', async () => {
		const ctx = context({ pages: [{ data: [{ id: 1 }] }], maxPagesHeader: 1 });
		assert.deepEqual(await inwendoErpApiRequestAllItems.call(ctx, 'GET', '/api/x'), [{ id: 1 }]);
	});
});

describe('inwendoErpApiRequest', () => {
	it('puts the ERP error code and message into the node error', async () => {
		const error = Object.assign(new Error('Request failed with status code 400'), {
			response: { status: 400, headers: { 'x-iw-error-code': '1300', 'x-iw-error-json': '["Invalid Form"]' } },
		});
		const ctx = context({ fail: error });
		await assert.rejects(inwendoErpApiRequest.call(ctx, 'POST', '/api/x', { data: {} }), (err) => {
			assert.equal(err.message, 'vynst error 1300');
			assert.equal(err.description, '["Invalid Form"]');
			return true;
		});
	});

	it('sends JSON bodies only when there is something to send', async () => {
		const ctx = context({ pages: [{ ok: true }] });
		await inwendoErpApiRequest.call(ctx, 'GET', '/api/x', {}, { page: '0' });
		assert.equal(ctx.requests[0].body, undefined);
		assert.equal(ctx.requests[0].json, true);
	});
});

describe('feature switched off in the ERP', () => {
	const { featureDisabledSetting } = require(path.resolve(__dirname, '../../dist/nodes/InwendoErp/GenericFunctions.js'));

	it('names the setting of a "feature disabled" answer (HTTP 400, X-IW-ERROR-CODE 404)', async () => {
		const error = Object.assign(new Error('Request failed with status code 400'), {
			response: {
				status: 400,
				headers: { 'x-iw-error-code': '404', 'x-iw-error-json': '["feature disabled: integration_occupancy_api_enabled"]' },
			},
		});
		const ctx = context({ fail: error });
		await assert.rejects(inwendoErpApiRequest.call(ctx, 'GET', '/api/event/bookable_occupancy'), (err) => {
			assert.equal(err.message, 'vynst: this function is switched off (ERP setting "integration_occupancy_api_enabled")');
			assert.match(err.description, /Enable the setting "integration_occupancy_api_enabled"/);
			return true;
		});
	});

	it('maps the older switched-off answers to their settings', () => {
		assert.equal(featureDisabledSetting('1585', '{"message":"Inventory loans are switched off"}'), 'event_inventory_enabled');
		assert.equal(featureDisabledSetting('1640', '{"message":"General meetings are disabled"}'), 'inwendo_crm_general_meeting_enabled');
		assert.equal(featureDisabledSetting('6090', '["Volunteer hours are disabled"]'), 'volunteer_hours_enabled');
		assert.equal(featureDisabledSetting('403', '["Shift planning is not enabled"]'), 'shift_planning_enabled');
		assert.equal(featureDisabledSetting('403', '["Shift clocking is not enabled"]'), 'shift_clocking_enabled');
		assert.equal(featureDisabledSetting('403', '["Access denied"]'), undefined);
		assert.equal(featureDisabledSetting('1300', '["Invalid Form"]'), undefined);
	});

	it('leaves other ERP errors as they are', async () => {
		const error = Object.assign(new Error('Request failed with status code 404'), {
			response: { status: 404, headers: { 'x-iw-error-code': '404', 'x-iw-error-json': '{"message":"Loan not found"}' } },
		});
		await assert.rejects(inwendoErpApiRequest.call(context({ fail: error }), 'GET', '/api/x'), (err) => {
			assert.equal(err.message, 'vynst error 404');
			return true;
		});
	});
});
