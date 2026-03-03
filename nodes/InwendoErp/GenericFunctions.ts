import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make an authenticated request to the inwendo ERP API.
 */
export async function inwendoErpApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('inwendoErpApi');
	const host = (credentials.host as string).replace(/\/$/, '');

	const options: IRequestOptions = {
		method,
		uri: `${host}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		qs: qs || {},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		return await this.helpers.requestWithAuthentication.call(this, 'inwendoErpApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Fetch all items across paginated results from the inwendo ERP API.
 * Uses X-IW-MAX-PAGES header to determine total pages.
 */
export async function inwendoErpApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs?: IDataObject,
): Promise<any[]> {
	const credentials = await this.getCredentials('inwendoErpApi');
	const host = (credentials.host as string).replace(/\/$/, '');
	const allItems: any[] = [];
	let page = 1;

	const queryParams = { ...(qs || {}), page: String(page) };

	// First request to get data and total pages
	const options: IRequestOptions = {
		method,
		uri: `${host}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		qs: queryParams,
		json: true,
		resolveWithFullResponse: true,
	};

	try {
		const response = await this.helpers.requestWithAuthentication.call(this, 'inwendoErpApi', options);
		const responseBody = response.body || response;
		const maxPages = parseInt(response.headers?.['x-iw-max-pages'] || '1', 10);

		if (Array.isArray(responseBody)) {
			allItems.push(...responseBody);
		} else if (responseBody.data && Array.isArray(responseBody.data)) {
			allItems.push(...responseBody.data);
		} else {
			allItems.push(responseBody);
		}

		// Fetch remaining pages
		for (page = 2; page <= maxPages; page++) {
			queryParams.page = String(page);
			options.qs = queryParams;
			const pageResponse = await this.helpers.requestWithAuthentication.call(this, 'inwendoErpApi', options);
			const pageBody = pageResponse.body || pageResponse;

			if (Array.isArray(pageBody)) {
				allItems.push(...pageBody);
			} else if (pageBody.data && Array.isArray(pageBody.data)) {
				allItems.push(...pageBody.data);
			} else {
				allItems.push(pageBody);
			}
		}
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}

	return allItems;
}
