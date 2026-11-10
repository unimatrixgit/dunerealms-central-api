# DuneRealms Central API

Standalone Node.js 22+ / TypeScript gateway, developed independently from the Minecraft server and DuneHub.

## Status

**Development only — not deployed.** The service is default-off, binds to localhost only, and exposes no banking mutations.

### Standalone endpoints

- `GET /healthz` — basic process health, no authentication
- `GET /api/v1/status` — authenticated service status
- `GET /api/v1/servers` — authenticated, sanitized world-status read from a fixed HTTPS monitor URL

The `/api/v1/*` endpoints currently use a private **service-to-service bearer token**, not a website login. Do not call them directly from browsers or mobile apps. The user-session gateway previously imported from MC is preserved separately in [integrations/dunehub](integrations/dunehub), but it is not yet connected to this standalone service.

### Development

```bash
npm install --ignore-scripts
npm test
npm run build
```

Set environment variables using [`.env.example`](.env.example) as a guide (never commit real credentials). Start in a staging shell:

```bash
API_ENABLED=true API_SERVICE_TOKEN='<your-random-32+-character-secret>' npm start
```

The default listener is `127.0.0.1:18080`. `WORLD_STATUS_URL` is optional; without it, the servers endpoint returns 503. The upstream must use HTTPS and supply a recent `checkedAt` timestamp and `servers` object. Upstream fields are allowlisted; secrets are never forwarded.

CI configuration is in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). **Tests are committed but have not been verified as passing in this session.**

## Integration plan

1. Run TypeScript build and tests, fix any failures.
2. Reconcile the current deployed DuneHub source and the verified Minecraft account link / scoped permission model.
3. Add an authenticated user-session adapter (without accepting browser-provided UUIDs).
4. Add **read-only** bank adapters against the existing Python bank agent, with independent authorization and contract tests.
5. Diagnose the existing own-account transfer failure and test idempotency and ledger atomicity in isolated staging before enabling any mutation.

See [bank contract](docs/BANK-INTEGRATION.md) and [migration plan](docs/MIGRATION.md).

No production database or server has been changed.

## Player services roadmap

The staged twelve-feature plan for the Central API, DuneHub and Minecraft plugins is documented in [Player Services Roadmap](docs/PLAYER-SERVICES-ROADMAP.md). It preserves existing Exchange, bank, faction, permission and reward systems; the planned endpoints are not live by default.
