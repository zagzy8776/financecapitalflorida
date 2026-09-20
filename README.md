# Finance Capital Florida

Finance Capital Florida is a standalone financial services web application with its own brand, visual identity, and customer/admin experience. It is a separate project from the Rubicon Capital application.

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Node.js + Express + JWT (Vercel serverless via `/api`)
- **Database**: Aiven for PostgreSQL

## Features

- Multi-currency accounts (GBP / USD / EUR)
- Customer dashboard with balances, deposits, withdrawals, and transfers
- Full Admin Control Centre:
  - Overview and assets by currency
  - User management (lock/unlock)
  - Account management (lock/unlock, create accounts)
  - Transaction monitoring
  - Account request approval queue
  - Complete activity / audit log
- Atomic transfers with full audit trail
- Role-based access (admin / user)

## Setup (local)

1. Copy `.env.example` to `.env` and fill in real values (especially `DATABASE_URL` / `PGPASSWORD` and `JWT_SECRET`).
2. Install dependencies:

```bash
npm install
cd server && npm install && cd ..
```

3. Run both frontend and backend:

```bash
# Terminal 1 - API
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

Open http://localhost:5173

### Aiven connection

The app reads either:

- `DATABASE_URL` (recommended single string), or
- split vars: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

SSL is handled with `sslmode=no-verify` + `rejectUnauthorized: false` so it works cleanly on Vercel serverless (Aiven CA not required at runtime).

**Never commit real passwords.** Set them only in local `.env` and in the Vercel dashboard.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. In **Project → Settings → Environment Variables** add at least:

| Name | Example / notes |
|------|-----------------|
| `DATABASE_URL` | `postgres://avnadmin:***@credit-credit.k.aivencloud.com:22974/defaultdb?sslmode=require` |
| `JWT_SECRET` | long random string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | optional env-based admin |
| `OWNER_EMAIL` | optional auto-admin on register |
| `RESEND_API_KEY` | if you want email |
| `EMAIL_FROM` / `SUPPORT_EMAIL` / `APP_URL` | branding + links |
| `CRON_SECRET` | for external cron calls |

4. Deploy. Migrations run in the background on first API hit (see `api/index.js`).

## First Admin

1. Sign up normally through the UI.
2. Call the promote endpoint (or run SQL on Aiven):

```bash
curl -X POST https://YOUR-VERCEL-URL/api/admin/promote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Or in the database:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## Security Notes

- Never commit `.env` or any real database password.
- Change `JWT_SECRET` in production.
- All money movements use database transactions.
- Locked accounts cannot transact.
- Aiven connection limit is low on free/starter plans — the pool uses `max: 1` on Vercel.

## Project Separation

**Finance Capital Florida and Rubicon Capital are separate applications.** This repo is Finance Capital Florida only.
