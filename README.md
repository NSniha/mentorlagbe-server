# MentorLagbe API

Express, MongoDB, Better Auth, JWT, Stripe and ImgBB. Copy `.env.example` to `.env`, then `npm install && npm run dev`. Without `MONGODB_URI`, local test mode runs from `.data/demo.json` and Stripe payments are disabled. Production requires the MongoDB URI, Better Auth secret and JWT secret. Run `npm run smoke` with the demo server already running to verify the API workflows.

**Environment values belong in the local `.env` file or the hosting dashboard.**

## Production setup

| Configuration | Value |
| --- | --- |
| `MONGODB_URI` and `DB_NAME` | The production MongoDB connection and database name |
| `BETTER_AUTH_SECRET` and `JWT_SECRET` | Separate values of at least 32 characters |
| `CLIENT_URL` | The deployed client origin, with no path |
| `SERVER_PUBLIC_URL` | The deployed API origin |
| `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` | Stripe API and webhook credentials when checkout is enabled |
| `IMGBB_API_KEY` | The image service key when direct image uploads are enabled |

From a fresh checkout, install dependencies with `npm install`. For hosts that run a Node.js process, start it with `npm start`. Configure `NODE_ENV=production` if your host does not set it.

## Verify the deployment

1. Open `https://YOUR-API/api/health` and check that `ok` is `true` and `mode` is `mongodb`.
2. Open `https://YOUR-API/api/tuitions?limit=6` to verify that public listings load from the production database.
3. Sign in from the deployed client and reload its dashboard to check that the session persists.
4. When using Stripe test mode, configure the webhook at `/api/payments/webhook` and test one checkout. The Pro plan should activate after a verified payment.

For the local demo data, start the API with `npm run dev` on port 5000 and run `npm run smoke` in another terminal.
