# VizhaVibe 🪔

A **3D-first, immersive event-planning platform** for events in **Madurai, Chennai, and Bangalore**. Instead of browsing a grid of venue cards, you step into an interactive 3D venue, arrange seating and decor, and get AI-assisted themes, menus, budgets, and timelines — tuned for Tamil, Kerala, Telugu, Kannada, and North Indian styles.

> **Demo-first:** The full core journey works with **no account and no API keys**. Sample venues and demo AI output are always clearly labeled and never mixed with live data.

---

## Key features

- **Accounts & sessions**: email/password sign-up and log in, plus **"Continue with Google"** (Firebase Authentication, verified server-side). Secure scrypt password hashing, signed HTTP-only session cookies, password reset, and role-based access (`USER` / `ADMIN`). The demo journey still works without an account.
- **Admin dashboard** (`/admin`, admins only): a tabbed, read-mostly view over the whole database — Users, Events, AI Plans, Venues, Budgets, Vendors, Themes & Food, and Timelines — with summary cards, search, pagination, and user block/unblock. Every admin API route is enforced server-side; a normal user can never reach admin data by editing the frontend.
- **3D venue explorer** (React Three Fiber + Three.js): orbit/pan/zoom, preset camera views (reset, top, stage, entrance), drag-to-reposition tables/stage/decor, guest-count-aware auto-fill, and a live "seats placed vs guest count" readout.
- **Accessible 2D plan** alternative (SVG, keyboard-focusable) and an automatic fallback for devices without WebGL.
- **Guided setup flow**: category → event type → city/date/guests/budget → style & dietary preferences.
- **Venue discovery** via **Geoapify Places API**, server-mediated, with real-time GPS "near me" search, a 5/10/25/50 km radius, nearest-first sorting, attribution, and explicit "unverified" tags on capacity/pricing/availability. Falls back to **clearly-labeled sample venues** when no key is set.
- **Vendor discovery** (photography, catering, decoration, makeup, music, invitations, transport, equipment) via the same **Geoapify** integration, scoped to the selected city (Madurai first). Live listings carry source attribution and show **"Contact vendor for a confirmed quote"** — Geoapify/OSM has no prices or ratings, so none are invented. Each category gets its own on-brand illustration (clearly labeled, never passed off as a real photo), and without a key the page shows **clearly-labeled sample vendors**, never silently faked data.
- **AI planning tools**: themes, decor concepts, regional menus, itemized budget ranges, and a timeline — plus a **context-aware chatbot**. Uses a provider abstraction; defaults to a **deterministic demo mode** when no AI key is configured.
- **8 categories, 40 event types** (exceeds the 30+ requirement), all **data-driven** from one catalog module.
- **Plan summary** with location, date, guests, estimated cost range, selected venue, and outstanding tasks. Every plan has a shareable link.

---

## Technology & architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | One codebase for UI + typed API route handlers; server-only secrets. |
| 3D | **React Three Fiber + @react-three/drei** | Declarative Three.js that fits React state; lazy-loaded so it never blocks first paint or SSR. |
| Styling | **Tailwind CSS** | Fast, consistent, themeable festival palette. |
| Database | **Prisma + PostgreSQL** (prod) / **SQLite** (local demo) | Postgres in production (Render); flip one line for a zero-config local SQLite demo (see below). |
| Auth | **Custom sessions + Firebase (Google)** | scrypt hashing, signed HTTP-only cookies, server-side Firebase ID-token verification. No third-party auth SaaS lock-in. |
| Validation | **Zod** | Shared request/response schemas for every endpoint. |
| AI | **Provider abstraction** (`demo` / `openai`) | Core logic never binds to one vendor; server-side calls only. |
| Venues & vendors | **Server-mediated Geoapify Places** | Keeps the key off the client; circle filter + proximity bias; caching. |

Design decisions:

- **Optional accounts, frictionless demo.** The core journey works without an account (plans belong to a shared demo user, addressed by an unguessable `shareToken`). Signing in with email/password or Google unlocks saved, owned plans and the admin area. Auth is first-party: scrypt password hashing and signed HTTP-only session cookies, with Google sign-in verified server-side via the Firebase ID token — the server never trusts a client-supplied role or identity.
- **Single app, not a split frontend/backend.** Pages and every `/api/*` route live in one Next.js deployment and are called with **relative** URLs — there is no separate backend host and no CORS. Deploy the whole app to one host (see [Deployment](#deployment-render--postgresql)).
- **3D is lazy-loaded** with `next/dynamic({ ssr:false })` and shows loading/empty/error/unsupported states.
- **Illustrative geometry only.** The planner never claims to be an architectural replica; a disclaimer is always visible.

---

## Prerequisites

- **Node.js 18.18+** (or 20+) and npm.

## Installation

```bash
cd VizhaVibe
npm install
cp .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
```

The schema targets **PostgreSQL** (production). For the quickest **local** demo, switch to SQLite: in `prisma/schema.prisma` set `provider = "sqlite"` and in `.env` set `DATABASE_URL="file:./dev.db"`. (Leave the rest of `.env` as-is for full demo mode — sample venues/vendors, demo AI.) Don't commit the SQLite flip.

## Database: migrate & seed

**Local (SQLite):**

```bash
npm run db:setup       # prisma db push + seed
```

**Postgres (dev or prod):**

```bash
npm run prisma:migrate:deploy   # apply committed migrations
npm run seed                    # seed the catalog, samples, demo plan, first admin
```

Seeding creates:

- The full event catalog (8 categories / 40 types).
- Sample venues/vendors for all three cities.
- A **sample plan** with a 3D layout, budget, menu, and timeline at **`/plan/demo-tamil-wedding`**.
- The first **admin** account when `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` are set.

The seed is **idempotent** — safe to run repeatedly.

## Local development

```bash
npm run dev
# open http://localhost:3000
```

## Build

```bash
npm run build   # runs `prisma generate` then `next build`
npm start
```

---

## Configuring Geoapify Places (live venues)

1. Register at the [Geoapify MyProjects dashboard](https://myprojects.geoapify.com) — it's free and needs no credit card.
2. Create a **new project**. An **API key** is generated automatically (you can add more under the API Keys section).
3. (Optional but recommended) Restrict the key by **allowed IP addresses / HTTP referrers / origins** in the dashboard.
4. Put the key in `.env`: `GEOAPIFY_API_KEY="your-key"` and restart `npm run dev`.

The key is read **only on the server** (in `src/lib/venues.ts` via `getServerConfig()`), passed to Geoapify's endpoint server-side, and never sent to the browser or included in any API response. The free tier allows up to **3000 requests/day**.

**How search behaves once the key is set:**

- The backend calls Geoapify's Places endpoint `GET https://api.geoapify.com/v2/places` with event-venue `categories` (hotels, catering, leisure, culture, commercial), a `filter=circle:lon,lat,radius` constraint and a `proximity` bias centered on the user's location or the selected city.
- **"Use my location"** passes the browser's GPS coordinates; the **5/10/25/50 km radius** selector sets the circle radius. Results get a haversine **distance** and are sorted **nearest-first**.
- Searching a specific name like **`Arunadu`** is sent as Geoapify's `name` parameter within the search area.
- Typed-city search falls back to fixed center points for **Madurai, Chennai, Bangalore**.
- Results are labeled **Live**. Authorized catalog records (if any) appear alongside, labeled **Verified catalog** / **Not verified**. Sample data only appears when there is no key *and* no catalog record, and is always labeled **Sample data — not live**. The three sources are never silently mixed.
- If the key is missing or Geoapify returns an error, the UI shows a clear message and **never fabricates** live results.

### Data sources at a glance

| Label | Source | What it means | Persisted? |
|---|---|---|---|
| **Live** | Geoapify Places API (OpenStreetMap data) | Fetched live per search; attribution shown. | Only the **provider place ID** + your app data (notes, selection, layout). Live fields are not stored as durable facts. |
| **Verified catalog** | `CatalogVenue` (admin-managed) | Facts from an authorized source with a `sourceUrl` + verification date. Capacity/price shown. | Yes — we are authorized to store these. |
| **Catalog · Not verified** | `CatalogVenue` | Record exists but facts aren't source-confirmed. Capacity/price hidden → "Contact venue to confirm." | Yes, but shown as unverified. |
| **Sample data — not live** | `sampleVenues.ts` | Fictional placeholders for the no-credential demo. | In-memory / demo seed only. |

## Admin-managed venue catalog (authorized storage)

For venue facts VizhaVibe is **authorized** to store (venue-submitted info, or a source whose terms permit storage), use the catalog:

- Model: `CatalogVenue` in `prisma/schema.prisma` — name, venue type, address, city, contacts, website, capacity range, price range, amenities, Place ID, plus **required provenance**: `sourceName`, `sourceUrl`, `verification` (`verified`/`unverified`/`pending`), and `lastVerifiedAt`.
- Add/update via `POST /api/admin/catalog-venues` with header `x-admin-token: $ADMIN_TOKEN`. Writes are **disabled** unless `ADMIN_TOKEN` is set in `.env`. Reads (`GET`) are public and return only `published` records.
- Capacity, price, and amenities are shown **only when `verification = "verified"`**. Otherwise the UI shows **"Contact venue to confirm."**
- Seed templates live in `src/data/maduraiCatalog.ts`. It ships with **no fabricated facts** — one unpublished `pending` template demonstrating the workflow. Fill real records only from a reliable source; never guess.

Example (PowerShell):

```powershell
$body = @{
  name = "Some Authorized Mahal"; venueType = "mahal"; city = "Madurai";
  capacityMin = 200; capacityMax = 800; priceMin = 80000; priceMax = 250000;
  sourceName = "Venue-submitted"; sourceUrl = "https://the-venue.example";
  verification = "verified"; lastVerifiedAt = (Get-Date).ToString("o")
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/admin/catalog-venues `
  -Headers @{ "x-admin-token" = $env:ADMIN_TOKEN; "Content-Type" = "application/json" } -Body $body
```

## Configuring AI (live assistant)

1. Set `AI_PROVIDER="openai"`.
2. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, `OPENAI_BASE_URL` for OpenAI-compatible gateways).

Without a key, `AI_PROVIDER` stays effectively `demo` and all AI features return deterministic, clearly-labeled output. Live calls are server-side only and fall back to demo output on any error.

## Authentication

Email/password works out of the box once `AUTH_SECRET` is set:

- **`AUTH_SECRET`** — signs session cookies and hashes reset tokens. Use a long random value (`openssl rand -hex 32`). In **production the app refuses to sign sessions without it**, so sign-up / log-in return a clear *"temporarily unavailable"* message instead of a silent failure until it is configured.
- Passwords are hashed with **scrypt** (`salt:hash`); the session cookie is `vv_session` (signed, HTTP-only, `Secure` in production).
- The first admin is created by the seed from `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` (public sign-up can never create an admin).

### "Continue with Google" (Firebase Authentication)

The Google button appears **only when the four `NEXT_PUBLIC_FIREBASE_*` values are set** (otherwise the auth card cleanly shows email/password only — no dead button). These are the Firebase **web** config values and are safe for the browser; security is enforced by Firebase Auth plus our **server-side ID-token verification** (`src/lib/firebaseVerify.ts`) — the server independently verifies the Google token before creating a session.

Setup:

1. In the [Firebase console](https://console.firebase.google.com), create/select a project.
2. **Authentication → Sign-in method → enable Google.**
3. **Authentication → Settings → Authorized domains →** add `localhost` and your production domain.
4. **Project settings → Your apps → Web app →** copy the config into these env vars:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
   ```

> `NEXT_PUBLIC_*` values are **inlined at build time**. On a hosted deployment they must be present **when the app is built**, then the host rebuilt — setting them only at runtime will not make the button appear.

Both email/password and Google sign-in ultimately write to the database, so they also require a reachable, migrated database and `AUTH_SECRET`.

## Using PostgreSQL vs SQLite

Production uses **PostgreSQL** (`provider = "postgresql"` in `prisma/schema.prisma`). For a zero-config **local** demo you can switch to SQLite:

1. In `prisma/schema.prisma`, change `provider = "postgresql"` to `provider = "sqlite"`.
2. Set `DATABASE_URL="file:./dev.db"`.
3. Run `npm run db:setup` (push + seed). **Do not commit** this local change — production stays `postgresql`.

To create new Postgres migrations during development, point `DATABASE_URL` at a dev Postgres and run `npm run prisma:migrate`.

## Deployment (Render + PostgreSQL)

VizhaVibe is one Next.js app (pages **and** API). Deploy the whole thing to a single Node host. Full guide: **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**. In short, on [Render](https://render.com):

- **Build Command:** `npm install && npm run render-build` (runs `prisma generate && prisma migrate deploy && next build`).
- **Start Command:** `npm run start`.
- **Provision a managed PostgreSQL** (Render's web filesystem is ephemeral — SQLite would be wiped each deploy) and set `DATABASE_URL` to its Internal URL with `?schema=public`.
- **Seed once** (required — generation/plan creation need the event catalog): run `npm run render-seed` from a Render Shell.
- **Required env:** `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`. Optional: Geoapify, Firebase, OpenAI, admin/email keys.

### Readiness / health check

```
GET /api/health          # fast liveness (does not touch the DB)
GET /api/health?deep=1    # readiness: verifies DB reachable + migrated + seeded
```

`?deep=1` returns `ready:true` when the database is reachable, migrated and seeded; `ready:false` when it's up but unseeded (run `npm run render-seed`); or **503** when it's unreachable/unmigrated (check `DATABASE_URL` and that migrations ran). If sign-up/log-in shows *"unable to reach its database"*, this endpoint tells you which of the three it is.

### Environment variables

| Variable | Required? | Feature | Server-only | If missing |
|---|---|---|---|---|
| `DATABASE_URL` | **Required** | All data, auth, generation | Yes | Every DB call fails → clear 503 |
| `AUTH_SECRET` | **Required** (prod) | Sessions, password reset | Yes | Sign-up/log-in return a safe "unavailable" message |
| `NEXT_PUBLIC_APP_URL` | Recommended | Absolute/share links | No (public) | Links/redirects malformed |
| `GEOAPIFY_API_KEY` | Optional | Live venues + vendors | Yes | Labeled sample data instead of live |
| `AI_PROVIDER` / `OPENAI_API_KEY` | Optional | Live AI assistant | Yes | Demo (deterministic) output, clearly labeled |
| `NEXT_PUBLIC_FIREBASE_*` (×4) | Optional | "Continue with Google" | No (public by design) | Google button hidden; email/password still works |
| `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` | Optional | Seed the first admin | Yes | Admin seed skipped |
| `ADMIN_TOKEN` | Optional | Catalog-venue writes | Yes | Catalog writes disabled (read-only) |
| `EMAIL_PROVIDER_API_KEY` / `EMAIL_FROM` | Optional | Password-reset emails | Yes | Reset link logged server-side only |
| `PLACES_CACHE_HOURS` / `RATE_LIMIT_PER_MINUTE` | Optional | Caching / rate limits | Yes | Defaults (24h / 30 rpm) |

There is **no** backend-URL variable — the API is same-origin by design.

---

## What works in demo mode (no credentials)

- Entire setup flow, plan creation, and the shareable plan workspace.
- 3D + 2D planner with seating math and layout save.
- Sample venue discovery (labeled) and shortlist/select.
- All AI tools + chatbot (deterministic demo output, labeled).
- Budget, timeline, and summary views.
- The complete AI event plan (roadmap) — computed from your real selections, labeled "structured" when no AI key is set.

Accounts and the admin dashboard need a database + `AUTH_SECRET`; everything above works for the anonymous demo user. The header shows a live **configuration status**: whether Places and AI are live or in demo/sample mode.

---

## Venue attribution & data caveats

- Live venue data comes from the **Geoapify Places API** (data © OpenStreetMap contributors) and is subject to Geoapify's and OSM's terms. We cache for `PLACES_CACHE_HOURS` (default 24h).
- **We store only the provider place ID** plus our own app data (user notes, selected venue, editable 3D layout). We do **not** copy live provider names/addresses into the database as durable facts; those are shown live and re-fetched when needed.
- **Capacity, pricing, availability, included services, and booking terms are treated as unverified** for live and unverified-catalog records, tagged in the UI, and shown as **"Contact venue to confirm."** when unknown.
- Persistent venue facts live **only** in `CatalogVenue`, added from an **authorized source** with `sourceName` + `sourceUrl` + verification date. Unverified fields are marked "Not verified".
- We **never invent** a venue, rating, review, phone number, capacity, price, service, or availability. Missing fields render as empty/unknown, not fabricated.
- Sample venues are fictional placeholders, labeled **"Sample data — not live"** on every card, and never shown as if they were live.
- Required Google attribution is rendered on each live result; "Open in Google Maps" links back to the listing.
- AI output is advisory: it is marked "AI suggestion" and never presented as a confirmed price, availability, or venue fact.

### Were real Madurai venues verified and added?

**No.** This update ships the catalog model, admin/seed workflow, and live Geoapify search — but it does **not** include real, source-verified Madurai mahal records. Gathering them requires confirming each venue's data against an authorized source (venue-submitted info or terms that permit storage), which was not done here, and fabricating records is not allowed. The seed contains one unpublished `pending` **template** only. To get real Madurai results today, **add a `GEOAPIFY_API_KEY`** (live search works immediately, including names like "Arunadu"), and/or add authorized records via the admin endpoint.

---

## API endpoints

All responses use a `{ ok, data }` / `{ ok:false, error }` envelope. Inputs/outputs are validated with Zod; errors are safe (no stack traces or secrets).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` / `?deep=1` | Liveness; `deep` = DB readiness (reachable + migrated + seeded). |
| POST | `/api/auth/register` | Email/password sign-up. Retry-safe; rate-limited. |
| POST | `/api/auth/login` | Email/password log in. Rate-limited. |
| POST | `/api/auth/logout` | End the session. |
| GET | `/api/auth/me` | Current session user (or `null`). |
| POST | `/api/auth/google` | Verify a Firebase Google ID token server-side, upsert user, start session. |
| POST | `/api/auth/forgot-password` / `/api/auth/reset-password` | Password reset request / completion. |
| GET | `/api/event-categories` | Categories and event types. |
| GET | `/api/venues/search?city=&query=&venueType=&lat=&lng=&radiusKm=` | Venue search: live Geoapify (city or GPS `lat`/`lng` + `radiusKm`) + authorized catalog, or sample. Rate-limited. |
| GET | `/api/venues/:id` | Venue details (DB id, providerId, or `sample:*`). |
| GET | `/api/vendors?category=&city=&query=&maxPrice=&minRating=&lat=&lng=` | Vendor discovery: verified DB + live Geoapify, or labeled samples. Rate-limited. |
| GET | `/api/admin/catalog-venues?city=` | List published authorized catalog records (public read). |
| POST | `/api/admin/catalog-venues` | Create/update an authorized catalog record (requires `x-admin-token`). |
| GET | `/api/admin/dashboard/stats` | Admin-only: live DB counts for the dashboard cards. |
| GET | `/api/admin/users` / `/api/admin/users/:id` | Admin-only: users list / detail (safe fields only). |
| PATCH | `/api/admin/users/:id/status` | Admin-only: block/unblock (audited; revokes sessions). |
| GET | `/api/admin/data/:entity` | Admin-only: paginated events/aiplans/venues/budgets/vendors/themes/timelines. |
| POST | `/api/plans` | Create a plan. |
| GET | `/api/plans/:id` | Retrieve a plan (id or shareToken). |
| PATCH | `/api/plans/:id` | Update plan details / selected venue. |
| POST | `/api/plans/:id/layout` | Save the 3D layout. |
| POST | `/api/plans/:id/budget` | Replace budget line items; returns totals. |
| POST | `/api/plans/:id/venues` | Save/attach a venue to a plan (shortlist/select). |
| POST | `/api/plans/:id/vendors` / `PATCH`,`DELETE` `.../vendors/:savedId` | Save a vendor to a plan; update/remove a saved vendor. |
| POST | `/api/plans/:id/roadmap` | Generate the complete event plan (structured; persists the timeline). |
| POST | `/api/ai/recommendations` | Generate theme/decor/menu/budget/timeline. Rate-limited. |
| POST | `/api/ai/chat` | Chat with plan context. Rate-limited. |

---

## Security & privacy

- API keys (`GEOAPIFY_API_KEY`, `OPENAI_API_KEY`, `AUTH_SECRET`, admin/email) are read **server-side only**; only `NEXT_PUBLIC_*` values reach the browser.
- **Passwords** are hashed with scrypt; sessions use **signed, HTTP-only cookies** (`Secure` in production) backed by a revocable `Session` row.
- **Roles are server-enforced.** `requireAdmin()` guards every admin route and reads the role from the database — a client can never grant itself admin. Google sign-in never takes role/identity from the client; the Firebase ID token is verified server-side.
- Registration is **retry-safe**: a unique email plus a P2002 guard prevents duplicate accounts on double-submits.
- All endpoints validate input with Zod; auth, AI, and search endpoints apply per-IP **rate limiting** (`RATE_LIMIT_PER_MINUTE`).
- Plan edits validate that a selected venue actually belongs to the plan (IDOR guard).
- Errors return safe messages; details (codes, not secrets/DSNs) are logged server-side only.
- We avoid collecting unnecessary PII; the demo user has no credentials.

---

## Testing

```bash
npm test          # vitest run
```

Covered by `tests/`:

- **catalog** — 8+ categories, 30+ types, unique slugs, lookups, target cities.
- **venues** — Google/sample normalization, missing-field handling (no fabrication), live/sample separation, city filtering.
- **seating** — seat counting, shortfall/surplus/utilization, guest-aware layout generation, room bounds.
- **ai** — deterministic demo output, generated/provider flags, budget ranges with assumptions, style/dietary-aware menus, descending timeline, chat disclaimers.
- **schemas** — plan/layout/budget/chat validation and rejection of bad input.

The suite runs with `vitest` (`pool: forks`). Type-checking (`npm run typecheck`), linting (`npm run lint`), and the production build (`npm run build`) are also part of the verification workflow before each change is pushed.

---

## Troubleshooting

- **"Plan not found" on `/plan/...`** — run `npm run db:setup` (local) or `npm run render-seed` (deployed) to create and seed the database.
- **Sign-up / log-in shows "unable to reach its database"** — the server can't reach Postgres. Open `/api/health?deep=1`: `503` → fix `DATABASE_URL` / run migrations; `ready:false` → seed. Both email/password **and** Google sign-in hit the DB, so this blocks both.
- **Sign-up returns "temporarily unavailable"** — `AUTH_SECRET` is missing/short in the server environment. Set it (≥32 chars) and redeploy.
- **"Continue with Google" button missing** — the `NEXT_PUBLIC_FIREBASE_*` values aren't set **at build time**. Set all four and rebuild. Also add your domain under Firebase → Authentication → Authorized domains.
- **Prisma client errors** — run `npm run prisma:generate` (the `build` script does this automatically).
- **3D scene blank / "not supported"** — your device/browser may lack WebGL; the app auto-switches to the 2D plan.
- **Live venues/vendors not showing** — confirm `GEOAPIFY_API_KEY` is set and you've restarted the server. Check the Geoapify dashboard for remaining daily quota.
- **Local SQLite vs Postgres** — for a local demo flip the Prisma `provider` to `sqlite` and re-run `db:setup`; don't commit that change (production is `postgresql`).

---

## Project structure

```
VizhaVibe/
├─ prisma/
│  ├─ schema.prisma        # data model (PostgreSQL; flip to SQLite for local demo)
│  ├─ migrations/          # committed Postgres migrations (prisma migrate deploy)
│  └─ seed.ts              # catalog + sample venues + demo plan + first admin
├─ src/
│  ├─ app/                 # Next.js App Router (pages + /api route handlers)
│  │  ├─ admin/            # admin dashboard pages
│  │  ├─ login/ signup/    # auth pages (email/password + Google)
│  │  ├─ icon.svg          # brand favicon (auto-served by Next)
│  │  └─ api/              # route handlers: auth/*, admin/*, plans/*, vendors, …
│  ├─ components/
│  │  ├─ planner/          # 3D scene, 2D plan, explorer, panels, chatbot, vendors
│  │  ├─ auth/             # auth card, fields, Google button
│  │  ├─ setup/            # guided setup wizard
│  │  └─ ui/               # header, badges, config status, category art
│  ├─ data/                # catalog + sample venues/vendors (single source of truth)
│  └─ lib/                 # db, config, env, schemas, auth, firebaseVerify, venues, vendors, ai/*
├─ tests/                  # vitest unit tests
├─ DEPLOYMENT.md           # Render + PostgreSQL deployment guide
└─ .env.example
```
