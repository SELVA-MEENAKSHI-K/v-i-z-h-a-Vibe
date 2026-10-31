# Deploying VizhaVibe to Render

VizhaVibe is a Next.js 14 (App Router) app backed by Prisma + PostgreSQL. This
guide covers a production deploy on [Render](https://render.com).

## 1. Provision a PostgreSQL database

Render's web-service filesystem is **ephemeral**, so SQLite would lose all data
on every deploy. A managed Postgres is required.

1. In the Render dashboard: **New +** → **PostgreSQL**.
2. Pick a name/region/plan and create it.
3. Open the database → copy the **Internal Database URL** (used by services in
   the same Render region). It looks like:
   `postgresql://user:password@host:5432/dbname`
4. Append the schema parameter for Prisma:
   `postgresql://user:password@host:5432/dbname?schema=public`

## 2. Create the Web Service

1. **New +** → **Web Service** → connect the GitHub repo
   (`SELVA-MEENAKSHI-K/v-i-z-h-a-Vibe`).
2. Environment: **Node**.
3. Set the commands below.

### Build Command

```
npm install && npm run render-build
```

`render-build` (in `package.json`) runs, in order:

```
prisma generate && prisma migrate deploy && next build
```

- `prisma generate` — generates the Prisma Client for the Postgres schema.
- `prisma migrate deploy` — applies committed migrations (`prisma/migrations/`)
  to the production database. This is the correct production strategy — it only
  applies existing migrations and never resets data. We do **not** use
  `prisma db push` in production.
- `next build` — builds the Next.js production bundle.

### Start Command

```
npm run start
```

(which runs `next start`)

## 3. Environment variables

Add these in the service's **Environment** tab. See `.env.example` for the full
annotated list. At minimum:

| Variable            | Notes                                                        |
| ------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`      | The Postgres Internal URL from step 1 (with `?schema=public`) |
| `NEXT_PUBLIC_APP_URL` | Your Render service URL, no trailing slash                 |
| `AUTH_SECRET`       | Long random value (`openssl rand -hex 32`)                   |

Optional feature keys (Geoapify, Firebase Google sign-in, OpenAI, admin token,
email) are documented in `.env.example`. Features stay disabled with a clear
status message when their keys are absent — nothing is faked.

**Never commit real secrets.** `.env` and `.env.local` are gitignored.

## 4. Seed the first admin (one-time, optional)

Public signup can never create an admin. To create the initial admin account,
set `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` and run the seed once
(e.g. via a Render Shell): `npm run seed`.

## Local development

- **Local Postgres:** set `DATABASE_URL` to your local Postgres and create new
  migrations with `npm run prisma:migrate` (`prisma migrate dev`).
- **Apply existing migrations without creating new ones:**
  `npm run prisma:migrate:deploy`.
- **Local SQLite (zero-config):** change the datasource `provider` to `sqlite`
  in `prisma/schema.prisma` and set `DATABASE_URL="file:./dev.db"`. Do not
  commit that change — production uses `postgresql`.

## Migrations

The initial schema lives in `prisma/migrations/20260101000000_init/`. Commit all
migration folders. On each deploy, `prisma migrate deploy` applies any new,
committed migrations to the production database.
