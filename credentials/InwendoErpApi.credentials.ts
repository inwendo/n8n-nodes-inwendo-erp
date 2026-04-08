import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InwendoErpApi implements ICredentialType {
	name = 'inwendoErpApi';
	displayName = 'inwendo ERP API';
	documentationUrl = 'https://github.com/inwendo/n8n-nodes-inwendo-erp';
	properties: INodeProperties[] = [
		{
			displayName:
				'For webhook auto-registration (inwendo ERP Trigger) this token needs ' +
				'Scope <b>Webhook</b> with <b>Write</b> access, and the ERP instance ' +
				'must provide the <b>/api/n8n/webhook</b> endpoint (shipped with the ' +
				'dedicated N8nWebhookController). ' +
				'For action-node use, also grant the scopes of the resources you plan to read or write.',
			name: 'jwtNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'ERP Host URL',
			name: 'host',
			type: 'string',
			default: '',
			placeholder: 'https://demo.iw-erp.de',
			required: true,
			description: 'The base URL of your inwendo ERP instance (without trailing slash)',
		},
		{
			displayName: 'API Token (JWT)',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'JWT API access token for authentication',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-iw-jwt-token': '={{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.host}}',
			url: '/api/base/api_access_token_test',
			qs: { mode: 'info' },
		},
	};
}
