# Changelog

## 0.6.0 (2025-03-28)

### Features

- Added KirimEmail Domain Log node - retrieve email logs for authenticated domain
- Support for paginated log retrieval with limit option
- Simplified output option for essential log fields

### Nodes

- KirimEmail Domain Log - Get logs via GET /api/v4/transactional/log

## 0.5.0 (2025-03-28)

### Features

- Enhanced error handling with NodeApiError for better debugging
- Support for bulk email sending (up to 1000 recipients)
- JSON array and comma-separated recipient formats
- Custom email headers support

### Bug Fixes

- Fixed error handling to properly parse API error responses
- Improved validation error messages

## 0.1.0 (2024-03-27)

### Features

- Initial release
- KirimEmail Transactional node - send transactional emails
- KirimEmail Trigger node - receive webhook events with signature verification

### Credentials

- KirimEmail API - supports API key + secret authentication with domain header
