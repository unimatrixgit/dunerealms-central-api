# Central API integration plan

1. Import and verify the existing DuneGit API v1 foundation (`f787da9`), including `website/node/api-v1.mjs`, `website/api/openapi-v1.json`, and `website/tests/api-v1.test.mjs`. This repository currently contains documentation, **not that complete implementation**.
2. Reconcile API foundation changes with the latest deployed DuneHub source. Do not replace the newer control-panel `server.mjs` with the historical fork version.
3. Keep `API_V1_ENABLED` disabled by default; test the five existing read endpoints with fixtures and a real staging session.
4. Add read-only personal bank adapters with server-side ownership checks and sanitized responses.
5. Diagnose the existing `transfer-own` failure in the Python agent, preserving the database transaction boundary and idempotency.
6. Add a narrowly scoped, independently gated transfer API only after staging tests for authorization, duplicate requests, concurrency, and ambiguous network outcomes.
7. Deploy gradually with an explicit rollback plan. Keep the SSH tunnel until every dependent service has been identified and migrated.

**Not in scope:** new wallets, direct website balance writes, production database migrations, Minecraft gameplay changes, and live payment tests without approval.
