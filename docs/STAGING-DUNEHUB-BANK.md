# Deploy the v1 personal-bank route to DuneHub staging

This integration is **not automatically mounted** by the standalone API systemd service on port 18081. It belongs inside the DuneHub control-panel Node process.

The native DuneHub bank handler already implements:
- cookie/session authentication via `node/auth.mjs`;
- permission `web.bank.personal.view` via the deployed access resolver;
- server-side Minecraft link lookup;
- Python agent lookup via the existing private `127.0.0.1:15433` tunnel;
- **revalidation** of the session, permission and linked UUID after bank I/O;
- canonical account numbers, display names and ledger projection.

The drop-in `integrations/dunehub/api-v1-personal-bank.mjs` delegates to that existing handler, then wraps the response as `{data:{linked,bank}}`. It is disabled by default, rejects caller UUID overrides and all mutations, and sanitizes errors. The existing `/api/bank/personal` remains untouched.

## Safe staging checklist

1. Make a new release directory from a backup/copy of the current live DuneHub release; never edit `current` or swap its symlink for this test.
2. Copy `api-v1-personal-bank.mjs` into the staging release's `control-panel/` folder.
3. In that staging release's `control-panel/server.mjs`, import `createV1PersonalBank` and instantiate `const v1PersonalBank=createV1PersonalBank(banking,{enabled:true})` **after** the existing `banking` handler has been created.
4. In the same request router, before its fallback 404, add `if(path==='/api/v1/me/bank')return v1PersonalBank(request);`.
5. Start the staging control panel on a **separate loopback port** with a separate process. Reuse the existing server-side database/session resolver only after confirming how the staging process reads configuration. Do not start a second live PM2 instance with the same port.
6. Verify: unauthenticated 401, permission denied 403, unlinked account `linked:false`, linked account own balance only, no query UUID overrides, no POST, and account-link change during a request.
7. Inspect staging logs for secrets, and keep bank transfer routes disabled or unexposed in staging. Never use real money-moving requests for testing.
8. Promote only after staging is verified and a rollback procedure is prepared.

**Do not use the standalone `API_ENABLED` setting to enable this website route.** The featureflag is separate and controlled by the DuneHub integration. No production changes are made by the Central API repository.
