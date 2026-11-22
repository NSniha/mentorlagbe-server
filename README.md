# MentorLagbe API

Express, MongoDB, Better Auth, JWT, Stripe and ImgBB. Copy `.env.example` to `.env`, then `npm install && npm run dev`. Without `MONGODB_URI`, local test mode runs from `.data/demo.json` and Stripe payments are disabled. Production requires the MongoDB URI, Better Auth secret and JWT secret. Run `npm run smoke` with the demo server already running to verify the API workflows.

**Do not commit `.env` or any API keys.** See the parent README and DEPLOY.md.
