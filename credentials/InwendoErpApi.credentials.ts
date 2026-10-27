import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class InwendoErpApi implements ICredentialType {
	name = 'inwendoErpApi';
	displayName = 'Vynst (Inwendo ERP) API';
	icon: Icon = { light: 'file:../icons/vynst.svg', dark: 'file:../icons/vynst.dark.svg' };
	documentationUrl = 'https://developer.vynst.de/en/integrations/n8n/';
	properties: INodeProperties[] = [
		{
			displayName:
				'For webhook auto-registration (vynst Trigger) this token needs ' +
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
			description: 'The base URL of your vynst installation (without trailing slash)',
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
