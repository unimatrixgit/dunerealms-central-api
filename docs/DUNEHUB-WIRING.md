# DuneHub wiring guide (staging only)

The new `src/dunehub-adapters.ts` implements:

1. `createDuneHubSessionAuth(db)`: validates the real `__Host-dune_session` cookie against `site_sessions` joined to `site_accounts`, checking expiration.
2. `createDuneHubIdentityResolver(db)`: joins `site_game_links` with `site_game_identities` to require a verified account-bound UUID.
3. `createDuneHubBankPermission(resolveAction)`: checks the explicit `web.bank.personal.view` action using the **deployed** permission resolver.

The last component is intentionally injected: the historical `mca/main` source uses legacy permission nodes and cannot safely grant personal-bank access. No rank/staff/menu fallback is permitted.

A maintainer integrating this into the current DuneHub release should:

- Import or vendor the compiled adapter into the DuneHub process, keeping its existing database and session implementation authoritative.
- Pass the existing DB adapter, an actual server-side action permission callback and the private Python agent client to `createSessionBankHandler`.
- Set `enabled:false` until staging has verified session expiry, permission denial, linked UUID ownership, bank response shape, and absence of direct public Python-agent access.
- Mount the handler **before** the legacy route fallback, without replacing existing `/api/bank/personal` or any mutation routes.
- Preserve the existing server-side audit and add an edge rate limit before enabling on production.

Do not copy secrets into the source tree or log bearer credentials. No production installation is performed by this repository.
