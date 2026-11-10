# DuneRealms — Player Services Development Roadmap
**Prepared:** 2026-11-10 · **Status:** approved scope, implementation planning only
**Systems:** Central API (service boundary), DuneHub (web/control panel), Minecraft Paper/Velocity plugins (authoritative game events)

## Principles and non-negotiable migration rules
- Extend existing Exchange/Marketplace, bank, rewards, political elections, faction systems, jobs, inventories, protection and tickets. Do **not** create competing ledgers or replace existing live handlers blindly.
- The existing Minecraft game and/or its verified shared database is authoritative for gameplay, inventories, balances, territory, faction membership, elections and awards. The Central API validates and exposes scoped contracts; DuneHub presents them.
- Website accounts link to Minecraft UUIDs using existing verified identity flow. Public views are opt-in and privacy-filtered. Never trust client-supplied UUID or faction.
- All state-changing operations: authenticated principal, explicit permission, ownership validation, idempotency key, audit trail, optimistic version or transaction lock, rate limits and anti-replay protection.
- Keep website access ranks, department roles, LuckPerms groups, House/Office/political roles and seals/awards independent. Never turn achievements into staff privileges.
- No direct public database or Minecraft backend access. Service-to-service auth and proxy restrictions remain intact.
- Every rollout uses additive migrations, backfill/dry-run, feature flag, contract tests, staging, rollback plan and preservation checks. Avoid destructive schema changes.

## Dependencies and phase gates
**P0 — Platform first (blocker):** audit current production schemas and endpoint contracts; identify actual data owners; fix CI; publish versioned read APIs; build scoped auth, event/outbox delivery, durable event IDs, pagination, error codes, observability and a notification preferences model. Prove bank/Exchange/permission consistency in staging. No public write routes until verified.

**P1 — Read-first player services (high):** Passport, Marketplace enhancements/price history, Finance Dashboard, Notification Centre. Read-only by default; sensitive balances and inventories are owner-only. Historical price chart uses actual completed transactions (not demo offers); exclude manipulated/invalid prices.

**P2 — Network/community (high):** Faction War Room, Elections & Landsraad, Event Calendar, Planetary Events. Political results and votes come from existing authoritative election rules; events are fed by plugin telemetry, not website guesses.

**P3 — Progression (medium):** Seals & Achievements, Exploration Journal. Inspect existing seal/award semantics before importing; backfill achievements only from verifiable historic events. Discovery coordinates private by default to avoid revealing hidden sietches.

**P4 — Transactional expansion (medium-high, complex):** Contracts & Bounties, Settlements & Property. Escrow only after ledger reconciliation, atomic reserve/settle/refund, dispute workflow and abuse controls. Settlements require protection/claim overlap validation and rollback.

## Feature implementation matrix

| ID | Feature | Priority / phase | Central API contract (planned) | DuneHub | Minecraft plugin integration | Data owner and safeguards |
|---|---|---|---|---|---|---|
| DR-01 | Player Passport | P1 / 1 | `GET /api/v1/me/passport`, `GET /api/v1/players/:uuid/public` | Profile with privacy toggles, House, optional stats, equipment preview | DuneCore identity/faction/stat snapshots; inventory bridge | UUID authority, visibility per field, avoid lobby inventory and world-only ender chest merging |
| DR-02 | Marketplace & Price History | P1 / 1 | `GET /api/v1/exchange/listings`, `GET /api/v1/exchange/prices?material=...` | Improve existing catalogue, filters, favourites, historical price charts | Existing DuneEss ExchangeStore events/sale receipts | No duplicate market, completed sale prices only, avoid fabricated live listings |
| DR-03 | Faction War Room | P2 / 2 | `GET /api/v1/factions/overview`, `GET /api/v1/invasions` | House standings, territory, campaign history | DuneCore political/invasion state events | Shared faction state authoritative; hide tactical details if necessary |
| DR-04 | Contracts & Bounties | P4 / 4 | `GET /api/v1/contracts`, `POST /api/v1/contracts`, `POST /api/v1/contracts/:id/accept` | Job board, escrow and dispute UI | Existing jobs system, economy/ledger, completion receipts | Idempotent escrow, no negative balance, refund/dispute and abuse controls |
| DR-05 | Seals & Achievements | P3 / 3 | `GET /api/v1/me/achievements`, `GET /api/v1/achievements/catalog` | Badge cabinet, opt-in public showcase | Inspect actual seal/award sources; verified game triggers | Recognition only; no staff rights; no fabricated historical grants |
| DR-06 | Finance Dashboard | P1 / 1 | `GET /api/v1/me/finance/summary`, `GET /api/v1/me/finance/transactions` | Private balance, charts, sales income | Existing bank agent + exchange receipts | Read-only initially, UUID ownership, no second balance ledger |
| DR-07 | Settlements & Property | P4 / 4 | `GET /api/v1/settlements`, `GET /api/v1/me/plots`, gated claim writes | Settlement directory and member controls | DuneProtect region claims, DuneCore faction rules | Overlap prevention, world-scoped permissions, audit and rollback |
| DR-08 | Planetary Events | P2 / 2 | `GET /api/v1/events/planetary` | Planet event feed and status | DuneTerrain spice blows, sandstorms and other real event hooks | Verified timestamps, expiries, rate-limited updates; don't expose hidden coordinates |
| DR-09 | Elections & Landsraad | P2 / 2 | `GET /api/v1/elections`, `GET /api/v1/landsraad/proposals`; voting only after review | Candidate profiles, results, decrees | Existing faction elections and imperial offices | One verified UUID per eligible vote, eligibility rules, audit and anti-replay |
| DR-10 | Exploration Journal | P3 / 3 | `GET /api/v1/me/exploration` | Private discovery log, optional public achievements | DuneTerrain/DuneCore discovery events | Keep hidden sietch coordinates private; no retroactive unverified claims |
| DR-11 | Notification Centre | P1 / 1 | `GET /api/v1/me/notifications`, `POST /api/v1/me/notifications/:id/read` | Inbox, preferences and badges | Events from exchange, bank, tickets, elections and server | Durable event IDs, deduplication, privacy and per-channel opt-in |
| DR-12 | Event Calendar | P2 / 2 | `GET /api/v1/calendar/events`, `POST /api/v1/calendar/events/:id/rsvp` | Calendar, timezone display, RSVP | Event coordinator hooks and in-game announcements | Capacity, permissions, cancellation and timezone correctness |

These endpoints are **planned**, not claims of existing live routes.

## Detailed integration sequencing
1. Inventory current deployed DuneHub code, Central API and plugin repos; record schema ownership and available events; baseline backup/restore.
2. Build a read-only player identity/profile adapter using linked UUID; do not alter existing login.
3. Adapt the existing Exchange listing API and actual completed sale receipts into normalized read models; keep in-game trade confirmation unchanged.
4. Connect existing private bank agent to the finance read model, revalidate session and linked UUID after I/O.
5. Introduce an outbox/event bridge with durable event IDs for notifications; retry without duplicate deliveries.
6. Connect faction/invasion and elections read models, with authority remaining in game.
7. Add calendar and planetary events; then achievement and exploration streams.
8. Enable escrow and settlement mutations last, behind owner-approved feature flags and reconciliation tests.

## Acceptance and release checklist
- Existing balances, bank history, items, shared inventory, separate lobby inventory and per-world ender chests unchanged.
- Existing Exchange listings, order status and sale history preserved; no double settlement or duplicate payment.
- Website ranks, department assignments and LuckPerms managed groups stay separate; political and House groups never deleted by sync.
- Existing elections, Emperor and faction leaders retain their authority and history.
- No leaked bank balances, support tickets, player private coordinates or unverified player UUID lookups.
- Every endpoint has auth/authorization, contract and failure-path tests, pagination/rate limits, idempotency where writes occur, and observability.
- Staging runs against realistic sanitized data; deployment requires green CI, backup, rollback rehearsal and explicit activation.
- Public website layout and existing URLs remain available; gradual opt-in pages and navigation only.

## Milestones (relative, no promised calendar dates)
- **M0:** integration inventory, green CI and safe API contracts.
- **M1:** Passport + Exchange catalogue/price history + Finance read views.
- **M2:** Notifications + Faction War Room + Elections read views + Event Calendar + Planetary Events.
- **M3:** Seals/Achievements + Exploration Journal.
- **M4:** Contracts/escrow + Settlements/claims with audited writes.
- **M5:** final operational review, gradual rollout, telemetry and rollback verification.

## Current implementation status
This file is a development roadmap. Some Central API planners and DuneHub staging adapters already exist, but no assertion is made that these twelve services are deployed or connected. Verify each against the actual live implementation before promoting.
