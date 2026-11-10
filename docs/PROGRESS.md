# Development progress

## 2026-11-10 — Etsy SMS Orders List reader, v0.1.2 prototype

Implemented:

- Manifest V3 extension with an explicit JSON or CSV export action.
- Reads only the current tab after the operator opens the extension.
- Supports standard HTML tables and common ngx-datatable header/row cell classes.
- Keeps smsOrderId, etsyOrderId, and smsInternalId separate.
- Extracts known alerts, complete tag chips, notes, and the detail URL.
- Deduplicates by smsOrderId, using etsyOrderId only when the SMS ID is missing.
- Synthetic parser fixture and Node built-in tests.

Limits:

- Reads visible DOM rows only; it does not switch tabs, paginate, scroll, or open detail pages.
- Live extraction has not been verified against the SMS application's current DOM.
- Does not read Etsy Inbox messages or send customer messages.
- shipDeadline is empty when the visible table does not provide that column.
