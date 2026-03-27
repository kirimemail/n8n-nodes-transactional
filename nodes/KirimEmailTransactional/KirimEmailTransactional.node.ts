import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, ApplicationError } from 'n8n-workflow';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import FormData = require('form-data');

export class KirimEmailTransactional implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail Send Transactional Email',
		name: 'kirimEmailSendTransactionalEmail',
		icon: {
			light: 'file:assets/logo-bg-white.svg',
			dark: 'file:assets/logo-bg-black.svg',
		},
		group: ['output'],
		version: 1,
		description: 'Send transactional emails via Kirim.Email API',
		defaults: {
			name: 'KirimEmail Transactional',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'kirimEmailApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Message', value: 'message' }],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a transactional email',
						action: 'Send email',
					},
				],
				default: 'send',
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'sender@example.com',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description: 'Sender email address. Must belong to the authenticated domain.',
			},
			{
				displayName: 'From Name',
				name: 'fromName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description: 'Optional sender display name',
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'recipient@example.com or ["recipient1@example.com","recipient2@example.com"]',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description:
					'Recipient email address(es). Single email, comma-separated emails, or JSON array string. Maximum 1000 recipients per request.',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description: 'Email subject line',
			},
			{
				displayName: 'Text Body',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description: 'Plain text content for the email body',
			},
			{
				displayName: 'HTML Body',
				name: 'html',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description: 'Optional HTML content for the email body',
			},
			{
				displayName: 'Reply To',
				name: 'replyTo',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description: 'Reply-to email address',
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'string',
				default: '{}',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				description:
					'Custom email headers as JSON object. Example: {"X-Campaign-ID": "welcome-series"}.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			if (resource === 'message' && operation === 'send') {
				const credentials = (await this.getCredentials('kirimEmailApi')) as {
					apiKey: string;
					apiSecret: string;
					domain: string;
					baseUrl: string;
				};

				const from = this.getNodeParameter('from', itemIndex) as string;
				const fromName = this.getNodeParameter('fromName', itemIndex) as string;
				const toInput = this.getNodeParameter('to', itemIndex) as string;
				const subject = this.getNodeParameter('subject', itemIndex) as string;
				const text = this.getNodeParameter('text', itemIndex) as string;
				const html = this.getNodeParameter('html', itemIndex) as string;
				const replyTo = this.getNodeParameter('replyTo', itemIndex) as string;
				const headers = this.getNodeParameter('headers', itemIndex) as string;

				let to: string | string[];
				if (toInput.trim().startsWith('[')) {
					try {
						to = JSON.parse(toInput) as string[];
					} catch {
						throw new ApplicationError('Invalid JSON array format for To field');
					}
				} else if (toInput.includes(',')) {
					to = toInput.split(',').map((email) => email.trim());
				} else {
					to = toInput;
				}

				if (Array.isArray(to) && to.length > 1000) {
					throw new ApplicationError('Maximum 1000 recipients per request');
				}

				const formData = new FormData();
				formData.append('from', from);
				if (Array.isArray(to)) {
					to.forEach((email) => formData.append('to', email));
				} else {
					formData.append('to', to);
				}
				formData.append('subject', subject);
				formData.append('text', text);

				if (fromName) {
					formData.append('from_name', fromName);
				}

				if (html) {
					formData.append('html', html);
				}

				if (replyTo) {
					formData.append('reply_to', replyTo);
				}

				if (headers && headers !== '{}') {
					try {
						const parsedHeaders = JSON.parse(headers);
						for (const [key, value] of Object.entries(parsedHeaders)) {
							formData.append(`headers[${key}]`, String(value));
						}
					} catch {
						throw new ApplicationError('Headers must be a valid JSON object');
					}
				}

				// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${credentials.baseUrl}/api/v4/transactional/message`,
					headers: {
						...formData.getHeaders(),
						Accept: 'application/json',
						domain: credentials.domain,
					},
					auth: {
						username: credentials.apiKey,
						password: credentials.apiSecret,
					},
					body: formData,
				});

				returnData.push({ json: response });
			}
		}

		return [returnData];
	}
}
