# CS Reply Etsy SMS Reader 0.1.10

## Install

1. Extract this ZIP.
2. Open chrome://extensions and enable Developer mode.
3. Choose Load unpacked and select this extension folder.
4. Open the SMS Orders List or an order detail page. To include chat text, open the chat bubble first, then open the extension and export JSON or CSV.

List files are named `etsy-sms-orders-list-YYYY-MM-DD`; a single-order detail file is named `etsy-sms-order-detail-SMSID-YYYY-MM-DD`; remote-access monitor orders use `etsy-sms-remote-order-SMSID-YYYY-MM-DD`.

## Order detail export

- smsOrderId is read from the Order heading.
- etsyOrderId is read from the Etsy order number shown near a supported shop.
- smsInternalId is read from the URL id parameter.
- On `/remote-access/monitor`, the order is recognized through the `app-order-detail` component. If that page has no reliable internal order ID, smsInternalId remains empty.
- The visible product title is read from `.order-item-title` on remote-access monitor pages.
- On order detail pages, visible item titles are read from item title elements and `Add on Item:` rows inside `app-order-detail`, then exported as an array.
- The visible page text is also included in detailText.
- When expanded, the `app-order-chat-box .chat-area` text is also included in `etsyChatText`. If the chat is collapsed, this field is empty.
- `etsyListingUrl` is the first Etsy `/listing/<id>` link found in the detail or expanded chat panel; query and fragment data are removed.
- `imageUrls` contains HTTP(S) image sources rendered inside the order detail or expanded chat panel. Query and fragment data are removed to avoid exporting temporary signed tokens. Avatars, logos, and known platform/system icons are skipped without restricting customer images to one host.
- Chat text prefers rendered message/bubble elements outside composer/template controls. When the app does not expose identifiable message elements, the extractor removes interactive composer and template UI from a cloned chat region without splitting at message text.
- The cleaned-panel fallback walks the cloned visible DOM, retaining text nodes on parent elements and nested elements while adding line breaks at block boundaries.
- JSON and CSV include both `imageUrls` and `etsyListingUrl`; CSV joins URL arrays with ` | `.

The extension does not open pages or click controls. It reads the current page after the operator opens the popup. It captures rendered `<img>` sources, not CSS background images or files that have not loaded into the page. The full detail text and chat can contain customer information; keep exports private.
