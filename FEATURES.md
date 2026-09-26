# Growth features (Phase 1–3)

Phase 1–3 added the following:

- **Self-service manage links:** `/manage/:token` lets customers reschedule or cancel, with cancellation-window policy enforcement.
- **Deposits and no-show fees:** A risk-based deposit is stored on each appointment (`deposit_amount` and `deposit_status`).
- **Gift cards:** Businesses can issue cards, check balances, and redeem them. The page is at `/gift-cards`.
- **Audit log:** Business actions are recorded and shown at `/audit`.

## Setup
1. Apply the migration with `node server/db/applyGrowthMigration.js`. You can also run `psql $DATABASE_URL -f server/db/migrations/003_growth_features.sql`.
2. Mount the API in `server/index.js`, after the other routes:
   ```js
   import featuresRouter from './routes/features.js';
   app.use('/api/features', featuresRouter);
