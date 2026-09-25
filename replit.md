# Running Bookly on Replit

- This is an Express API and React/Vite frontend. Run the **Start application** workflow (`npm run dev`) for the development preview on port 5000. The API runs internally on port 3000 and Vite proxies `/api` and `/socket.io` to it.
- Dependencies: `npm install`. To initialize the development PostgreSQL schema, run `npm run db:migrate` once. The project uses the workspace-provided `DATABASE_URL`.
- Authentication signing uses `JWT_SECRET` if supplied, otherwise the workspace `SESSION_SECRET`. Do not put secrets in `.env` or commit them.
- Stripe, SendGrid, and Twilio settings are optional; related real payment and messaging integrations require their own credentials before use.
- For a production-style local run, run `npm run build` followed by `npm start`; this serves the built frontend from Express. The development workflow is the recommended Replit preview.
- Run `npm run check` for a build and a read-only API startup check. Demo seeding is development-only.