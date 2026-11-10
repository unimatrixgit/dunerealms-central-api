# DuneRealms bank and existing rank shop: integration boundaries

## Confirmed requirements

- Bank: Dunemarks for in-game accounts; personal balance and transaction history are read through DuneHub's existing authenticated bank handler.
- Existing shop: **ranks only**. Do not add item/kit sales. Do not accept Dunemarks for shop purchases.
- Shop payment provider and purchase storage must be read from the **actual deployed DuneHub implementation** before connecting a checkout or a payment webhook. The public `unimatrixgit/mca` website snapshot does not establish which shop provider is currently deployed.

## Implemented in this repository

- `src/rank-shop.ts` provides a pure fulfilment boundary for rank-only orders.
- The caller must independently verify payment with the trusted provider and verify the buyer's linked Minecraft UUID. The `paymentState` field alone is not proof.
- The caller supplies a durable store that atomically claims order IDs and unique payment references, and a game-rank grant adapter that deduplicates by order ID.
- No real checkout, payment, bank debit, Minecraft rank grant, or web endpoint is enabled by this module.
- `tests/rank-shop.test.ts` tests accepted payments, rejected payments, rejected ranks, account-link mismatch, idempotent repeated orders, and pending delivery.

## Production implementation still required

1. Identify the existing shop's actual payment provider, webhook verification method, database tables and rank catalog.
2. Implement a durable database-backed `RankDeliveryStore` with unique order/payment-reference constraints and an auditable delivery state machine.
3. Integrate with the existing Minecraft rank manager using a server-side signed request and idempotency key. Confirm actual game acknowledgement before marking delivered.
4. Expose purchase history only through the authenticated account, without accepting user-supplied account IDs.
5. Test refund/revocation and chargeback policy separately; do not assume automatic rank revocation.
6. Release via a staged, reversible DuneHub deployment only after the existing DuneHub test suite is reconciled.

The shop and Dunemarks bank remain strictly separate.
