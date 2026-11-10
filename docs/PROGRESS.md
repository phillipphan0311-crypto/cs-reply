# Development progress

## 2026-11-10 — Etsy SMS Orders List and detail reader, v0.1.3 prototype

Implemented:

- Manifest V3 extension with an explicit JSON or CSV export action.
- Reads only the current tab after the operator opens the extension.
- On a manually opened order detail page with a UUID id query parameter, exports one record with the rendered body text in detailText.
- Supports standard HTML tables and common ngx-datatable header/row cell classes.
- Keeps smsOrderId, etsyOrderId, and smsInternalId separate.
- Extracts known alerts, complete tag chips, notes, and the detail URL.
- Deduplicates by smsOrderId, using etsyOrderId only when the SMS ID is missing.
- Synthetic parser fixture and Node built-in tests.

Limits:

- Reads visible DOM rows only; it does not switch tabs, paginate, scroll, or open detail pages.
- The detail export captures rendered body text, which may include personal data displayed on that page.
- Live detail extraction has not been verified against the SMS application's current DOM.
- Does not read Etsy Inbox messages or send customer messages.
- shipDeadline is empty when the visible table does not provide that column.
