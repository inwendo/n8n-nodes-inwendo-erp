'use strict';
/**
 * Offline tests of what n8n checks for verified community nodes: item linking (pairedItem),
 * n8n error classes, logged cleanup failures, node names, themed SVG icons and codex categories.
 * Run with `npm test`.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { NodeApiError, NodeOperationError } = require('n8n-workflow');

const root = path.resolve(__dirname, '../..');
const dist = path.join(root, 'dist/nodes/InwendoErp');
const { InwendoErp } = require(path.join(dist, 'InwendoErp.node.js'));
const { InwendoErpTrigger } = require(path.join(dist, 'InwendoErpTrigger.node.js'));
const { InwendoErpLockTrigger } = require(path.join(dist, 'InwendoErpLockTrigger.node.js'));
const { InwendoErpApi } = require(path.join(root, 'dist/credentials/InwendoErpApi.credentials.js'));
const { asNodeError } = require(path.join(dist, 'GenericFunctions.js'));

const NODE = { name: 'vynst (inwendo ERP)', type: 'n8n-nodes-inwendo-erp.inwendoErp', typeVersion: 1, parameters: {} };

/** Runs the action node over `inputs` items; `answer(options, call)` gives the ERP answer. */
async function run(params, answer, { inputs = 1, continueOnFail = false } = {}) {
	let call = 0;
	const ctx = {
		getInputData: () => Array.from({ length: inputs }, () => ({ json: {} })),
		getNodeParameter: (name, i, fallback) => (name in params ? params[name] : fallback),
		getNode: () => NODE,
		getCredentials: async () => ({ host: 'https://erp.example.com', apiToken: 'jwt' }),
		continueOnFail: () => continueOnFail,
		helpers: {
			httpRequestWithAuthentication: async (type, options) => {
				const body = answer(options, call++);
				return options.returnFullResponse ? { body, headers: { 'x-iw-max-pages': '1' } } : body;
			},
		},
	};
	const [items] = await new InwendoErp().execute.call(ctx);
	return items;
}

const generic = (method = 'GET') => ({ resource: 'genericRequest', httpMethod: method, endpoint: '/api/x', queryParameters: {} });

describe('item linking', () => {
	it('splits a list answer of a generic request into items linked to their input', async () => {
		const items = await run(generic(), () => [{ id: 1 }, { id: 2 }], { inputs: 2 });
		assert.deepEqual(
			items.map((item) => [item.json.id, item.pairedItem.item]),
			[[1, 0], [2, 0], [1, 1], [2, 1]],
		);
	});

	it('wraps a plain answer as { data }', async () => {
		const items = await run(generic(), () => 42);
		assert.deepEqual(items, [{ json: { data: 42 }, pairedItem: { item: 0 } }]);
	});

	it('links the items of a standard list operation', async () => {
		const items = await run(
			{ resource: 'company', operation: 'getAll', returnAll: false, limit: 5 },
			() => [{ id: 1 }, { id: 2 }],
		);
		assert.deepEqual(items.map((item) => item.pairedItem), [{ item: 0 }, { item: 0 }]);
	});

	it('links the error item with "continue on fail"', async () => {
		const items = await run(generic(), () => {
			throw new Error('boom');
		}, { continueOnFail: true });
		assert.deepEqual(items[0].pairedItem, { item: 0 });
		assert.ok(items[0].json.error);
	});
});

describe('errors', () => {
	it('keeps n8n errors and wraps other errors in a NodeOperationError', () => {
		const apiError = new NodeApiError(NODE, { message: 'bad' });
		assert.equal(asNodeError(NODE, apiError), apiError);
		const wrapped = asNodeError(NODE, new Error('broken JSON'), 3);
		assert.ok(wrapped instanceof NodeOperationError);
		assert.match(wrapped.message, /broken JSON/);
	});

	it('throws a node error for an invalid JSON body', async () => {
		await assert.rejects(
			run({ ...generic('POST'), body: '{nope' }, () => ({})),
			(error) => error instanceof NodeOperationError,
		);
	});

	it('logs a failed webhook removal and still deactivates', async () => {
		const warnings = [];
		const staticData = { webhookId: 5, webhookUrl: 'https://n8n.example.com/webhook/abc' };
		const done = await new InwendoErpTrigger().webhookMethods.default.delete.call({
			getNodeParameter: (name, fallback) => (name === 'autoRegister' ? true : fallback),
			getWorkflowStaticData: () => staticData,
			getNodeWebhookUrl: () => staticData.webhookUrl,
			getNode: () => NODE,
			getCredentials: async () => ({ host: 'https://erp.example.com', apiToken: 'jwt' }),
			logger: { warn: (message) => warnings.push(message) },
			helpers: {
				httpRequestWithAuthentication: async () => {
					throw new Error('ERP down');
				},
			},
		});
		assert.equal(done, true);
		assert.equal(staticData.webhookId, 5, 'static data kept for the next attempt');
		assert.match(warnings[0], /ERP down/);
	});
});

describe('listing metadata', () => {
	const CATEGORIES = [
		'Data & Storage', 'Finance & Accounting', 'Marketing & Content', 'Productivity', 'Miscellaneous',
		'Sales', 'Development', 'Analytics', 'Communication', 'Utility',
	];
	const nodes = [
		['InwendoErp', new InwendoErp()],
		['InwendoErpTrigger', new InwendoErpTrigger()],
		['InwendoErpLockTrigger', new InwendoErpLockTrigger()],
	];

	for (const [file, node] of nodes) {
		it(`${file}: product name, themed SVG icons and a codex file`, () => {
			const { displayName, defaults, icon } = node.description;
			assert.match(displayName, /^vynst \(inwendo ERP\)/);
			assert.equal(defaults.name, displayName);
			for (const variant of ['light', 'dark']) {
				assert.match(icon[variant], /^file:.*\.svg$/);
				assert.ok(fs.existsSync(path.resolve(dist, icon[variant].slice('file:'.length))), `${variant} icon missing`);
			}
			const codex = JSON.parse(fs.readFileSync(path.join(dist, `${file}.node.json`), 'utf8'));
			assert.equal(codex.node, `n8n-nodes-inwendo-erp.${node.description.name}`);
			assert.ok(codex.categories.length > 0);
			for (const category of codex.categories) {
				assert.ok(CATEGORIES.includes(category), `${category} is no community node category`);
			}
		});
	}

	it('the credential has themed icons and points to the vynst documentation', () => {
		const credential = new InwendoErpApi();
		assert.ok(credential.icon.light.endsWith('.svg') && credential.icon.dark.endsWith('.svg'));
		assert.match(credential.documentationUrl, /^https:\/\/developer\.vynst\.de\//);
	});
});
