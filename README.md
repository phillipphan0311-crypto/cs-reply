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

## Development status

Planning and early prototype stage. Do not assume that planned features are implemented. Update this section as working code is added.
