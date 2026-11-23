<div align="center">

# MentorLagbe API: Backend Service

### Secure Authentication. Seamless Payments. Built for MentorLagbe.

**The backend API behind MentorLagbe. It manages authentication, tuition listings, Stripe payments and image uploads, and stores data in MongoDB.**

<img src="https://skillicons.dev/icons?i=nodejs,express,mongodb,vercel,git,github,npm&perline=7" alt="Tech stack icons" width="420" />

<br />

<a href="https://mentorlagbe-server-sand.vercel.app/api/health">
  <img src="https://img.shields.io/badge/Live_API-Health_Check-0F766E?style=for-the-badge&labelColor=1F2937&logo=vercel&logoColor=white" alt="Live API" />
</a>
&nbsp;
<a href="https://github.com/NSniha/mentorlagbe-server/issues/new">
  <img src="https://img.shields.io/badge/Report-a_Bug-DC2626?style=for-the-badge&labelColor=1F2937&logo=github&logoColor=white" alt="Report a Bug" />
</a>
&nbsp;
<a href="https://github.com/NSniha/mentorlagbe-server/issues/new">
  <img src="https://img.shields.io/badge/Request-a_Feature-2563EB?style=for-the-badge&labelColor=1F2937&logo=github&logoColor=white" alt="Request a Feature" />
</a>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live API](#live-api)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Local Demo Mode](#local-demo-mode)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Production Setup](#production-setup)
- [Verify the Deployment](#verify-the-deployment)
- [Contributing](#contributing)
- [Author](#author)

---

## Overview

MentorLagbe API is the backend service that powers the MentorLagbe platform. It is responsible for user authentication and sessions, public tuition listings, Stripe-powered payments for the Pro plan, and image uploads, with all application data stored in MongoDB.

The API is intentionally separate from the user interface. The web application lives in the companion repository, [mentorlagbe-client](https://github.com/NSniha/mentorlagbe-client), and communicates with this service over HTTP.

## Live API

The API is deployed on Vercel:

**https://mentorlagbe-server-sand.vercel.app**

You can confirm that it is running by opening the [health check endpoint](https://mentorlagbe-server-sand.vercel.app/api/health).

## Key Features

- **Secure authentication** using Better Auth together with JWT, with separate secrets for each.
- **Public tuition listings** served through a query-friendly endpoint that supports result limits.
- **Stripe payments** with a verified webhook flow that activates the Pro plan only after a payment is confirmed.
- **Direct image uploads** through ImgBB when an API key is configured.
- **Local demo mode** that runs without a database, using sample data from `.data/demo.json`, so the API can be tested instantly.
- **Built-in health check** that reports whether the API is running against MongoDB.
- **Smoke test script** that verifies the main API workflows against a running server.
- **Environment-driven configuration**, keeping secrets out of the codebase.

## Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,express,mongodb,npm,vercel,git,github&perline=7" alt="Technologies used in MentorLagbe API" width="490" />
</p>

| Category | Technology | Purpose |
| --- | --- | --- |
| Runtime | [Node.js](https://nodejs.org/) | JavaScript runtime for the server |
| Framework | [Express](https://expressjs.com/) | HTTP server and routing |
| Database | [MongoDB](https://www.mongodb.com/) | Persistent data storage |
| Authentication | [Better Auth](https://www.better-auth.com/) and JWT | User authentication and session security |
| Payments | [Stripe](https://stripe.com/) | Checkout and webhook-based payment confirmation |
| Image uploads | [ImgBB](https://imgbb.com/) | Hosted image storage |
| Hosting | [Vercel](https://vercel.com/) | Deployment and hosting |

## Architecture

```
  MentorLagbe Client  (Next.js, separate repository)
          |
          |  HTTP requests
          v
  MentorLagbe API  (Express, this repository)
          |
          |---> MongoDB   data storage
          |---> Stripe    payments and webhooks
          |---> ImgBB     image uploads
```

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm (comes with Node.js)
- A MongoDB database (optional for local development, see [Local Demo Mode](#local-demo-mode))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/NSniha/mentorlagbe-server.git
   cd mentorlagbe-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file to create your local environment file.

   macOS / Linux:

   ```bash
   cp .env.example .env
   ```

   Windows (Command Prompt):

   ```bash
   copy .env.example .env
   ```

   Then open `.env` and fill in the values described in [Environment Variables](#environment-variables).

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The API runs on [http://localhost:5000](http://localhost:5000).

5. **Connect the client (optional)**

   To use the web interface, run [mentorlagbe-client](https://github.com/NSniha/mentorlagbe-client) and set its `NEXT_PUBLIC_API_URL` to `http://localhost:5000`.

## Local Demo Mode

You do not need a database to try the API locally. If `MONGODB_URI` is not set, the server starts in **local demo mode**:

- Data is loaded from `.data/demo.json`.
- Stripe payments are disabled.

To verify the API workflows, start the server with `npm run dev`, then run the smoke tests in a second terminal:

```bash
npm run smoke
```

## Environment Variables

Keep all values in your local `.env` file or in your hosting dashboard. Never commit secrets to the repository.

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Production | MongoDB connection string. When omitted, the API starts in local demo mode |
| `DB_NAME` | Production | Name of the production database |
| `BETTER_AUTH_SECRET` | Production | Secret used by Better Auth. Use at least 32 characters |
| `JWT_SECRET` | Production | Secret used to sign JWTs. Use at least 32 characters and keep it different from `BETTER_AUTH_SECRET` |
| `CLIENT_URL` | Production | Origin of the deployed client, with no path |
| `SERVER_PUBLIC_URL` | Production | Origin of the deployed API |
| `STRIPE_SECRET_KEY` | When checkout is enabled | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | When checkout is enabled | Signing secret for the Stripe webhook |
| `IMGBB_API_KEY` | When image uploads are enabled | ImgBB API key for direct image uploads |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the API in development mode on port `5000` |
| `npm start` | Starts the API for production hosts that run a Node.js process |
| `npm run smoke` | Runs smoke tests against a running demo server to verify the main API workflows |

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check. Reports that the API is running and which data mode it is using |
| `GET` | `/api/tuitions?limit=6` | Returns public tuition listings, limited by the `limit` query parameter |
| `POST` | `/api/payments/webhook` | Receives Stripe webhook events and activates the Pro plan after a verified payment |

## Project Structure

```
mentorlagbe-server/
├── scripts/              # Utility scripts
├── src/                  # Application source code
├── .gitignore
├── package.json          # Dependencies and scripts
├── package-lock.json
└── README.md
```

## Production Setup

Before deploying, make sure the following are in place:

1. Set `NODE_ENV=production` if your host does not set it automatically.
2. Provide the production values for `MONGODB_URI` and `DB_NAME`.
3. Generate two separate secrets of at least 32 characters for `BETTER_AUTH_SECRET` and `JWT_SECRET`.
4. Set `CLIENT_URL` to the deployed client origin and `SERVER_PUBLIC_URL` to the deployed API origin, both without a path.
5. If checkout is enabled, add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
6. If direct image uploads are enabled, add `IMGBB_API_KEY`.
7. Install dependencies with `npm install` and start the process with `npm start`.

## Verify the Deployment

After deploying, run through this checklist:

1. Open `https://YOUR-API/api/health` and confirm that `ok` is `true` and `mode` is `mongodb`.
2. Open `https://YOUR-API/api/tuitions?limit=6` and confirm that public listings load from the production database.
3. Sign in from the deployed client and reload its dashboard to confirm that the session persists.
4. When using Stripe test mode, configure the webhook at `/api/payments/webhook` and complete one test checkout. The Pro plan should activate after the payment is verified.

## Contributing

Contributions, issues and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request.

## Author

**Nobonita Saha**
Front-End Developer

- GitHub: [@NSniha](https://github.com/NSniha)
- LinkedIn: [Nobonita Saha](https://www.linkedin.com/in/nobonita-saha-niha-04b501214/)

---

<div align="center">

If you find this project useful, consider giving it a star.

</div>
