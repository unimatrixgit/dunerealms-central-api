# Unified DuneRealms staff, ranks, departments, LuckPerms and recognition

## Source comparison
- Existing DuneHub `website/node/permissions.mjs` stores website access ranks `user`, `vip`, `staff`, `corestaff`, `owners` plus separate House, Path and Office ranks.
- Existing `website/node/rank-admin.mjs` serves a game permission catalog and account-to-rank mapping, not a verified LuckPerms group combination endpoint.
- Existing `website/node/community-rewards.mjs` handles earned Dunemarks and receipts; these are **not staff permission grants**.
- `website/web/staff-data.json` currently has an empty public human roster in the reviewed repository snapshot.
- Imperial seal artwork exists, but no verified implementation of a seal/award entitlement or staff-rights service was located in the reviewed source. Do not claim one exists or silently replace its rules.

## Single control panel, separate authority boundaries
1. Identity: existing authenticated DuneHub account + verified Minecraft UUID.
2. Website rank: existing rank permission matrix, with protected owner and audit.
3. Department assignments: Shop, Exchange, Tickets, Appeals, Moderation, Events, Helpers, Community; assign multiple independently and audit all changes.
4. LuckPerms: only explicitly approved managed groups synchronized from verified website-rank mappings; preserve House, Office, political and unrelated groups.
5. Seals and awards: recognition display only until the real rules and persistence are verified. No website or Minecraft permission escalation from recognition.
6. Community rewards: keep existing receipt/idempotency and Dunemarks ledger untouched.

## Deployment gates
- Back up production database and release; deploy to isolated staging.
- Implement authenticated department assignment API with owner/delegated authorization, CSRF/origin protection, versioned writes, audit and revocation.
- Verify real live group names and integration protocol with LuckPerms before enabling group mutations. Dry-run diff and rollback first.
- Inspect actual seal and award rules before connecting their records; never infer rights from an image or name.
- Test website permissions, department scoping, game sync and preserved House/Office groups.
- Do not enable live routes or edit LuckPerms production without confirmed account identities and server access.

Current status: shared planning/validation modules and tests committed; not deployed to DuneHub or Minecraft.
