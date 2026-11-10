# DuneRealms growth & supporter programme — implementation backlog
Prepared 2026-11-10. No production deployment.

## Phase A — attract and retain visitors
1. **Chronicle**: weekly public digest built from verified game election, invasion, event, settlement and achievement events. The pure builder is implemented in `src/chronicle.ts`; next: authenticated event ingest, privacy review, durable storage, scheduled publishing and editorial approval.
2. **Shareable Player Passport**: explicit opt-in with separate visibility toggles for House and achievements. Projection implemented in `src/public-passport.ts`; next: real linked UUID lookup, account privacy settings, public profile route and share metadata.
3. **Settlement showcase and event calendar**: reuse planned settlement and calendar models; require owner consent, report/moderation, and event RSVPs. No public hidden coordinates.
4. **Creator programme**: manual-review application validation in `src/creator-program.ts`; next: rate-limited authenticated submission, moderation queue, creator terms and attribution tracking.
5. **Existing Marketplace**: retain real listings and in-game transactions; enhance catalogue, completed-sale price history and favourites, not a second market.

## Phase B — sustainable supporter revenue
1. Audit existing rank shop checkout and fulfilment. Keep it selling **Minecraft ranks**, not kits or Dunemarks.
2. Add a clear comparison of supporter tiers, duration, included cosmetic benefits, refund/support information and a link to existing checkout.
3. Optional monthly memberships only after payment provider supports recurring billing, cancellation, receipts and renewal failure handling.
4. Add supporter profile frames, badges and decorative recognition only if compatible with current Minecraft commercial-use rules and the project's IP position. Do not sell political influence, voting power, staff privileges, powerful items or exclusive resource advantages.
5. Community sponsorships must be clearly disclosed and kept separate from player moderation and rankings.
6. Record conversion metrics with privacy-friendly aggregation and consent where required; no fabricated revenue figures.

## Dependencies
- Finish and test the Central API authentication, game event bridge and existing bank/Exchange integration.
- Keep the verified House, Office, staff and LuckPerms authorization domains independent.
- Review legal/IP and Minecraft monetization compliance before charging for new benefits.
- No migration of player balances, existing rank purchases or inventories without a verified rollback path.

## Release checklist
- Green tests and build; security and privacy review.
- Real event sources and source identifiers confirmed.
- No unverified Chronicle entries; no exposure of private Passport fields.
- No automatic creator acceptance or permission grants.
- Existing rank shop, Exchange and bank stay operational.
- Staging smoke tests, database backup, rollback plan and explicit production approval.
