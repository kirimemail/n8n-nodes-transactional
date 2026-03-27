import type {
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';
import { createHmac } from 'crypto';

export class KirimEmailTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KirimEmail SMTP Webhook Trigger',
		name: 'kirimEmailSMTPWebhookTrigger',
		icon: { light: 'file:assets/logo-bg-white.svg', dark: 'file:assets/logo-bg-black.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Handle Kirim.Email webhook events',
		defaults: {
			name: 'KirimEmail Trigger',
		},
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				path: 'kirim-email',
				responseMode: 'onReceived',
			},
		],
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'kirimEmailApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Simplify Output',
				name: 'simplifyOutput',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified output with essential fields only',
			},
		],
		usableAsTool: true,
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const credentials = await this.getCredentials('kirimEmailApi');
		const body = this.getBodyData();
		const simplifyOutput = this.getNodeParameter('simplifyOutput') as boolean;

		const signature = body.signature as string | undefined;
		const messageGuid = body.message_guid as string | undefined;

		if (!messageGuid || !signature) {
			throw new NodeApiError(this.getNode(), {
				message: 'Missing signature or message_guid in webhook payload',
			});
		}

		const apiSecret = credentials.apiSecret as string;
		const expectedSignature = createHmac('sha256', apiSecret + messageGuid).digest('hex');

		if (signature !== expectedSignature) {
			throw new NodeApiError(this.getNode(), { message: 'Invalid webhook signature' });
		}

		let outputData: INodeExecutionData[];

		if (simplifyOutput) {
			const simplifiedData = {
				message_guid: body.message_guid,
				type: body.type,
				sender: body.sender,
				sender_domain: body.sender_domain,
				sender_ip: body.sender_ip,
				recipient: body.recipient,
				recipient_domain: body.recipient_domain,
				recipient_ip: body.recipient_ip,
				event_type: body.event_type,
				event: body.event,
				subject: body.subject,
				status: body.status,
				tags: body.tags,
				event_detail: body.event_detail,
			};
			outputData = [{ json: simplifiedData }];
		} else {
			outputData = [{ json: body }];
		}

		return {
			workflowData: [outputData],
			webhookResponse: { success: true },
		};
	}
}
