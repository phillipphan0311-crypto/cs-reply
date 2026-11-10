# CS Reply — Project Context

## Purpose
Build a web application and browser extension that help an operator handle customer-service cases across multiple Etsy shops. The system should read order context, compare relevant prior cases, apply shop-specific policies, recommend next steps, and draft English customer replies. A human must approve every reply; automated sending is not part of the MVP.

## Current scope
Etsy only. The following marketplaces/platforms are explicitly out of scope for the current MVP: Amazon, Walmart, TikTok, and Shopify.

## Shops
- VuEmbroidery
- KevinEmbroidery
- MarkEmbroideryy
- BruceEmbroideryStore
- DogFactsFun
- VinkEmbroidery

## Product areas under consideration
- Case Processing
- Order Management
- Shop Knowledge Base and policies
- Case History
- Reply Generator
- Analytics

These are planned product areas, not claims that the features already exist.

## SMS Orders List integration

The supplied page was an Angular 22.2.3 application using ngx-datatable. The visible table included tabs such as Pending, New, Designing, Designed, and Clarification; filters for Order ID / Order No., Store Manager, and Store; and columns including ID, Store, Order Number, Order Date, Status, Items, Tags, and Notes.

The extension reads currently visible table rows, and can read the rendered text of a detail page that the operator has opened manually. It does not switch tabs, paginate, scroll, open detail pages automatically, or read Etsy Inbox messages.

On the detail page, smsOrderId is parsed from the explicit Order heading, etsyOrderId from the numeric order marker in the supported shop block, and smsInternalId from the URL query parameter. When a marker cannot be matched, leave that field empty. The full rendered body text is also retained in the extension-specific detailText field; it may include customer contact or address information.

### Canonical order record shape

```json
{
  "smsOrderId": "1420283",
  "etsyOrderId": "4221692643",
  "smsInternalId": "22c7cf78-b966-4457-9136-08df3b396c19",
  "shop": "VuEmbroidery",
  "marketplace": "Etsy",
  "orderDate": "",
  "shipDeadline": "",
  "status": "New",
  "items": "",
  "tags": ["TEXT", "FULFILLMENT REJECTED"],
  "orderAlerts": ["URGENT", "LATE SHIP"],
  "notes": "",
  "detailUrl": ""
}
```

The values above are illustrative examples, not live customer data.

### Identifier rules
- `smsOrderId`: numeric ID from the first ID column.
- `etsyOrderId`: Etsy order number from the Order Number column.
- `smsInternalId`: UUID from the detail URL query parameter `id=...`.
- These three identifiers represent different systems and must remain separate.

### Extraction rules
- Warning labels such as `URGENT` and `LATE SHIP` belong in `orderAlerts`, not in the Etsy order number.
- Tags can be numerous and may contain spaces, for example `FULFILLMENT REJECTED` or `before cutoff`. Extract each tag/chip as a complete value.
- Preserve the full Notes text.
- Do not infer actions from note text. In particular, there is no confirmed “Check” button; do not invent controls.
- The UUID in the detail URL is an internal SMS identifier, not an order number.
- Deduplicate by SMS Order ID, falling back to Etsy Order ID only when the SMS ID is absent.

## Existing prototype history
Earlier prototype archives were discussed as v0.1.0 and v0.1.1. They are not present in this repository. The canonical list schema is implemented in the extension; the detail export adds detailText while retaining the three separate IDs. See [docs/PROGRESS.md](./PROGRESS.md) for current coverage and limitations.

## Privacy
Customer email, address, and phone may be useful for specific support workflows, but must be handled minimally:
- Email only for relevant order-support communication.
- Address only when needed for shipping or delivery resolution.
- Phone only when genuinely necessary.
- Never store credentials, cookies, session IDs, or temporary signed URL tokens in application records or Git.
- Use synthetic data in repository fixtures and examples.

## Architecture direction (not yet a commitment)
A possible stack discussed: Next.js + React, Tailwind CSS + shadcn/ui, Supabase/PostgreSQL + Storage, OpenAI API, Vercel, and a Chrome Extension using Manifest V3. Inspect the repository and agree on architecture before scaffolding; this is a proposal, not an implemented stack.

## Working method
1. Inspect current files and report what exists.
2. Agree on the next small deliverable.
3. Implement in a focused change.
4. Run relevant tests or verification.
5. Report exact files changed, results, and remaining limitations.
