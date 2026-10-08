'use strict';
/**
 * Offline tests of the smart lock parts: the lock trigger (registration, signed commands) and the
 * smart lock operations of the action node. Run with `npm test` (builds first).
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

const dist = path.resolve(__dirname, '../../dist/nodes/InwendoErp');
const { InwendoErpLockTrigger } = require(path.join(dist, 'InwendoErpLockTrigger.node.js'));
const { InwendoErp } = require(path.join(dist, 'InwendoErp.node.js'));
const { sign } = require(path.join(dist, 'LockProtocol.js'));

const LOCKS = { lock: [{ id: 'front_door', name: 'Haupteingang', unlockMethod: 'remote' }, { id: 'gym', name: '', unlockMethod: 'qr_code' }] };

function hookContext({ mode = 'trigger', staticData = {}, params = {} } = {}) {
	const requests = [];
	return {
		requests,
		staticData,
		getMode: () => mode,
		getNode: () => ({ name: 'Lock Trigger', type: 'n8n-nodes-inwendo-erp.inwendoErpLockTrigger', typeVersion: 1, parameters: {} }),
		getNodeParameter: (name, fallback) => (name in params ? params[name] : fallback),
		getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/abc/inwendo-erp-lock',
		getWorkflowStaticData: () => staticData,
		getCredentials: async () => ({ host: 'https://erp.example.com', apiToken: 'jwt' }),
		helpers: {
			httpRequestWithAuthentication: async (type, options) => {
				requests.push(options);
				return { status: 'created', connection_id: 5 };
			},
		},
	};
}

function webhookContext({ body, signature, staticData }) {
	const response = { statusCode: 200, body: undefined };
	return {
		response,
		getRequestObject: () => ({ rawBody: Buffer.from(body) }),
		getResponseObject: () => ({ status(code) { response.statusCode = code; return this; }, json(data) { response.body = data; } }),
		getWorkflowStaticData: () => staticData,
		getHeaderData: () => ({ 'x-iw-signature': signature }),
		getBodyData: () => JSON.parse(body),
		getNodeParameter: (name, fallback) => (name === 'locks' ? LOCKS : fallback),
		helpers: { returnJsonArray: (data) => [{ json: data }] },
	};
}

function command(overrides = {}) {
	return JSON.stringify({
		type: 'iw_lock_command', instance_id: 'n8n-instance-1', lock_id: 'front_door', smart_lock_id: 7,
		command: 'open', ts: Math.floor(Date.now() / 1000), nonce: crypto.randomBytes(16).toString('hex'), ...overrides,
	});
}

describe('inwendo ERP Lock Trigger', () => {
	const trigger = new InwendoErpLockTrigger();
	const hooks = trigger.webhookMethods.default;

	it('registers its locks with the production webhook URL and keeps instance id and secret', async () => {
		const ctx = hookContext({ params: { locks: LOCKS, connectionName: 'Vereinsheim' } });
		await hooks.create.call(ctx);
		const body = ctx.requests[0].body;
		assert.equal(ctx.requests[0].url, 'https://erp.example.com/api/n8n/smart_lock/register');
		assert.equal(body.delivery, 'push');
		assert.equal(body.webhook_url, 'https://n8n.example.com/webhook/abc/inwendo-erp-lock');
		assert.equal(body.name, 'Vereinsheim');
		assert.deepEqual(body.locks, [
			{ id: 'front_door', name: 'Haupteingang', unlock_method: 'remote' },
			{ id: 'gym', name: 'gym', unlock_method: 'qr_code' },
		]);
		assert.match(body.instance_id, /^n8n-[0-9a-f]{24}$/);
		assert.equal(body.secret.length, 64);

		await hooks.create.call(ctx);
		assert.equal(ctx.requests[1].body.secret, body.secret, 'the secret stays');

		await hooks.delete.call(ctx);
		assert.equal(ctx.requests[2].method, 'DELETE');
		assert.equal(ctx.staticData.secret, body.secret);
	});

	it('does not register test webhooks and rejects bad lock ids', async () => {
		const manual = hookContext({ mode: 'manual', params: { locks: LOCKS } });
		await hooks.create.call(manual);
		assert.equal(manual.requests.length, 0);

		const bad = hookContext({ params: { locks: { lock: [{ id: 'bad id' }] } } });
		await assert.rejects(hooks.create.call(bad), /Invalid lock ID/);
	});

	it('starts the workflow for signed commands only, once', async () => {
		const staticData = { instanceId: 'n8n-instance-1', secret: 'a'.repeat(64) };
		const body = command();
		const ok = webhookContext({ body, signature: sign(body, staticData.secret), staticData });
		const result = await trigger.webhook.call(ok);
		assert.deepEqual(result.webhookResponse, { success: true });
		assert.equal(result.workflowData[0][0].json.command, 'open');
		assert.equal(result.workflowData[0][0].json.lock_name, 'Haupteingang');

		const replay = webhookContext({ body, signature: sign(body, staticData.secret), staticData });
		assert.deepEqual(await trigger.webhook.call(replay), { noWebhookResponse: true });
		assert.equal(replay.response.body.error, 'command replayed');

		const forged = webhookContext({ body: command(), signature: '0'.repeat(64), staticData });
		await trigger.webhook.call(forged);
		assert.equal(forged.response.statusCode, 401);

		const old = command({ ts: Math.floor(Date.now() / 1000) - 120 });
		const expired = webhookContext({ body: old, signature: sign(old, staticData.secret), staticData });
		await trigger.webhook.call(expired);
		assert.equal(expired.response.body.error, 'command expired');

		const other = command({ lock_id: 'unknown' });
		const unknown = webhookContext({ body: other, signature: sign(other, staticData.secret), staticData });
		await trigger.webhook.call(unknown);
		assert.equal(unknown.response.body.success, false);
	});
});

describe('smart lock operations', () => {
	function executeContext(params) {
		const requests = [];
		return {
			requests,
			getInputData: () => [{ json: {} }],
			getNodeParameter: (name, i, fallback) => (name in params ? params[name] : fallback),
			getNode: () => ({ name: 'inwendo ERP', type: 'n8n-nodes-inwendo-erp.inwendoErp', typeVersion: 1, parameters: {} }),
			getCredentials: async () => ({ host: 'https://erp.example.com', apiToken: 'jwt' }),
			continueOnFail: () => false,
			helpers: {
				httpRequestWithAuthentication: async (type, options) => {
					requests.push(options);
					return options.url.endsWith('check_access') ? { granted: true, reason: 'granted' } : { success: true };
				},
			},
		};
	}

	it('checks a credential at /api/n8n/smart_lock/check_access', async () => {
		const ctx = executeContext({ resource: 'smartLock', operation: 'checkAccess', smartLockId: '12', credential: '04A1B2C3\r\n', credentialType: 'card', open: true });
		const [items] = await new InwendoErp().execute.call(ctx);
		assert.equal(ctx.requests[0].url, 'https://erp.example.com/api/n8n/smart_lock/check_access');
		assert.deepEqual(ctx.requests[0].body, { smart_lock_id: 12, credential: '04A1B2C3', credential_type: 'card', open: true });
		assert.deepEqual(items[0].json, { granted: true, reason: 'granted', credential: '04A1B2C3' });
	});

	it('unlocks through the ERP and reads the log of a lock', async () => {
		const ctx = executeContext({ resource: 'smartLock', operation: 'unlock', smartLockId: '7' });
		await new InwendoErp().execute.call(ctx);
		assert.equal(ctx.requests[0].method, 'POST');
		assert.equal(ctx.requests[0].url, 'https://erp.example.com/api/event/smart_lock/7/unlock');

		const log = executeContext({ resource: 'smartLock', operation: 'getLog', logSmartLockId: '7', returnAll: false, limit: 10 });
		await new InwendoErp().execute.call(log);
		assert.equal(log.requests[0].url, 'https://erp.example.com/api/event/smart_lock_log');
		assert.deepEqual(log.requests[0].qs, { smartLock: '7', page: '0', pageSize: '10' });
	});
});
