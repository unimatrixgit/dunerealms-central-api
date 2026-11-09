# DuneHub personal bank adapter

The new `src/session-bank.ts` implements a **separately gated, same-origin, read-only** `GET /api/v1/me/bank` handler.

**It is not mounted in the standalone HTTP server and not deployed to DuneHub.** The existing DuneHub service must inject:

- `authenticate(request)`: actual server-side DuneHub cookie/session validation, not a user ID header;
- `canReadPersonalBank(principal)`: deployed bank-specific action permission check;
- `identity.resolveVerifiedIdentity(accountId)`: account-bound verified Minecraft UUID, never a caller UUID;
- `bank`: the private Python-agent adapter `createBankAgent()`, using the existing loopback SSH tunnel.

Set `enabled:false` until these are wired and tested against the current deployed DuneHub source. The route rejects query overrides, browser bearer tokens, cross-origin calls and non-GET requests. It returns `linked:false` for unlinked accounts, and a sanitized 503 for dependency failure. It never performs balance writes.

## Verified Python contract

`GET /bank/player?uuid=<canonical-player-uuid>` returns:

- `playerUuid`, `currency:'dunemarks'`
- `balanceDunemarks`: personal savings balance
- `walletDunemarks`: current spending balance (may be signed)
- `ledger`: up to 50 savings entries
- `currentLedger`: up to 50 current-account entries

Each entry has `id`, `action`, `amountDunemarks`, `balanceDunemarks`, `createdAt` and optional `reference`, `memo`, `fromAccount`, `toAccount`. The adapter only returns allowlisted fields and requires the returned `playerUuid` to match the requested UUID.

This contract was confirmed from the user's running Python `player_bank.py` and `agent.py` source on 9 November 2026. The bank adapter's fixtures are synthetic; no production bank request has been made.

## Integration acceptance

Before enabling the route: reconcile the deployed DuneHub permission resolver; ensure no direct public access to Python agent; validate cookie session expiration, link changes, denied permissions, timeouts, malformed balances and ledger entries; establish bounded rate limiting and durable request audit. Keep existing `/api/bank/personal` unchanged until compatibility is verified.
