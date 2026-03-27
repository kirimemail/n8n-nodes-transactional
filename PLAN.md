# KirimEmail Transactional Node Plan

## Overview

Create n8n community nodes for Kirim.Email transactional email service with:

1. **Send Node** - Send transactional emails via API
2. **Trigger Node** - Receive webhook events with signature verification

## Authentication

- **Method**: HTTP Basic Auth with custom header
- **Credentials** (`KirimEmailApi`):
  | Field | Type | Description |
  |-------|------|-------------|
  | `apiKey` | string | API key (username for Basic Auth) |
  | `apiSecret` | string | API secret (password for Basic Auth) - password type |
  | `domain` | string | Domain header value |

- **Auth Headers**:
  - Authorization: `Basic base64(apiKey:apiSecret)`
  - Domain: `<domain>`

## Node 1: KirimEmailTransactional (Send)

### Details

- **Name**: `kirimEmailTransactional`
- **Display Name**: `KirimEmail Transactional`
- **Group**: `output`
- **Icon**: `file:KirimEmailTransactional.svg`
- **Version**: 1

### Resource: Message

### Operations: Send

**Fields:**

| Field         | Type         | Required | Default | Description                                |
| ------------- | ------------ | -------- | ------- | ------------------------------------------ |
| `from`        | string       | yes      |         | Sender email (must belong to domain)       |
| `fromName`    | string       | no       |         | Sender display name                        |
| `to`          | string/array | yes      |         | Recipient(s), max 1000                     |
| `subject`     | string       | yes      |         | Email subject                              |
| `text`        | string       | yes      |         | Plain text body                            |
| `html`        | string       | no       |         | HTML body                                  |
| `replyTo`     | string       | no       |         | Reply-to address                           |
| `headers`     | object       | no       |         | Custom headers                             |
| `attachments` | binary       | no       |         | File attachments (max 10 files, 20MB each) |

**API Endpoint**: `POST https://smtp-app.kirim.email/api/v4/transactional/message`

**Request Format**: `multipart/form-data`

## Node 2: KirimEmailTrigger (Webhook)

### Details

- **Name**: `kirimEmailTrigger`
- **Display Name**: `KirimEmail Trigger`
- **Group**: `trigger`
- **Icon**: `file:KirimEmailTrigger.svg`
- **Version**: 1

### Webhook Path

- `POST /webhook/kirim-email`

### Signature Verification

- **Method**: Verify `sha256(apiSecret + messageGuid)` equals provided `signature`
- **Fail**: Return 401 if signature mismatch

### Output Fields (from webhook payload)

| Field              | Description                                   |
| ------------------ | --------------------------------------------- |
| `message_guid`     | Unique message identifier                     |
| `type`             | Event type (e.g., "email")                    |
| `sender`           | Sender email address                          |
| `sender_domain`    | Sender domain                                 |
| `sender_ip`        | Sender IP address                             |
| `recipient`        | Recipient email address                       |
| `recipient_domain` | Recipient domain                              |
| `recipient_ip`     | Recipient IP address                          |
| `event_type`       | Event type (queued, delivered, bounced, etc.) |
| `event`            | Event name                                    |
| `subject`          | Email subject                                 |
| `status`           | Message status                                |
| `tags`             | Comma-separated tags                          |
| `signature`        | HMAC signature for verification               |
| `event_detail`     | JSON string with event details                |

## File Structure

```
credentials/
  KirimEmailApi.credentials.ts

nodes/
  KirimEmailTransactional/
    KirimEmailTransactional.node.ts    # Send node
    KirimEmailTrigger.node.ts          # Trigger node
    KirimEmailTransactional.svg        # Icon
    KirimEmailTrigger.svg              # Icon
```

## Implementation Notes

1. **Send Node**: Use declarative-style with `routing` for HTTP request
2. **Trigger Node**: Use programmatic-style for signature verification logic
3. Mark `apiSecret` in credentials as `typeOptions.password = true`
4. Support n8n expressions in all user input fields
5. Handle binary attachments properly with `displayName` focusing on file upload UX
