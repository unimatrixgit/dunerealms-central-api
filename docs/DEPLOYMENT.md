# Deployment and real DuneHub bank integration

## Current state

- Standalone API runs on loopback `127.0.0.1:18081` under `dunerealms-central-api.service`; `API_ENABLED=false` is the safe default.
- The DuneHub personal-bank v1 adapter is **not mounted** in the live control panel.
- The live DuneHub panel runs through PM2 on loopback `127.0.0.1:3003`. Starting another `startPanel()` against the production database is unsafe because it initializes schemas and starts background jobs.
- The live bank implementation in `control-panel/banking.mjs` already rechecks identity, permissions and Minecraft link after the Python read.

## Isolated integration test on the Debian host

The snapshot already prepared at `/opt/dunerealms-staging-tests` must contain `control-panel/`, `node/`, `integrations/`, and `package.json`. It must **not** contain a production `.env` file. Run only the test process:

```sh
cd /opt/dunerealms-central-api
git pull --ff-only
DUNEHUB_STAGING_DIR=/opt/dunerealms-staging-tests node --test tests/dunehub-real-banking.test.mjs
npm test
```

The test imports the copied real DuneHub `createBanking` but injects fake `authenticate`, `access`, `linked`, `fetcher`, and `accountNumber` functions. It does not call `startPanel()`, make a database connection or send an HTTP request to the Python agent.

## Updating the standalone API

After CI passes and the server tests pass, use the existing systemd service:

```sh
cd /opt/dunerealms-central-api
git pull --ff-only
npm test
systemctl restart dunerealms-central-api
systemctl is-active dunerealms-central-api
curl --fail --silent --show-error http://127.0.0.1:18081/healthz
```

The separate `release-candidate.yml` workflow builds and archives tested code on GitHub. It does **not** have SSH access, secrets, or permission to deploy to production. Do not add an unattended auto-restart until the DuneHub route is tested, an explicit rollback mechanism is configured, and deployment credentials are provisioned securely.

## Enabling v1 in DuneHub

Use a separate release copied from the active DuneHub release and a staging-only route test. Do not edit the active release in place or start a second live PM2 panel. The route adapter at `integrations/dunehub/api-v1-personal-bank.mjs` is disabled by default and delegates to the existing bank handler. Promotion to the live control panel requires an approved release and a tested rollback plan.
