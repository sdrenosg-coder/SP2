# Growth features (Phase 1–3)

Phase 1–3 added the following:

- **Self-service manage links:** `/manage/:token` lets customers reschedule or cancel, with cancellation-window policy enforcement.
- **Deposits and no-show fees:** A risk-based deposit is stored on each appointment (`deposit_amount` and `deposit_status`).
- **Gift cards:** Businesses can issue cards, check balances, and redeem them. The page is at `/gift-cards`.
- **Audit log:** Business actions are recorded and shown at `/audit-log`.

All business-scoped routes (`/api/features/businesses/:bid/...`) require the caller to be
logged in as a member of that business — `:bid` is checked against the session, not trusted
from the URL. Manage links (`/api/features/manage/:token`) are opaque random tokens hashed
at rest, not JWTs, so a leaked signing secret can't be used to forge one.

## Setup
Already wired in for this project: `npm run db:migrate` applies
`server/db/migrations/003_growth_features.sql` (idempotent, tracked in `schema_migrations`),
and `server/index.js` mounts the router at `/api/features`.
