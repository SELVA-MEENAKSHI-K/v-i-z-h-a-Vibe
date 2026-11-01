# VizhaVibe 🪔

A **3D-first, immersive event-planning platform** for events in **Madurai, Chennai, and Bangalore**. Instead of browsing a grid of venue cards, you step into an interactive 3D venue, arrange seating and decor, and get AI-assisted themes, menus, budgets, and timelines — tuned for Tamil, Kerala, Telugu, Kannada, and North Indian styles.

> **Demo-first:** The full core journey works with **no account and no API keys**. Sample venues and demo AI output are always clearly labeled and never mixed with live data.

---

## Problem & solution

**Problem.** Planning a South Indian wedding or celebration means juggling venues, seating for hundreds of guests, regional menus, decor themes, vendors, budgets and timelines — usually across spreadsheets and flat photo galleries, with no sense of how the event will actually look or whether the seating even fits.

**Solution.** VizhaVibe turns planning into an interactive, 3D-first experience: pick an event type, step into a generated 3D venue sized to your guest count, and layer on AI-assisted themes, regional menus, itemised budgets and a preparation timeline — with live venue/vendor discovery where configured. Every number is computed from your real selections, and anything not source-verified (sample data, AI suggestions, indicative prices) is clearly labelled so nothing is ever faked as a confirmed fact.

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

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | `prisma generate` + `next build` (production bundle). |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint (`next/core-web-vitals` + `@typescript-eslint/recommended`), 0 warnings allowed. |
| `npm run typecheck` | `tsc --noEmit` (strict). |
| `npm test` | Run the unit/component/integration suite (vitest). |
| `npm run test:coverage` | Run the suite with v8 coverage + thresholds. |
| `npm run format` | Prettier write. |
| `npm run security:audit` | `npm audit --omit=dev` (production-dependency vulnerabilities only). |
| `npm run db:setup` | `prisma db push` + seed (local SQLite demo). |
| `npm run seed` / `render-seed` | Seed the event catalog, sample data and first admin. |

## Testing

```bash
npm test               # vitest run (unit + component + integration)
npm run test:coverage  # with v8 coverage + thresholds
```

**207 tests across 27 files.** Coverage thresholds are enforced: statements/branches/lines ≥ 85% globally and all four metrics ≥ 85% on `src/lib/**` (the pure-logic core). What's covered:

- **Pure logic** — `seating` (seat math, guest-aware layout, bounds), `menuBudget`, `timeline`, `showcaseSeating`, `eventEnvironment` (every event-type branch), `venueDimensions`, `rateLimit`.
- **Schemas** — Zod valid + invalid cases for plan/layout/budget/chat/auth.
- **AI** — provider gating, deterministic demo output, the OpenAI provider's JSON parse/provenance/error paths (no fabricated fallback).
- **API helper** — `ok`/`fail`/`handleError` incl. Zod→422 and Prisma→503/409 mapping with no secret leakage.
- **Security** — route ownership (403), auth required (401), not-found (404), validation (422), rate-limit (429), and the `next.config` security headers/CSP.
- **Components** — `CategoryArt` (every slug), `Header` (logged in/out/admin, mobile, logout), `SetupWizard` (validation, navigation, submit payload).
- **Accessibility** — `axe-core` runs on Login, Signup and the SetupWizard (`/plan/new`) surfaces with **zero violations**.

`tsc --noEmit`, `npm run lint`, and `npm run build` are part of the pre-push verification workflow.

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

## Requirements → feature → implementation → test

Each stated requirement maps to a visible feature, the route/page and file that implement it, and the test that covers it.

| Requirement | Feature | Route / page | Implementation file(s) | Test(s) |
|---|---|---|---|---|
| 3D-first venue experience | 3D event showcase (orbit/zoom, camera views, WebGL→2D fallback) | `/plan/[id]` → 3D Showcase tab | `components/showcase/EventShowcase.tsx`, `ShowcaseScene.tsx`, `VenueCameraControls.tsx` | `tests/showcase.test.ts`, `tests/venueDimensions.test.ts` |
| Guest-count-aware seating | Seat math + auto-generated layout | 3D Showcase / Summary | `lib/seating.ts`, `lib/showcaseSeating.ts` | `tests/seating.test.ts`, `tests/showcase.test.ts` |
| Guided event setup (category → type → details → style) | Setup wizard with validation | `/plan/new` | `components/setup/SetupWizard.tsx`, `lib/schemas.ts` | `tests/setupWizard.test.tsx`, `tests/schemas.test.ts` |
| 8 categories / 30+ event types | Data-driven catalog | setup + home | `data/catalog.ts` | `tests/catalog.test.ts` |
| Venue discovery (live + sample, honest labels) | Geoapify venue search + catalog + samples | `/plan/[id]` → Venue discovery | `lib/venues.ts`, `app/api/venues/search/route.ts` | `tests/venues.test.ts` |
| Vendor discovery | Vendor search + per-category art, "contact for quote" | `/plan/[id]` → Vendors | `components/planner/VendorManagement.tsx`, `lib/vendors.ts`, `app/api/vendors/route.ts` | `tests/vendors.module.test.ts` |
| AI themes/decor/menu/budget/timeline + chat | Provider abstraction (demo + OpenAI), advisory labels | `/plan/[id]` → AI tools | `lib/ai/*`, `app/api/ai/*` | `tests/ai.test.ts`, `tests/openaiProvider.test.ts` |
| Regional menus & food budget | Visual menu gallery + live totals | `/plan/[id]` → Food menu | `components/menu/MenuGallery.tsx`, `lib/menuBudget.ts` | `tests/menuBudget.test.ts` |
| Theme inspiration | Theme gallery + apply-to-3D | `/plan/[id]` → Themes | `components/themes/ThemeGallery.tsx`, `lib/eventEnvironment.ts` | `tests/themes.test.ts`, `tests/eventEnvironment.test.ts` |
| Itemised budget | Editable budget + vendor sync | `/plan/[id]` → Budget | `components/planner/BudgetPanel.tsx`, `app/api/plans/[id]/budget/route.ts` | `tests/menuBudget.test.ts`, `tests/security.routes.test.ts` |
| Preparation timeline | Task list with deadlines/status | `/plan/[id]` → Timeline | `components/planner/TimelinePanel.tsx`, `lib/timeline.ts` | `tests/timeline.test.ts` |
| Complete AI plan (roadmap) | "Generate my complete plan" | `/plan/[id]` → Final Plan | `lib/ai/roadmap.ts`, `app/api/plans/[id]/roadmap/route.ts` | `tests/roadmap.test.ts` |
| Shareable plans | Unguessable `shareToken` URLs | `/plan/[id]` | `lib/plans.ts` | `tests/security.routes.test.ts` |
| Accounts (email/password + Google) | Auth with sessions + roles | `/login`, `/signup` | `lib/auth.ts`, `lib/firebaseVerify.ts`, `app/api/auth/*` | `tests/auth.test.ts`, `tests/firebaseVerify.test.ts` |
| Admin monitoring | Tabbed admin dashboard | `/admin` | `app/admin/*`, `app/api/admin/*` | `tests/security.routes.test.ts` (ownership/role), `tests/header.test.tsx` (admin gating) |
| Authorized venue catalog | Admin catalog with provenance | `/plan/[id]` venue list | `app/api/admin/catalog-venues/route.ts`, `data/maduraiCatalog.ts` | `tests/catalog.test.ts`, `tests/venues.test.ts` |
| Config transparency | Live/sample/demo status banners | header | `components/ui/ConfigStatus.tsx`, `lib/config.ts` | `tests/env.test.ts`, `tests/fallbacks.test.ts` |
| Accessibility (WCAG 2.2 AA) | focus rings, labels, skip link, pause-animations, reduced-motion | all pages | `app/layout.tsx`, `app/globals.css`, `components/ui/AnimationToggle.tsx` | `tests/a11y.test.tsx` |
| Security headers / CSP | CSP + hardening headers | all responses | `next.config.mjs` | `tests/security.headers.test.ts` |

### Requirements that are missing or weak (honest list)

- **RSVP / guest-list management** — not implemented. The platform plans the event; it does not collect guest RSVPs. (Larger feature; listed, not built.)
- **Full-page axe tests for Home & Plans** — those are async server components that don't render in jsdom; a11y is axe-tested on the interactive client surfaces instead (login, signup, setup wizard). Full-page coverage would need Playwright + a running server.
- **`shareToken` length** — uses Prisma `cuid()` (unguessable, collision-resistant) rather than a 32+ char token; adequate for a share link, but not changed to avoid a data migration.
- **Multi-instance rate limiting** — the in-memory limiter is single-instance; production scale-out would need Redis/Upstash (documented in `lib/rateLimit.ts`).

---

## Known limitations

- **Deferred dependency upgrades.** `npm run security:audit` reports vulnerabilities in `next`, `postcss` (via next), `zod`, and `@grpc/grpc-js` (via `firebase`). Every available fix is a **breaking major upgrade** (next 14→16, zod 3→4, a firebase API change) that would alter behaviour, so they are **intentionally deferred** rather than force-upgraded. All non-breaking fixes have been applied (`npm audit fix`). The added CSP and security headers mitigate several of the Next.js DoS/XSS classes at the edge. Re-evaluate when upgrading the framework majors is planned.
- **Password hashing uses Node `scrypt`** (a memory-hard KDF in the same class as bcrypt/argon2), chosen to avoid an extra native dependency. Switching hashers later would require a migration of existing hashes.
- **Rate limiting is in-memory** (single instance) — see above.
- **Live AI/venue/vendor data requires keys** (`OPENAI_API_KEY`, `GEOAPIFY_API_KEY`). Without them the app runs in clearly-labelled demo/sample mode — it never fabricates live results.
- **Database for production is PostgreSQL.** For a zero-config local demo, flip the Prisma `provider` to `sqlite` (see "Using PostgreSQL vs SQLite"); don't commit that change.

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
