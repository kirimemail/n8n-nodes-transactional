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

interface LogEntry {
	id: string;
	message_id: string;
	from: string;
	to: string;
	subject: string;
	status: string;
	created_at: string;
	sent_at?: string;
	opened_at?: string;
	clicked_at?: string;
	bounced_at?: string;
	[key: string]: string | number | boolean | null | undefined;
}

interface LogsResponse {
	success: boolean;
	data: LogEntry[];
	meta?: {
		current_page: number;
		last_page: number;
		per_page: number;
		total: number;
	};
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

export class KirimEmailDomainLog implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail Domain Log',
		name: 'kirimEmailDomainLog',
		icon: {
			light: 'file:assets/logo-bg-white.svg',
			dark: 'file:assets/logo-bg-black.svg',
		},
		group: ['output'],
		version: 1,
		description: 'Get email logs for authenticated domain via Kirim.Email API',
		defaults: {
			name: 'KirimEmail Domain Log',
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
				options: [{ name: 'Log', value: 'log' }],
				default: 'log',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['log'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get logs for authenticated domain',
						action: 'Get many logs',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['log'],
						operation: ['getAll'],
					},
				},
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					min: 1,
					max: 500,
				},
				displayOptions: {
					show: {
						resource: ['log'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				description: 'Max number of results to return',
			},
			{
				displayName: 'Simplify Output',
				name: 'simplifyOutput',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['log'],
						operation: ['getAll'],
					},
				},
				description: 'Whether to return simplified output with essential fields only',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			if (resource === 'log' && operation === 'getAll') {
				const credentials = (await this.getCredentials('kirimEmailSmtpDomainApi')) as {
					apiKey: string;
					apiSecret: string;
					domain: string;
					baseUrl: string;
				};

				const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
				const limit = this.getNodeParameter('limit', itemIndex) as number;
				const simplifyOutput = this.getNodeParameter('simplifyOutput', itemIndex) as boolean;

				let url = `${credentials.baseUrl}/api/v4/transactional/log`;

				if (!returnAll) {
					url += `?per_page=${limit}`;
				}

				let response: LogsResponse;

				try {
					response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'kirimEmailSmtpDomainApi',
						{
							method: 'GET',
							url,
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

				if (response.data && Array.isArray(response.data)) {
					if (simplifyOutput) {
						const simplifiedData = response.data.map((log) => ({
							id: log.id,
							messageId: log.message_id,
							from: log.from,
							to: log.to,
							subject: log.subject,
							status: log.status,
							createdAt: log.created_at,
							sentAt: log.sent_at || null,
							openedAt: log.opened_at || null,
							clickedAt: log.clicked_at || null,
							bouncedAt: log.bounced_at || null,
						}));
						returnData.push(...simplifiedData.map((data) => ({ json: data })));
					} else {
						returnData.push(...response.data.map((data) => ({ json: data })));
					}
				} else if (response.data) {
					returnData.push({ json: response.data });
				}
			}
		}

		return [returnData];
	}
}
