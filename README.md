# CS Reply

AI-assisted customer support workspace for multiple Etsy shops.

## Project status

This repository is the source of truth for the CS Reply project. The current development focus is the Etsy MVP. Amazon, Walmart, TikTok, and Shopify are out of scope unless explicitly added later.

## Product principles

- Assist the operator; never send a customer message automatically.
- Show the source data and reasoning behind recommendations.
- Keep shop-specific policies and customer-case history separate and traceable.
- Distinguish identifiers from different systems; never infer one ID from another.
- Minimize customer personal data and never commit credentials, tokens, or private customer records.

## Current MVP direction

1. Read visible Etsy-related SMS Orders List data through a Chrome extension.
2. Normalize order identifiers, statuses, tags, alerts, notes, and detail links.
3. Add case review, shop policy/knowledge, case history, and reply drafting in later phases.
4. Require human review and approval before any customer reply is sent.

## Supported shops

- VuEmbroidery
- KevinEmbroidery
- MarkEmbroideryy
- BruceEmbroideryStore
- DogFactsFun
- VinkEmbroidery

## Repository guide

- [AGENTS.md](./AGENTS.md) — instructions for AI coding agents.
- [docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md) — product scope, data model, and known constraints.
- [docs/PROGRESS.md](./docs/PROGRESS.md) — implemented work and current limitations.

## Development status

The first Chrome extension prototype is in [extension/](./extension/). It reads visible SMS Orders List rows only after the operator opens the extension and exports JSON or CSV. It does not send messages or navigate the SMS app.

### Install locally

1. Open chrome://extensions and enable **Developer mode**.
2. Choose **Load unpacked** and select this repository's extension/ folder.
3. Open the SMS Orders List, then open the extension and choose JSON or CSV export.

The extension requests activeTab and scripting only. It has no configured host-wide access. Extraction from the live SMS page still needs manual verification against that page's current DOM.

### Run parser tests

Run npm test from the repository root. Tests use only Node's built-in test runner and synthetic HTML; there are no package dependencies.
