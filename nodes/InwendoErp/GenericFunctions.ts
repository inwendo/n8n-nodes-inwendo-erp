import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type InwendoErpContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;

/**
 * Headers sent with every request. X-IW-Trigger-Source identifies requests
 * coming from this n8n node so the ERP can suppress webhook dispatches back
 * to n8n (webhooks whose notificationClientId === 'n8n') and avoid an
 * infinite trigger -> workflow -> update -> trigger loop.
 */
const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'X-IW-Trigger-Source': 'n8n',
};

/**
 * Older ERP functions that are switched off by a setting answer with their own error code
 * (or message) instead of the generic "feature disabled" answer. Maps them to the setting.
 */
const LEGACY_FEATURE_ERRORS: Array<{ code?: string; message?: RegExp; setting: string }> = [
	{ code: '1585', setting: 'event_inventory_enabled' },
	{ code: '1640', setting: 'inwendo_crm_general_meeting_enabled' },
	{ code: '6090', setting: 'volunteer_hours_enabled' },
	{ message: /Shift planning is not enabled/i, setting: 'shift_planning_enabled' },
	{ message: /Shift clocking is not enabled/i, setting: 'shift_clocking_enabled' },
];

/**
 * The ERP setting a "feature disabled" answer names, or undefined for any other error.
 * New functions answer HTTP 400 with X-IW-ERROR-CODE 404 and
 * X-IW-ERROR-JSON ["feature disabled: <setting id>"]; only the headers count, not the status.
 */
export function featureDisabledSetting(code: unknown, details: unknown): string | undefined {
	const text = details === undefined || details === null ? '' : String(details);
	const match = /feature disabled:\s*([A-Za-z0-9_.-]+)/i.exec(text);
	if (match) {
		return match[1];
	}
	const codeString = code === undefined || code === null ? '' : String(code);
	for (const known of LEGACY_FEATURE_ERRORS) {
		if (known.code && known.code === codeString) {
			return known.setting;
		}
		if (known.message && codeString && known.message.test(text)) {
			return known.setting;
		}
	}
	return undefined;
}

function errorHeaders(error: unknown): Record<string, unknown> {
	const err = error as any;
	return (
		err?.response?.headers ?? err?.cause?.response?.headers ?? err?.context?.response?.headers ?? err?.headers ?? {}
	);
}

/**
 * The ERP answers errors with a generic body and puts the real reason into the
 * X-IW-ERROR-CODE / X-IW-ERROR-JSON headers; surface them in the n8n error.
 * A function switched off in the ERP gets a message naming the setting to enable.
 */
export function toNodeApiError(node: ReturnType<InwendoErpContext['getNode']>, error: unknown): NodeApiError {
	const headers = errorHeaders(error);
	const code = headers['x-iw-error-code'];
	const details = headers['x-iw-error-json'];
	if (!code && !details) {
		return new NodeApiError(node, error as JsonObject);
	}
	const setting = featureDisabledSetting(code, details);
	if (setting) {
		return new NodeApiError(node, error as JsonObject, {
			message: `inwendo ERP: this function is switched off (ERP setting "${setting}")`,
			description:
				`Enable the setting "${setting}" in the ERP (Settings) to use this operation. ` +
				`ERP answer: ${code ?? ''} ${details ?? ''}`.trim(),
		});
	}
	return new NodeApiError(node, error as JsonObject, {
		message: `inwendo ERP error${code ? ` ${code}` : ''}`,
		description: details ? String(details) : undefined,
	});
}

async function buildOptions(
	this: InwendoErpContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IHttpRequestOptions> {
	const credentials = await this.getCredentials('inwendoErpApi');
	const host = (credentials.host as string).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${host}${endpoint}`,
		headers: { ...DEFAULT_HEADERS },
		qs: qs || {},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}
	return options;
}

/**
 * Make an authenticated request to the inwendo ERP API.
 */
export async function inwendoErpApiRequest(
	this: InwendoErpContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<any> {
	const options = await buildOptions.call(this, method, endpoint, body, qs);

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'inwendoErpApi', options);
	} catch (error) {
		throw toNodeApiError(this.getNode(), error);
	}
}

/**
 * Download a binary file (e.g. an invoice PDF) from the inwendo ERP API.
 */
export async function inwendoErpApiRequestBinary(
	this: IExecuteFunctions,
	endpoint: string,
): Promise<{ data: Buffer; contentType: string | undefined }> {
	const options = await buildOptions.call(this, 'GET', endpoint);
	options.json = false;
	options.encoding = 'arraybuffer';
	options.returnFullResponse = true;

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'inwendoErpApi',
			options,
		);
		return {
			data: Buffer.from(response.body as ArrayBuffer),
			contentType: response.headers?.['content-type'] as string | undefined,
		};
	} catch (error) {
		throw toNodeApiError(this.getNode(), error);
	}
}

function itemsOf(responseBody: any): any[] {
	if (Array.isArray(responseBody)) {
		return responseBody;
	}
	if (responseBody && Array.isArray(responseBody.data)) {
		return responseBody.data;
	}
	return [responseBody];
}

/** Safety net for endpoints that do not report their page count. */
const MAX_PAGES_WITHOUT_COUNT = 1000;

/**
 * Fetch all items across paginated results from the inwendo ERP API.
 * Pages are 0-based. With `withMaxPageNumber` the ERP reports the number of
 * pages in the X-IW-MAX-PAGES header; without a usable count the pages are
 * read until one comes back empty.
 */
export async function inwendoErpApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs?: IDataObject,
): Promise<any[]> {
	const allItems: any[] = [];
	const queryParams: IDataObject = { ...(qs || {}), withMaxPageNumber: 'n8n' };
	const options = await buildOptions.call(this, method, endpoint, undefined, queryParams);
	options.returnFullResponse = true;

	try {
		let maxPages = MAX_PAGES_WITHOUT_COUNT;
		for (let page = 0; page < maxPages; page++) {
			options.qs = { ...queryParams, page: String(page) };
			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'inwendoErpApi',
				options,
			);
			const items = itemsOf(response.body);
			allItems.push(...items);
			if (page === 0) {
				const reported = parseInt(response.headers?.['x-iw-max-pages'] ?? '', 10);
				if (reported >= 1) {
					maxPages = reported;
				}
			}
			if (!Array.isArray(response.body) && !Array.isArray(response.body?.data)) {
				break; // not a list endpoint
			}
			if (items.length === 0) {
				break;
			}
		}
	} catch (error) {
		throw toNodeApiError(this.getNode(), error);
	}

	return allItems;
}

/**
 * A list request with the usual "Return All" / "Limit" options: all pages, or the first
 * page with `limit` items (the ERP only honours pageSize together with a 0-based page).
 */
export async function inwendoErpApiRequestList(
	this: IExecuteFunctions,
	endpoint: string,
	qs: IDataObject,
	returnAll: boolean,
	limit: number,
): Promise<any[]> {
	if (returnAll) {
		return await inwendoErpApiRequestAllItems.call(this, 'GET', endpoint, qs);
	}
	const items = await inwendoErpApiRequest.call(this, 'GET', endpoint, undefined, {
		...qs,
		page: '0',
		pageSize: String(limit),
	});
	return Array.isArray(items) ? items.slice(0, limit) : itemsOf(items);
}
