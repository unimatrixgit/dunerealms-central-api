# DuneHub staff workspace integration — staging only

The new `integrations/dunehub/staff-workspace.mjs` and `.css` enhance the **existing** DuneHub staff page. They do not replace the existing authorization or account management endpoints.

## Staff organization

Network Owner
- Web: Community & Support, Ban Appeals (independent), Shop & Payments
- Game: Moderation, Events, Player Help

The organization is displayed as a blueprint. The live DuneHub repository has no confirmed department membership API, so the page **does not fabricate department assignments** or allow saving memberships yet.

## Account tools

- Search by username, website rank or Minecraft name.
- Filter accounts by existing rank.
- Assign an allowed website rank through the existing `/api/ranks/assign` endpoint.
- Revoke sessions through the existing `/api/admin/revoke-sessions` endpoint.
- Existing server-side authentication, origin checks, rank protections and auditing remain authoritative.
- All account data is rendered via `textContent`, never as user-controlled HTML.
- The page only loads account details for sessions with `cp.accounts.view`.

## Deploy later, not now

1. Copy the two files into a **new isolated DuneHub release** under `control-panel/public/`.
2. Add `<link rel="stylesheet" href="/staff-workspace.css">` and `<script type="module" src="/staff-workspace.mjs"></script>` to the release's `control-panel/public/index.html`.
3. Add `staff-workspace.css` and `staff-workspace.mjs` to the static file allowlist in `control-panel/server.mjs`. If the production router differs, inspect it before patching.
4. Verify `/api/auth/session`, `/api/admin/accounts`, and `/api/ranks` contracts on the staged release, using a test DB.
5. Resolve existing DuneHub test failures, then use a rollback-capable release switch.

Do **not** copy directly to `current`, start a second production panel, or enable public routes before tests pass.

## Later work

A separate authenticated membership API, audited assignment updates, appeal conflict-of-interest checks, and a LuckPerms group synchronizer are still required. Website rank changes do not automatically assign department memberships or Minecraft groups.
