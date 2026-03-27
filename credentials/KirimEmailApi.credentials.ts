import type {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class KirimEmailApi implements ICredentialType {
	name = 'kirimEmailSmtpDomainApi';
	displayName = 'KirimEmail SMTP Domain API';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon = 'file:assets/logo-bg-black.svg' as any;
	documentationUrl = 'https://smtp-app.kirim.email/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			placeholder: 'key_4909************************e8d6',
			description: 'API key for authentication (username in Basic Auth)',
			typeOptions: { password: true },
		},
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: '8ad78587************************66db',
			description: 'API secret for authentication (password in Basic Auth)',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'example.id',
			description:
				'Domain name for header authentication. Must match the domain associated with the API key.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://smtp-app.kirim.email',
			placeholder: 'https://smtp-app.kirim.email',
			description:
				'API base URL. Defaults to KirimEmail SMTP API. Do not change unless you know what you are doing.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.apiKey}}',
				password: '={{$credentials.apiSecret}}',
			},
			headers: {
				domain: '={{$credentials.domain}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://smtp-app.kirim.email',
			url: '/api/v4/transactional/log',
			method: 'GET',
		},
	};
}
