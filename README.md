# Bookly

Bookly is a React/Vite frontend and Express API for service-business bookings.

## Run on Replit

1. Install dependencies with `npm install`.
2. Initialize the workspace PostgreSQL database with `npm run db:migrate`.
3. Start the **Start application** workflow, or run `npm run dev`.

The frontend runs on port 5000 and proxies API requests to Express on port 3000. Replit supplies `DATABASE_URL`; the existing workspace `SESSION_SECRET` signs local authentication tokens unless `JWT_SECRET` is set. Do not commit secrets.

Run `npm run check` for a frontend build and read-only API smoke check. To serve a production build locally, run `npm run build` and then `npm start`.

Stripe, SendGrid, and Twilio credentials are optional for startup. Their live payment and messaging features require configuration before use. `npm run db:seed` adds sample data **only in development**; do not use the shared sample login on a public site.