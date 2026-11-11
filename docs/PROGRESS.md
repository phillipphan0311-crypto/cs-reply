# Development progress

## 2026-11-11 — Etsy SMS Orders List, detail, and remote monitor reader, v0.1.8 prototype

## 2026-11-11 — Structured detail items and cleaner visible media/chat export, v0.1.9

Implemented:

- Serializes `items` as an array across list, order-detail, and remote-monitor records; legacy detail strings normalize to one array entry.
- Collects item-title and heading candidates together so visible add-on titles are not lost when a main title is present.
- Exports chat message/bubble text when identifiable, with an interactive-control removal fallback instead of fixed phrase splitting.
- Refines item extraction to use item-specific title elements plus visible `Add on Item:` rows, avoiding unrelated section headings.
- Excludes message/bubble candidates nested in composer, template, reply, and toolbar UI; the fallback also removes common template option labels.
- Filters common logo, avatar, and platform/system images by metadata and known system asset paths while retaining customer images from other hosts.
- Keeps exports operator-triggered; no background auto-run or customer-message sending was added.
- Updates synthetic tests for array serialization, add-ons, logo exclusion, visible chat bubbles, and CSV array formatting.
- Adds a fallback-cleanup test ensuring a customer message containing the words “Pick a template” remains intact while the actual template menu is removed.
- Initial verification: `node --test` passed 20/20 tests. A live Chrome export then exposed incomplete chat extraction; the follow-up fix and retest are recorded below.

Limits:

- Chat extraction is limited to message content currently rendered in the open chat panel; virtualized or unloaded older messages are not fetched.
- SMS application DOM classes may change; the current selector strategy uses message/bubble semantics plus a fallback that removes controls from the cloned visible chat area.
- Customer images are still only read from rendered `<img>` elements in the order page or expanded chat, not CSS backgrounds or unloaded attachments.

Implemented:

- Manifest V3 extension with an explicit JSON or CSV export action.
- Reads only the current tab after the operator opens the extension.
- On a manually opened order detail page, parses smsOrderId from the Order heading, etsyOrderId from the Etsy order marker near the supported shop name, and smsInternalId from the UUID id query parameter.
- Keeps the complete rendered body text in the extension-specific detailText field.
- When the order chat panel is expanded, captures its visible text separately in etsyChatText.
- Recognizes `/remote-access/monitor` when `app-order-detail` is present; extracts SMS Order ID, Etsy Order ID, and visible item title without assigning unrelated UUIDs to smsInternalId.
- Gives remote-monitor order exports their own `etsy-sms-remote-order-SMSID-YYYY-MM-DD` filename.
- Names list exports `etsy-sms-orders-list-YYYY-MM-DD` and detail exports `etsy-sms-order-detail-SMSID-YYYY-MM-DD` so they are easy to tell apart.
- Reads the visible shop, status, order date, and ship deadline from the detail page. Order alerts are extracted from the list only.
- Supports standard HTML tables and common ngx-datatable header/row cell classes.
- Keeps smsOrderId, etsyOrderId, and smsInternalId separate.
- Extracts known alerts, complete tag chips, notes, and the detail URL.
- Deduplicates by smsOrderId, using etsyOrderId only when the SMS ID is missing.
- Synthetic parser fixture and Node built-in tests.
- On order detail pages, extracts visible item titles from item-specific title elements and visible `Add on Item:` rows within `app-order-detail`.
- Exports `imageUrls` from rendered images within order detail and expanded chat, excluding avatar/logo images and removing query/fragment strings that may hold temporary signed tokens.
- Exports the first Etsy `/listing/<id>` link from the order detail or chat panel as `etsyListingUrl`, with tracking query/fragment removed.
- Includes `imageUrls` and `etsyListingUrl` in both JSON and CSV.

Limits:

- Reads visible DOM rows or a manually opened detail page; it does not switch tabs, paginate, scroll, or open detail pages automatically.
- The remote-access monitor page does not expose a reliable smsInternalId in its URL, so that field stays blank there.
- The detail export captures rendered body text, which may include personal data displayed on that page.
- Tested the parser against the user's exported detail text; reload the extension to use the corrected field mapping.
- Detail tags and notes are currently present in detailText but are not mapped into their dedicated fields.
- Does not open the chat panel automatically, read hidden messages, or send customer messages.
- shipDeadline is empty when the visible table does not provide that column.

## Live export follow-up — order-detail validation

- Reloaded unpacked extension v0.1.9 and exported the user-provided order detail with its Etsy chat panel open.
- The downloaded JSON kept `smsOrderId`, `etsyOrderId`, and `smsInternalId` distinct; `items` was an array with two entries including the add-on, and `imageUrls` contained four HTTPS image URLs.
- Live verification found a chat extraction defect: the visible chat panel contained multiple messages, but `etsyChatText` was only 77 characters and omitted known visible message content. This is a real failure; the export is not yet fully validated.
- Updated chat extraction to use the cleaned visible-panel text when semantic message selectors return substantially less content. Added a synthetic regression test for partial semantic matches and removal of composer/template controls.
- Verification after the fix: `node --test` passes 21/21 tests. Repeated the Chrome export after reloading v0.1.9: `etsyChatText` is 5,072 characters and includes both older and newest visible chat messages; the `Reply`, template, and `Copy` controls are absent. `items` remains a two-entry array and `imageUrls` remains four URLs. This validates the current order-detail case; chat extraction remains limited to content rendered in the open panel.
- The local customer JSON remains in Downloads and is not copied into the repository. No commit was created.

## Chat text formatting follow-up

- Comparing the two local JSON exports confirmed data loss in the line-break formatting iteration: the newer export omitted long visible chat passages.
- Root cause: the cleaned-panel fallback read only leaf elements, omitting text nodes held directly by parent elements that also contain child elements.
- Updated the fallback to walk the cloned chat DOM recursively, retain direct and nested text, add line breaks at block boundaries, and skip removed/hidden UI elements. The extension version is now 0.1.10.
- Added a synthetic regression test for nested parent text plus long chat paragraphs. Verification: `node --test` passes 23/23 tests, `node --check extension/src/page-extractor.js` passes, and `git diff --check` passes.
- Packaged the extension as `cs-reply-etsy-sms-reader-v0.1.10.zip`. Live Chrome export with v0.1.10 is still required to confirm the fix against the customer page; the available Chrome window was on an unrelated tab during this verification.
- Customer exports remain outside the repository. No customer data or secrets were added to the package or tests.
