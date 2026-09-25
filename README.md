# Bookly

Bookly is a React/Vite frontend and Express API for service-business bookings.

## Run on Replit

1. Install dependencies with `npm install`.
2. Initialize the workspace PostgreSQL database with `npm run db:migrate`.
3. Start the **Start application** workflow, or run `npm run dev`.

The frontend runs on port 5000 and proxies API requests to Express on port 3000. Replit supplies `DATABASE_URL`; the existing workspace `SESSION_SECRET` signs local authentication tokens unless `JWT_SECRET` is set. Do not commit secrets.

Run `npm run check` for a frontend build and read-only API smoke check. To serve a production build locally, run `npm run build` and then `npm start`.

Stripe, SendGrid, and Twilio credentials are optional for startup. Their live payment and messaging features require configuration before use. `npm run db:seed` adds sample data **only in development**; do not use the shared sample login on a public site.

## Admin access and plans

After `npm run db:migrate`, run `npm run admin:setup` in the terminal to create or reset a development superadmin. The command prints a one-time random password; copy it when shown, then use the normal **Log in** page. Admins are directed to `/admin`. Run the command again to rotate that password and invalidate prior login sessions. In production, set `ADMIN_EMAIL` for the command and ensure `JWT_SECRET` or `SESSION_SECRET` is configured. Never commit or share the printed password.

Admins can assign Starter (`free`), Growth (`pro`), and Studio (`business`) plans to businesses and suspend them. These are **manual plan assignments**, not recurring subscriptions or charges. Prices and payment-provider billing need to be configured before offering paid subscriptions.