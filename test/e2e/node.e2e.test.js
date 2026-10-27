'use strict';
/**
 * End-to-end tests: the compiled nodes run against a real vynst (inwendo ERP).
 *
 *   npm run build
 *   IW_E2E_ERP_HOST=http://127.0.0.1:8000 IW_E2E_ERP_TOKEN=<jwt> npm run test:e2e
 *
 * The token needs the scopes listed in the Readme (crm, crm_project, ticket,
 * own_ticket, time, billing, event, event_booking, media, webhook) and
 * "Allow admin functions" for the Webhook resource. Invoices and offers need
 * the default billing entities (tax, accounting types, payment type / goal).
 * Set IW_E2E_PDF=1 when the ERP can render PDFs (LaTeX service), IW_E2E_SMART_LOCK_ID to the id of
 * a smart lock for the access check (Scope event).
 * The resources behind ERP settings (inventory loans, shifts, volunteer hours, general meetings,
 * occupancy, timed booking events) pass when the setting is off and the node names the setting.
 * Without IW_E2E_ERP_HOST / IW_E2E_ERP_TOKEN every test is skipped.
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { enabled, runNode, triggerHooks, erp, testCredential } = require('./harness');

const skip = !enabled && 'IW_E2E_ERP_HOST / IW_E2E_ERP_TOKEN not set';
const run = `n8n-e2e-${Date.now().toString(36)}`;

function localDateTime(daysAhead, hour) {
	const d = new Date();
	d.setDate(d.getDate() + daysAhead);
	d.setHours(hour, 0, 0, 0);
	const p = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:00:00`;
}

const single = (items) => {
	assert.equal(items.length, 1, JSON.stringify(items).slice(0, 300));
	return items[0].json;
};

/**
 * Create -> Get -> Get Many (limit) -> Get Many (return all) -> Update for one resource,
 * exactly as a workflow would configure the node. Returns the created entity.
 */
async function crud(resource, idField, create, update, check) {
	const created = single(await runNode({ resource, operation: 'create', ...create }));
	assert.ok(created.id, `${resource} create returned no id`);

	const fetched = single(await runNode({ resource, operation: 'get', [idField]: String(created.id) }));
	assert.equal(fetched.id, created.id);

	const limited = await runNode({ resource, operation: 'getAll', returnAll: false, limit: 1 });
	assert.equal(limited.length, 1, `${resource} getAll limit=1 returned ${limited.length} items`);

	const all = await runNode({ resource, operation: 'getAll', returnAll: true });
	assert.ok(
		all.some((item) => item.json.id === created.id),
		`${resource} getAll returnAll misses the created entity`,
	);

	const updated = single(
		await runNode({ resource, operation: 'update', [idField]: String(created.id), updateFields: update }),
	);
	assert.equal(updated.id, created.id);
	if (check) check(updated, created);
	return created;
}

describe('vynst (inwendo ERP) node against a live ERP', { skip }, () => {
	const ids = {};

	before(async () => {
		const [taxes, accountingTypes, offerAccountingTypes, paymentTypes, paymentGoals] = await Promise.all([
			erp('GET', '/api/invoice/taxes'),
			erp('GET', '/api/invoice/accountingtypes'),
			erp('GET', '/api/invoice/offeraccountingtypes'),
			erp('GET', '/api/invoice/paymenttypes'),
			erp('GET', '/api/invoice/paymentgoals'),
		]);
		Object.assign(ids, {
			tax: taxes[0]?.id,
			accountingType: accountingTypes[0]?.id,
			offerAccountingType: offerAccountingTypes[0]?.id,
			paymentType: paymentTypes[0]?.id,
			paymentGoal: paymentGoals[0]?.id,
		});
	});

	it('credential test request', async () => {
		const info = await testCredential();
		assert.ok(info.user, JSON.stringify(info));
	});

	it('company', async () => {
		const company = await crud(
			'company',
			'companyId',
			{ companyName: `${run} company`, additionalFields: { shortName: 'E2E', isCustomer: true, email: 'e2e@example.com' } },
			{ shortName: 'E2E2', phone: '+49 123' },
			(updated) => {
				assert.equal(updated.short_name, 'E2E2');
				assert.equal(updated.company_name, `${run} company`, 'PATCH must keep fields that were not sent');
			},
		);
		ids.company = company.id;

		const found = await runNode({ resource: 'company', operation: 'getAll', returnAll: true, searchString: run });
		assert.ok(found.some((item) => item.json.id === company.id), 'search string');
	});

	it('person', async () => {
		ids.person = (
			await crud(
				'person',
				'personId',
				{ firstName: 'Erika', lastName: `${run}`, additionalFields: { email: `${run}@example.com` } },
				{ nickname: 'eri' },
				(updated) => assert.equal(updated.last_name, run),
			)
		).id;
	});

	it('project', async () => {
		ids.project = (
			await crud('project', 'projectId', { name: `${run} project`, additionalFields: { company: String(ids.company) } }, {
				description: 'updated by n8n',
			})
		).id;
	});

	it('ticket', async () => {
		await crud(
			'ticket',
			'ticketId',
			{ headline: `${run} ticket`, additionalFields: { crmProject: String(ids.project), description: 'from n8n' } },
			{ description: 'updated by n8n' },
		);
	});

	it('time entry', async () => {
		await crud(
			'timeEntry',
			'timeEntryId',
			{ start: localDateTime(1, 9), additionalFields: { end: localDateTime(1, 10), description: `${run} time` } },
			{ description: 'updated by n8n' },
		);
	});

	it('event, event sign-up and booking', async () => {
		ids.event = (
			await crud('event', 'eventId', { name: `${run} event`, additionalFields: { startTime: localDateTime(2, 10), endTime: localDateTime(2, 12) } }, {
				description: 'updated by n8n',
			})
		).id;

		// Sign-ups for the main event must be allowed on the event; the node has no field for it,
		// so this goes through the Generic API Request resource.
		const patched = single(
			await runNode({
				resource: 'genericRequest',
				httpMethod: 'PATCH',
				endpoint: `/api/event/base_event/${ids.event}`,
				body: JSON.stringify({ data: { canSignUpForMainEvent: true } }),
				queryParameters: { parameter: [] },
			}),
		);
		assert.equal(patched.id, ids.event);

		await crud(
			'eventSignUp',
			'eventSignUpId',
			{ firstName: 'Max', lastName: run, additionalFields: { baseEvent: String(ids.event), email: `${run}-signup@example.com` } },
			{ note: 'updated by n8n' },
		);

		await crud(
			'booking',
			'bookingId',
			{ additionalFields: { startTime: localDateTime(3, 13), endTime: localDateTime(3, 14), description: `${run} booking` } },
			{ description: 'updated by n8n' },
		);
	});

	it('news article', async () => {
		// the list only contains news, press and undefined articles by default
		await crud('newsArticle', 'newsArticleId', { name: `${run} news`, additionalFields: { newsType: 'NEWS_TYPE_NEWS' } }, {
			description: 'updated by n8n',
		});
	});

	it('webhook update keeps the fields that were not sent', async () => {
		await crud(
			'webhook',
			'webhookId',
			{
				name: `${run} webhook`,
				notificationUrl: 'https://n8n.example.com/webhook/e2e',
				referenceClassName: 'CRMCompany',
				databaseAction: 'update',
			},
			{ name: `${run} webhook renamed` },
			(updated) => {
				assert.equal(updated.name, `${run} webhook renamed`);
				assert.equal(updated.notification_url, 'https://n8n.example.com/webhook/e2e');
				assert.equal(updated.database_action, 'update');
			},
		);
	});

	it('invoice and offer', async () => {
		const invoice = single(
			await runNode({
				resource: 'invoice',
				operation: 'create',
				accountingType: String(ids.accountingType),
				tax: String(ids.tax),
				paymentType: String(ids.paymentType),
				paymentGoal: String(ids.paymentGoal),
				buyerName: `${run} buyer`,
				additionalFields: { message: 'from n8n', buyerVatId: 'DE123456789' },
			}),
		);
		assert.ok(invoice.id);
		const fetched = single(await runNode({ resource: 'invoice', operation: 'get', invoiceId: String(invoice.id) }));
		assert.equal(fetched.id, invoice.id);
		const invoices = await runNode({ resource: 'invoice', operation: 'getAll', returnAll: true });
		assert.ok(invoices.some((item) => item.json.id === invoice.id));

		const offer = single(
			await runNode({
				resource: 'offer',
				operation: 'create',
				offerAccountingType: String(ids.offerAccountingType),
				tax: String(ids.tax),
				paymentGoal: String(ids.paymentGoal),
				buyerName: `${run} buyer`,
			}),
		);
		assert.ok(offer.id);
		assert.equal(single(await runNode({ resource: 'offer', operation: 'get', offerId: String(offer.id) })).id, offer.id);

		if (process.env.IW_E2E_PDF === '1') {
			const [pdf] = await runNode({ resource: 'invoice', operation: 'getPdf', invoiceId: String(invoice.id) });
			assert.equal(pdf.binary.data.mimeType, 'application/pdf');
			assert.ok(Buffer.from(pdf.binary.data.data, 'base64').subarray(0, 4).toString() === '%PDF');
		}
	});

	it('generic API request', async () => {
		const items = await runNode({
			resource: 'genericRequest',
			httpMethod: 'GET',
			endpoint: '/api/crm/crmcompanies',
			queryParameters: { parameter: [{ name: 'searchString', value: run }] },
		});
		assert.ok(items.length >= 1);
	});

	it('smart lock: check access of a reader and the smart lock log', async (t) => {
		// listing smart locks needs a super admin token, so the lock comes from the environment
		const smartLockId = process.env.IW_E2E_SMART_LOCK_ID;
		if (!smartLockId) {
			t.skip('IW_E2E_SMART_LOCK_ID not set');
			return;
		}
		const answer = single(await runNode({ resource: 'smartLock', operation: 'checkAccess', smartLockId, credential: `${run}-unknown\n`, credentialType: 'auto', open: false }));
		assert.equal(answer.granted, false);
		assert.equal(answer.reason, 'unknown_credential');
		assert.equal(answer.credential, `${run}-unknown`);

		// the smart lock log is for super admins only (token with "allow super admin functions")
		try {
			const log = await runNode({ resource: 'smartLock', operation: 'getLog', logSmartLockId: smartLockId, returnAll: false, limit: 5 });
			assert.ok(log.some((item) => item.json.action === 'access_denied' && item.json.source === 'n8n'));
		} catch (error) {
			if (!/vynst (inwendo ERP) error 403/.test(error.message)) throw error;
			t.diagnostic('smart lock log skipped: the token has no super admin functions');
		}
	});

	/**
	 * Read operations of the resources behind ERP settings: they either work or fail with the
	 * "switched off" message naming the setting (or a missing scope of the token).
	 */
	for (const [label, params] of [
		['inventory loan: overdue loans', { resource: 'inventoryLoan', operation: 'getAll', returnAll: false, limit: 5, filters: { state: 'OVERDUE' } }],
		['inventory loan: stock', { resource: 'inventoryLoan', operation: 'getStock' }],
		['shift plan entry: own shifts', { resource: 'shiftPlanEntry', operation: 'getOwn', returnAll: false, limit: 5 }],
		['volunteer hour entries', { resource: 'volunteerHourEntry', operation: 'getAll', returnAll: false, limit: 5 }],
		['helper shifts', { resource: 'helperShift', operation: 'getAll', returnAll: false, limit: 5 }],
		['membership pauses', { resource: 'membershipPause', operation: 'getAll', returnAll: false, limit: 5, filters: { status: 'REQUESTED' } }],
		['general meetings', { resource: 'generalMeeting', operation: 'getAll', returnAll: false, limit: 5 }],
		['occupancy', { resource: 'occupancy', operation: 'get', occupancyBookables: '' }],
		['usage counters', { resource: 'usageCounter', operation: 'getAll', returnAll: false, limit: 5 }],
		['mass notifications', { resource: 'notification', operation: 'getAll', returnAll: false, limit: 5 }],
		['tickets with SLA fields', { resource: 'ticket', operation: 'getAll', returnAll: false, limit: 5, slaStatus: [] }],
	]) {
		it(label, async (t) => {
			try {
				const items = await runNode(params);
				assert.ok(Array.isArray(items));
				if (params.resource === 'occupancy') {
					for (const item of items) assert.ok('occupied' in item.json && 'generated_at' in item.json);
				}
			} catch (error) {
				if (/switched off \(ERP setting "[\w.-]+"\)/.test(error.message)) {
					t.diagnostic(`${label}: ${error.message}`);
					return;
				}
				if (/vynst (inwendo ERP) error 40[13]/.test(error.message)) {
					t.diagnostic(`${label}: the token lacks the scope (${error.message})`);
					return;
				}
				throw error;
			}
		});
	}

	it('an ERP error surfaces as a node error', async () => {
		await assert.rejects(runNode({ resource: 'company', operation: 'get', companyId: '999999999' }), (error) => {
			assert.match(error.message, /vynst (inwendo ERP) error 404/);
			assert.match(error.description, /data not found or missing access rights/);
			return true;
		});
	});
});

describe('vynst (inwendo ERP) Trigger against a live ERP', { skip }, () => {
	const webhookUrl = `https://n8n.example.com/webhook/${run}/inwendo-erp`;

	it('registers, validates and removes its webhook', async () => {
		const hooks = triggerHooks({ autoRegister: true, entityType: 'CRMCompany', action: 'update', webhookToken: '' }, webhookUrl);
		assert.equal(await hooks.checkExists(), false);
		assert.equal(await hooks.create(), true);
		const webhookId = hooks.staticData.webhookId;
		assert.ok(webhookId, 'webhook id stored');
		assert.match(hooks.staticData.generatedToken, /^[0-9a-f]{48}$/);

		// the ERP row is scoped to n8n and filtered on the selected entity and action
		const row = await erp('GET', `/api/dw/webhook/${webhookId}`);
		assert.equal(row.notification_url, webhookUrl);
		assert.equal(row.notification_client_id, 'n8n');
		assert.equal(row.reference_class_name, 'crmcompany');
		assert.equal(row.database_action, 'update');

		// re-activation updates the same row
		assert.equal(await hooks.create(), true);
		assert.equal(hooks.staticData.webhookId, webhookId);

		const payload = { iw_entity_class: 'Inwendo\\CRMBundle\\Entity\\CRMCompany', iw_entity_short_class: 'CRMCompany', iw_entity_id: '1', iw_action: 'update' };
		const token = hooks.staticData.generatedToken;
		assert.deepEqual((await hooks.receive(payload, { 'x-iw-webhook-token': token })).workflowData[0][0].json, payload);
		assert.equal((await hooks.receive(payload, { 'x-iw-webhook-token': 'wrong' })).webhookResponse, 'Unauthorized');
		assert.equal((await hooks.receive({ ...payload, iw_action: 'delete' }, { 'x-iw-webhook-token': token })).webhookResponse, 'Filtered');
		const otherClass = { ...payload, iw_entity_class: 'Inwendo\\CRMBundle\\Entity\\CRMCompanyDepartment', iw_entity_short_class: 'CRMCompanyDepartment' };
		assert.equal((await hooks.receive(otherClass, { 'x-iw-webhook-token': token })).webhookResponse, 'Filtered');

		assert.equal(await hooks.delete(), true);
		assert.equal(hooks.staticData.webhookId, undefined);
		const deleted = await erp('DELETE', '/api/n8n/webhook', { webhook_url: webhookUrl });
		assert.equal(deleted.count, 0, 'deactivation removed the ERP webhook');
	});

	it('every entity type of the trigger can be registered', async () => {
		const trigger = require('../../dist/nodes/InwendoErp/InwendoErpTrigger.node.js');
		const entityTypes = new trigger.InwendoErpTrigger().description.properties
			.find((p) => p.name === 'entityType')
			.options.map((o) => o.value)
			.filter((v) => v !== 'all');
		for (const entityType of entityTypes) {
			const hooks = triggerHooks({ autoRegister: true, entityType, action: 'all', webhookToken: '' }, `${webhookUrl}/${entityType}`);
			assert.equal(await hooks.create(), true, entityType);
			assert.equal(await hooks.delete(), true, entityType);
		}
	});

	it('timed booking events register or name their setting', async (t) => {
		const hooks = triggerHooks({ autoRegister: true, action: 'booking_timed', bookableFilter: '', webhookToken: '' }, `${webhookUrl}/timed`);
		try {
			assert.equal(await hooks.create(), true);
		} catch (error) {
			if (/integration_booking_timed_events_enabled/.test(error.message)) {
				t.diagnostic(error.message);
				return;
			}
			throw error;
		}
		const row = await erp('GET', `/api/dw/webhook/${hooks.staticData.webhookId}`);
		assert.equal(row.database_action, 'booking_timed');
		assert.equal(await hooks.delete(), true);
	});

	it('manual mode never touches the ERP', async () => {
		const hooks = triggerHooks({ autoRegister: false, entityType: 'all', action: 'all', webhookToken: 'secret' }, webhookUrl);
		assert.equal(await hooks.checkExists(), true);
		assert.equal(await hooks.create(), true);
		assert.equal(hooks.staticData.webhookId, undefined);
		assert.equal((await hooks.receive({ iw_action: 'create' }, { 'x-iw-webhook-token': 'secret' })).workflowData.length, 1);
	});
});
