# Generated project

Built with Zipy Codes and prepared with a browser-based project preflight targeting **Replit**. Review any notes below, then run the project in your chosen environment.

## Run it
```bash
npm install
npm start
```

## Environment variables
Copy `.env.example` to `.env` and fill these in:

- `APP_URL`
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`
- `SENDGRID_API_KEY`
- `SMOKE_TEST_PORT`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TEST_DATABASE_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## Destination: Replit
Checks port/host binding and the start script. Push this project to Replit through GitHub import, its CLI, or a manual upload, following the platform's normal deploy flow.

## Notes from Zipy Codes
- Missing local imports: db/index.js, db/schema.js, config.js
- Server should read its port from process.env.PORT instead of a hardcoded number

## Continue building
Open this in [Replit](https://replit.com/new), or push it to GitHub and import it from there. Other destinations accept the same clean ZIP for manual upload.
