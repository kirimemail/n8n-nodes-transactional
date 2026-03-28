import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';

interface ApiErrorResponse {
	success?: boolean;
	message?: string;
	error?: string;
	errors?: Record<string, string[]>;
}

const ERROR_MESSAGES: Record<number, { code: string; description: string }> = {
	400: { code: 'BAD_REQUEST', description: 'Bad Request' },
	401: {
		code: 'UNAUTHORIZED',
		description: 'Unauthorized - Invalid or missing authentication credentials',
	},
	403: {
		code: 'FORBIDDEN',
		description: 'Forbidden - You do not have permission to access this resource',
	},
	404: { code: 'NOT_FOUND', description: 'Not Found - The requested resource was not found' },
	422: { code: 'VALIDATION_ERROR', description: 'Validation Error - Invalid input data' },
	429: {
		code: 'RATE_LIMIT_EXCEEDED',
		description: 'Too Many Requests - Rate limit exceeded. Please try again later.',
	},
	500: {
		code: 'SERVER_ERROR',
		description: 'Internal Server Error - An unexpected error occurred',
	},
};

function parseApiError(errorResponse: ApiErrorResponse): string {
	if (errorResponse.message) {
		return errorResponse.message;
	}
	if (errorResponse.error) {
		return errorResponse.error;
	}
	return 'An unknown error occurred';
}

function getErrorDetails(statusCode: number): { code: string; description: string } {
	return (
		ERROR_MESSAGES[statusCode] || {
			code: 'UNKNOWN_ERROR',
			description: 'An unknown error occurred',
		}
	);
}

export class KirimEmailSendTransactionalEmail implements INodeType {
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
				name: 'kirimEmailSmtpDomainApi',
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
				const credentials = (await this.getCredentials('kirimEmailSmtpDomainApi')) as {
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
						throw new NodeApiError(this.getNode(), {
							message: 'Invalid JSON array format for To field',
							code: 'BAD_REQUEST',
							httpCode: '400',
							description: 'To field must be a valid JSON array string',
						});
					}
				} else if (toInput.includes(',')) {
					to = toInput.split(',').map((email) => email.trim());
				} else {
					to = toInput;
				}

				if (Array.isArray(to) && to.length > 1000) {
					throw new NodeApiError(this.getNode(), {
						message: 'Maximum 1000 recipients per request',
						code: 'BAD_REQUEST',
						httpCode: '400',
						description: 'Too many recipients specified',
					});
				}

				const formData: Record<string, string | string[]> = {
					from,
					subject,
					text,
				};

				if (Array.isArray(to)) {
					formData.to = to;
				} else {
					formData.to = to;
				}

				if (fromName) {
					formData.from_name = fromName;
				}

				if (html) {
					formData.html = html;
				}

				if (replyTo) {
					formData.reply_to = replyTo;
				}

				if (headers && headers !== '{}') {
					try {
						const parsedHeaders = JSON.parse(headers);
						for (const [key, value] of Object.entries(parsedHeaders)) {
							formData[`headers[${key}]`] = String(value);
						}
					} catch {
						throw new NodeApiError(this.getNode(), {
							message: 'Headers must be a valid JSON object',
							code: 'BAD_REQUEST',
							httpCode: '400',
							description: 'Invalid JSON format for headers',
						});
					}
				}

				let response: { success?: boolean; message?: string; error?: string };

				try {
					response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'kirimEmailSmtpDomainApi',
						{
							method: 'POST',
							url: `${credentials.baseUrl}/api/v4/transactional/message`,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
						} as any,
					);
				} catch (error) {
					const httpError = error as {
						statusCode?: number;
						response?: { body?: ApiErrorResponse };
					};
					const statusCode = httpError.statusCode || 500;
					const errorResponse = httpError.response?.body as ApiErrorResponse | undefined;

					let errorMessage = (error as Error).message;
					const errorDetails = getErrorDetails(statusCode);

					if (errorResponse) {
						errorMessage = parseApiError(errorResponse);
					}

					throw new NodeApiError(
						this.getNode(),
						{
							message: errorMessage,
							code: errorDetails.code,
							httpCode: statusCode.toString(),
							description: errorDetails.description,
							retry: statusCode === 429,
						},
						{ itemIndex: itemIndex },
					);
				}

				returnData.push({ json: response });
			}
		}

		return [returnData];
	}
}
