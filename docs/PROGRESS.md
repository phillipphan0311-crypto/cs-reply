# Development progress

## 2026-11-11 — Etsy SMS Orders List and detail reader, v0.1.5 prototype

Implemented:

- Manifest V3 extension with an explicit JSON or CSV export action.
- Reads only the current tab after the operator opens the extension.
- On a manually opened order detail page, parses smsOrderId from the Order heading, etsyOrderId from the Etsy order marker near the supported shop name, and smsInternalId from the UUID id query parameter.
- Keeps the complete rendered body text in the extension-specific detailText field.
- Names list exports `etsy-sms-orders-list-YYYY-MM-DD` and detail exports `etsy-sms-order-detail-SMSID-YYYY-MM-DD` so they are easy to tell apart.
- Reads the visible shop, status, order date, and ship deadline from the detail page. Order alerts are extracted from the list only.
- Supports standard HTML tables and common ngx-datatable header/row cell classes.
- Keeps smsOrderId, etsyOrderId, and smsInternalId separate.
- Extracts known alerts, complete tag chips, notes, and the detail URL.
- Deduplicates by smsOrderId, using etsyOrderId only when the SMS ID is missing.
- Synthetic parser fixture and Node built-in tests.

Limits:

- Reads visible DOM rows or a manually opened detail page; it does not switch tabs, paginate, scroll, or open detail pages automatically.
- The detail export captures rendered body text, which may include personal data displayed on that page.
- Tested the parser against the user's exported detail text; reload the extension to use the corrected field mapping.
- Detail tags, items, and notes are currently present in detailText but are not mapped into their dedicated fields.
- Does not read Etsy Inbox messages or send customer messages.
- shipDeadline is empty when the visible table does not provide that column.
