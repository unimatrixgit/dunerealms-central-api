# Prepare a DuneHub bank-v1 staging snapshot

This process does **not** start a second control panel, modify the active release, call the bank agent, or write to the production database.

On the Debian web host:

```sh
cd /opt/dunerealms-central-api
git pull --ff-only
npm test
node scripts/prepare-dunehub-staging.mjs /opt/dunerealms-staging-tests
node --check /opt/dunerealms-staging-tests/control-panel/server.mjs
DUNEHUB_STAGING_DIR=/opt/dunerealms-staging-tests node --test tests/dunehub-real-banking.test.mjs
```

The staging patcher recognizes the existing `createBanking(...)` variable and the exact personal-bank router entry. If the live snapshot differs, it stops with an error instead of guessing. It writes `server.mjs.before-bank-v1` as an immutable backup, copies the bank-v1 adapter, and adds a route gated behind `DUNE_API_V1_BANK_STAGING=true`. The flag is **off by default**. Do not set the flag on production yet.

To undo the staging-only modification:

```sh
cp /opt/dunerealms-staging-tests/control-panel/server.mjs.before-bank-v1 /opt/dunerealms-staging-tests/control-panel/server.mjs
```

No PM2 reload, no systemd restart, and no public proxy changes are required for this offline staging step. The next deployment milestone is an isolated process integration with the DuneHub auth database and a production rollback plan; these are not completed by this patch.
