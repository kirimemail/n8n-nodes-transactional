# Changelog

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
