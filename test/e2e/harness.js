'use strict';
/**
 * Minimal stand-in for the n8n runtime: runs the compiled nodes (dist/) with
 * real HTTP requests against an inwendo ERP instance. It mirrors what n8n's
 * `httpRequestWithAuthentication` does for this package: credential headers
 * from InwendoErpApi.authenticate, `qs`, JSON bodies, `returnFullResponse`,
 * `encoding: 'arraybuffer'`, and an error for every non-2xx answer.
 *
 * Environment:
 *   IW_E2E_ERP_HOST   ERP base URL, e.g. http://127.0.0.1:8000
 *   IW_E2E_ERP_TOKEN  JWT API token (x-iw-jwt-token)
 */
const path = require('node:path');

const dist = path.resolve(__dirname, '..', '..', 'dist');
const { InwendoErp } = require(path.join(dist, 'nodes/InwendoErp/InwendoErp.node.js'));
const { InwendoErpTrigger } = require(path.join(dist, 'nodes/InwendoErp/InwendoErpTrigger.node.js'));
const { InwendoErpApi } = require(path.join(dist, 'credentials/InwendoErpApi.credentials.js'));

const HOST = process.env.IW_E2E_ERP_HOST;
const TOKEN = process.env.IW_E2E_ERP_TOKEN;
const enabled = Boolean(HOST && TOKEN);

const credentials = () => ({ host: HOST, apiToken: TOKEN });

/** Resolve `={{$credentials.x}}` expressions of the credential's authenticate block. */
function authHeaders() {
	const creds = credentials();
	const headers = {};
	const auth = new InwendoErpApi().authenticate;
	for (const [name, value] of Object.entries(auth.properties.headers || {})) {
		headers[name] = String(value).replace(/^=\{\{\$credentials\.(\w+)\}\}$/, (_, key) => creds[key]);
	}
	return headers;
}

class HttpError extends Error {
	constructor(status, headers, body, url) {
		super(`Request failed with status code ${status}: ${url} ${headers['x-iw-error-code'] || ''} ${headers['x-iw-error-json'] || ''} ${String(body).slice(0, 300)}`);
		this.httpCode = String(status);
		this.statusCode = status;
		// same shape as the axios error n8n's httpRequest throws
		this.response = { status, headers, data: body };
	}
}

/** The subset of n8n's IHttpRequestOptions this package uses. */
async function httpRequest(options) {
	const url = new URL(options.url);
	for (const [key, value] of Object.entries(options.qs || {})) {
		if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
	}
	const headers = { ...(options.headers || {}), ...authHeaders() };
	const init = { method: options.method || 'GET', headers };
	if (options.body !== undefined) {
		init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
		headers['Content-Type'] = headers['Content-Type'] || 'application/json';
	}
	const res = await fetch(url, init);
	const resHeaders = Object.fromEntries([...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]));
	let body;
	if (options.encoding === 'arraybuffer') {
		body = await res.arrayBuffer();
	} else {
		const text = await res.text();
		body = text;
		if (options.json !== false && text) {
			try {
				body = JSON.parse(text);
			} catch {
				body = text;
			}
		}
	}
	if (res.status >= 400) {
		throw new HttpError(res.status, resHeaders, typeof body === 'string' ? body : JSON.stringify(body), url.toString());
	}
	return options.returnFullResponse ? { body, headers: resHeaders, statusCode: res.status } : body;
}

function getPath(obj, dotted) {
	return dotted.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function baseContext(parameters, staticData = {}) {
	const node = { name: 'inwendo ERP', type: 'n8n-nodes-inwendo-erp.inwendoErp', typeVersion: 1, parameters };
	return {
		getNode: () => node,
		getCredentials: async (type) => {
			if (type !== 'inwendoErpApi') throw new Error(`unexpected credential ${type}`);
			return credentials();
		},
		getNodeParameter(name, _itemIndex, fallback) {
			// Hook functions call getNodeParameter(name, fallback)
			if (typeof _itemIndex !== 'number' && fallback === undefined) fallback = _itemIndex;
			const value = getPath(parameters, name);
			if (value === undefined) {
				if (fallback !== undefined) return fallback;
				throw new Error(`Could not get parameter "${name}"`);
			}
			return value;
		},
		getWorkflowStaticData: () => staticData,
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (type, options) => {
				if (type !== 'inwendoErpApi') throw new Error(`unexpected credential ${type}`);
				return httpRequest(options);
			},
			prepareBinaryData: async (buffer, fileName, mimeType) => ({
				data: Buffer.from(buffer).toString('base64'),
				fileName,
				mimeType,
				fileSize: String(buffer.length),
			}),
			returnJsonArray: (data) => (Array.isArray(data) ? data : [data]).map((json) => ({ json })),
		},
	};
}

/** Run the action node once and return the output items (json + binary). */
async function runNode(parameters, items = [{ json: {} }]) {
	const node = new InwendoErp();
	const ctx = { ...baseContext(parameters), getInputData: () => items };
	const [output] = await node.execute.call(ctx);
	return output;
}

/** Call the trigger's webhook lifecycle methods (create / delete) like n8n on (de)activation. */
function triggerHooks(parameters, webhookUrl, staticData = {}) {
	const trigger = new InwendoErpTrigger();
	const ctx = { ...baseContext(parameters, staticData), getNodeWebhookUrl: () => webhookUrl };
	const methods = trigger.webhookMethods.default;
	return {
		staticData,
		checkExists: () => methods.checkExists.call(ctx),
		create: () => methods.create.call(ctx),
		delete: () => methods.delete.call(ctx),
		/** Deliver an ERP webhook request to the trigger. */
		receive: (body, headers = {}) =>
			trigger.webhook.call({ ...ctx, getBodyData: () => body, getHeaderData: () => headers }),
	};
}

/** Direct request with the credential, for assertions outside the node. */
function erp(method, endpoint, body, qs) {
	return httpRequest({ method, url: `${HOST.replace(/\/+$/, '')}${endpoint}`, body, qs, json: true, headers: { 'Content-Type': 'application/json' } });
}

/** The credential test request n8n sends when the credential is saved. */
async function testCredential() {
	const { request } = new InwendoErpApi().test;
	return httpRequest({ method: 'GET', url: `${HOST.replace(/\/+$/, '')}${request.url}`, qs: request.qs, json: true });
}

module.exports = { enabled, runNode, triggerHooks, erp, testCredential };
