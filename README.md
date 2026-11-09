# DuneRealms Central API

This is the **dedicated development repository** for the DuneRealms Central API.

## Published API v1 foundation

The existing read-only DuneHub gateway implementation was copied from `unimatrixgit/mca`, branch `feature/central-api-v1`, into [integrations/dunehub](integrations/dunehub). It provides:

- `GET /api/v1/me` — current website account
- `GET /api/v1/me/minecraft` — linked Minecraft identity
- `GET /api/v1/me/permissions` — legacy effective permissions
- `GET /api/v1/servers` — server status
- `GET /api/v1/catalogue` — native exchange catalogue

**Important:** The imported module is a DuneHub integration, **not yet a standalone runnable API service**. It depends on `website/node/auth.mjs`, `permissions.mjs` and `world-status.mjs` from the MC website repository. Its tests likewise depend on the original DuneHub test fixtures and must be run within that source tree. Do not claim this repository has passed tests or is deployed.

The integration is **disabled by default** and requires `API_V1_ENABLED=true` in a staging environment. No bank transfers or other financial mutations are enabled.

## Next development

1. Extract a standalone Node.js/TypeScript service with explicit interfaces for identity, permission resolution and backend adapters.
2. Add independent contract tests and CI.
3. Reconcile with the deployed DuneHub version before wiring it to production.
4. Add read-only bank integration, then separately validate transactional transfer behavior in isolated staging.

The original bank integration and migration notes are in [docs](docs). Do not commit secrets or live player data.
