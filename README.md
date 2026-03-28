# @kirimemail/n8n-nodes-transactional

Kirim.Email transactional email nodes for n8n - send transactional emails and receive webhook events.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Nodes

### KirimEmail Transactional

Send transactional emails via Kirim.Email API.

**Operations:**

- Send email

**Features:**

- Support for single and bulk email sending (up to 1000 recipients)
- Custom email headers
- HTML and plain text body support
- Reply-to address customization
- Comprehensive error handling with detailed error messages

**Fields:**

- From - Sender email address
- From Name - Optional sender display name
- To - Recipient email address(es)
- Subject - Email subject
- Text Body - Plain text content
- HTML Body - Optional HTML content
- Reply To - Optional reply-to address
- Headers - Custom headers as JSON

### KirimEmail Trigger

Receive webhook events from Kirim.Email.

**Events:**

- Email queued, sent, delivered, bounced, etc.
- Automatic signature verification

### KirimEmail Domain Log

Get email logs for authenticated domain via Kirim.Email API.

**Operations:**

- Get Many - Retrieve email logs with pagination support

**Features:**

- Return all or limited results
- Simplified output option for essential fields only

## Credentials

You'll need a Kirim.Email API key and secret. Get them from your Kirim.Email dashboard under Domain Settings > API Keys.

**Required fields:**

- API Key - Your API key (username for Basic Auth)
- API Secret - Your API secret (password for Basic Auth)
- Domain - Your verified domain name

## Compatibility

- Tested with n8n v1.x and v2.x
- Requires Kirim.Email account with domain verification

## Usage

### Sending an Email

1. Add the **KirimEmail Transactional** node to your workflow
2. Create/select Kirim.Email API credentials
3. Configure the email fields (from, to, subject, text)
4. Execute the node

### Receiving Webhooks

1. Add the **KirimEmail Trigger** node to your workflow
2. Create/select Kirim.Email API credentials
3. Activate the workflow
4. Configure Kirim.Email to send webhooks to your workflow URL

The webhook URL format: `https://your-n8n-instance/webhook/kirim-email`

## Resources

- [Kirim.Email Documentation](https://smtp-app.kirim.email/docs)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Building n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/build/)

## License

MIT
