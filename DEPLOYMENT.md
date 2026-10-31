# Deploying VizhaVibe to Render

VizhaVibe is a Next.js 14 (App Router) app backed by Prisma + PostgreSQL. This
guide covers a production deploy on [Render](https://render.com).

> ## ⚠️ Architecture: this is ONE app, not a frontend + separate API
>
> VizhaVibe is a **single Next.js App Router application**. The pages **and**
> every `/api/*` route (plan creation, roadmap/event generation, venues,
> vendors, auth) live in the **same deployment** and are called with **relative
> URLs** (e.g. `fetch("/api/plans/<token>/roadmap")`). There is no separate
> "backend URL", no `NEXT_PUBLIC_API_URL`, and **no CORS** involved — the API is
> same-origin by construction.
>
> **Deploy the whole app to ONE host.** Render (Node web service) is recommended
> because the app needs a persistent Node server + Postgres migrations. If you
> also put a copy on Vercel, deploy the *same* Next.js app there (Vercel runs the
> API routes as serverless functions) — do **not** try to serve a static
> frontend on Vercel that points its `/api/*` calls at Render. With relative
> URLs those calls would hit Vercel's own origin, and if that deployment lacks
> the server runtime or env vars, **event generation returns 500 while the page
> shell still loads** — the exact "site opens but generation never completes"
> symptom.
>
> Whichever host serves the app must have all **Required** env vars from the
> table below, and its database must be **migrated and seeded** (see §4).

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

## 4. Seed the database (REQUIRED — event generation depends on it)

`prisma migrate deploy` creates the **tables** but leaves them **empty**. The
app's event catalog (`EventCategory` / `EventType`) must be **seeded**, or:

- plan creation throws "Unknown event type", and
- there is no demo plan to open, so **event generation never completes**.

The seed is **idempotent** (upserts by stable keys; skips the demo plan if it
exists), so it is safe to run on every deploy.

Run it **once after the first deploy** (and after any deploy that adds catalog
entries), from a **Render Shell** on the web service:

```
npm run render-seed      # = prisma db seed → prisma/seed.ts
```

To also create the initial admin in the same run, set `ADMIN_INITIAL_EMAIL` and
`ADMIN_INITIAL_PASSWORD` first (public signup can never create an admin).

> Why not bake the seed into the Build Command? Because the database may not be
> reachable during the build step, which would fail the whole deploy. Seeding is
> a data step, kept separate from the build. If your Render plan supports a
> **Pre-Deploy Command**, you can set it to `npm run render-seed` to automate it.

## 5. Verify the deployment (readiness probe)

After deploying, confirm the app is actually ready (not just "up"):

```
GET https://<your-app-host>/api/health?deep=1
```

- `200` with `ready: true` → DB reachable, migrated, **and seeded**. Generation
  will work.
- `200` with `ready: false` → DB reachable but **not seeded** → run §4.
- `503` → DB **unreachable or not migrated** → check `DATABASE_URL` and that
  `prisma migrate deploy` ran (it's part of `render-build`).

The plain `GET /api/health` (no `?deep=1`) is a fast liveness check and does not
touch the database.

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
