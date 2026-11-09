# DuneHub bank integration — verified observations

The DuneHub UI `control-panel/public/bank-transfer-view.mjs` submits own-account transfers to `POST /api/bank/transfer-own`. The Node handler `control-panel/bank-transfers.mjs` checks website authentication, bank access, linked player UUID, origin and input, then forwards to `http://127.0.0.1:15433/bank/transfer-own` with an internal bearer token.

The DuneHub host forwards localhost port 15433 over SSH to remote port 25573, where Python `/opt/dunerealms/server-control/agent.py` handles the request by calling `bank_transfers.transfer(network_database, **data)`. The remote Python agent uses PyMySQL to connect to the `dunegameplay` database via local port 13307.

## Existing tables

- `dune_player_banks(player_uuid, balance, updated_at)`
- `dune_economy_balances(uuid, balance)`
- `dune_player_bank_ledger(id, player_uuid, action, delta, balance_after, created_at, reference)`
- `dune_current_bank_ledger(id, player_uuid, action, delta, balance_after, created_at, reference)`
- `dune_bank_web_transfers(request_id, player_uuid, fingerprint, result, created_at)`

The supplied Python transfer implementation has atomic debit/credit, row locking, durable idempotency and paired ledger entries. Its three-column `dune_player_banks` INSERT matches the observed schema. **The reported current↔savings transfer failure remains undiagnosed.** No live payment was tested.

## Requirements for Central API

- Reuse authoritative bank balances and existing transaction service.
- Derive linked player UUID and ownership server-side; never trust a browser-provided UUID.
- Keep bank mutations in one authoritative transaction, not in the website gateway.
- Preserve request ID on retries, especially after timeouts.
- Test concurrent requests, changed-payload idempotency collisions, insufficient funds, crash recovery and ledger reconciliation in isolated staging.
- Preserve legacy DuneHub endpoints during migration.
- Never expose the internal agent publicly or commit service credentials.

No production service changes are authorized by this document.
