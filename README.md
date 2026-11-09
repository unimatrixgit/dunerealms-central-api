# DuneRealms Central API

Development and integration documentation for the DuneRealms Central API.

## Status

The existing API v1 foundation is in DuneGit `apidev/MC`, branch `feature/api-v1-foundation`, commit `f787da9`. It was developed against an older MC website snapshot and is **not deployed**. The original source has not yet been imported into this GitHub repository.

The foundation provides five session-authenticated read-only endpoints:

- `GET /api/v1/me`
- `GET /api/v1/me/minecraft`
- `GET /api/v1/me/permissions`
- `GET /api/v1/servers`
- `GET /api/v1/catalogue`

It is default-off behind `API_V1_ENABLED=true`. The development report states 29 fixture tests passed; production integration is unverified.

## Bank integration

The existing DuneHub website sends `POST /api/bank/transfer-own` to its internal Python agent through a private SSH tunnel. The agent invokes `bank_transfers.transfer()`, using the existing MySQL-compatible `dunegameplay` database.

The own-account transfer implementation uses SQL transactions, locked account rows, durable request-ID deduplication, and paired ledger entries. The reported transfer failure is still **unresolved**. Do not create a second wallet or directly modify live balances.

See [Bank integration contract](docs/BANK-INTEGRATION.md) and [Migration plan](docs/MIGRATION.md).

## Sources

- [API foundation](https://www.dunerealms.com/git/apidev/MC/src/branch/feature/api-v1-foundation)
- [Upstream DuneRealms](https://www.dunerealms.com/git/unimatrix/MC)

Never commit secrets, private keys, production database exports or player data.
