# Instructions for AI coding agents

## Before changing code
- Read this file and `docs/PROJECT_CONTEXT.md`.
- Inspect the existing repository and current implementation before proposing or making changes.
- Preserve working behavior; make small, reviewable changes.
- Do not claim a feature, test, build, or deployment succeeded unless you actually ran or verified it.
- If information is missing, ask one focused question rather than inventing product behavior.

## Product scope
- Current MVP: Etsy customer-support workflow and its SMS Orders List integration.
- Amazon, Walmart, TikTok, and Shopify are not in the current MVP.
- The app is an assistant for a human operator. Never send customer messages automatically.
- The operator must review and approve a suggested response before sending.

## Data correctness
The following identifiers are different and must never be conflated:
- `smsOrderId`: numeric ID shown in the first ID column of the SMS Orders List.
- `etsyOrderId`: Etsy order number shown in the Order Number column.
- `smsInternalId`: UUID from the SMS detail URL query parameter `id`.

Example only:
- `smsOrderId = "1420283"`
- `etsyOrderId = "4221692643"`
- `smsInternalId = "22c7cf78-b966-4457-9136-08df3b396c19"`

When extracting rows:
- Keep `URGENT` and `LATE SHIP` as `orderAlerts`, not part of `etsyOrderId`.
- Store tags as an array of complete tag labels. Do not split multi-word tags on spaces or impose an arbitrary tag limit.
- Preserve the complete internal notes text.
- Treat the UUID in the detail URL as `smsInternalId`, not as either numeric ID.
- Deduplicate by `smsOrderId`; if unavailable, use `etsyOrderId` as a fallback.
- Keep JSON and CSV exports semantically aligned. Arrays may be joined with ` | ` in CSV.

## Privacy and security
- Do not commit customer names, email addresses, phone numbers, shipping addresses, order screenshots, or private message contents as test fixtures.
- Use synthetic data for tests and documentation.
- Do not commit API keys, OAuth tokens, cookies, session IDs, signed URL tokens, or secrets.
- Read only the minimum personal data needed for the support task.
- Do not log sensitive customer data unnecessarily.

## Engineering practices
- Follow the conventions and dependency versions already present in the repository.
- Do not introduce a framework or dependency without explaining why it is needed.
- Validate parsing against realistic HTML fixtures with synthetic customer data.
- Add or update tests for parsing, ID separation, alerts, tags, notes, and deduplication.
- Handle missing or malformed fields safely; do not silently fabricate values.
- Keep permissions in any browser extension as narrow as practical.
- Document manual setup and verification steps.

## Communication
- Clearly separate confirmed behavior, assumptions, and proposed future work.
- Report changed files, tests actually run, results, and known limitations.
- Never invent UI controls or claim access to pages/data that were not inspected.
