# VizhaVibe 🪔

A **3D-first, immersive event-planning platform** for events in **Madurai, Chennai, and Bangalore**. Instead of browsing a grid of venue cards, you step into an interactive 3D venue, arrange seating and decor, and get AI-assisted themes, menus, budgets, and timelines — tuned for Tamil, Kerala, Telugu, Kannada, and North Indian styles.

> **Demo-first:** The full core journey works with **no account and no API keys**. Sample venues and demo AI output are always clearly labeled and never mixed with live data.

---

## Key features

- **3D venue explorer** (React Three Fiber + Three.js): orbit/pan/zoom, preset camera views (reset, top, stage, entrance), drag-to-reposition tables/stage/decor, guest-count-aware auto-fill, and a live "seats placed vs guest count" readout.
- **Accessible 2D plan** alternative (SVG, keyboard-focusable) and an automatic fallback for devices without WebGL.
- **Guided setup flow**: category → event type → city/date/guests/budget → style & dietary preferences.
- **Venue discovery** via **Geoapify Places API**, server-mediated, with real-time GPS "near me" search, a 5/10/25/50 km radius, nearest-first sorting, attribution, and explicit "unverified" tags on capacity/pricing/availability. Falls back to **clearly-labeled sample venues** when no key is set.
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
| Database | **Prisma + SQLite (default)** | Zero-config demo. Swap to **PostgreSQL** by changing one line (see below). |
| Validation | **Zod** | Shared request/response schemas for every endpoint. |
| AI | **Provider abstraction** (`demo` / `openai`) | Core logic never binds to one vendor; server-side calls only. |
| Venues | **Server-mediated Geoapify Places** | Keeps the key off the client; circle filter + proximity bias; caching. |

Design decisions:

- **No login required.** Plans belong to a shared demo user and are addressed by an unguessable `shareToken`. This keeps the demo frictionless. The schema already models `User` and ownership, so adding real auth (e.g. NextAuth) later is straightforward — documented as a deliberate choice.
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

The default `.env` runs in full demo mode (SQLite, sample venues, demo AI).

## Database: migrate & seed

```bash
npm run db:setup
```

This runs `prisma db push` (creates the SQLite schema) and seeds:

- The full event catalog (8 categories / 40 types).
- Sample venues for all three cities.
- A **sample plan** with a 3D layout, budget, menu, and timeline at **`/plan/demo-tamil-wedding`**.

(You can run the steps individually: `npm run prisma:push` then `npm run seed`.)

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

## Using PostgreSQL instead of SQLite

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` to your Postgres URL.
3. Run `npm run prisma:migrate` (creates a migration) then `npm run seed`.

---

## What works in demo mode (no credentials)

- Entire setup flow, plan creation, and the shareable plan workspace.
- 3D + 2D planner with seating math and layout save.
- Sample venue discovery (labeled) and shortlist/select.
- All AI tools + chatbot (deterministic demo output, labeled).
- Budget, timeline, and summary views.

The header shows a live **configuration status**: whether Places and AI are live or in demo/sample mode.

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
| GET | `/api/health` | Service status + integration (Places/AI) status. |
| GET | `/api/event-categories` | Categories and event types. |
| GET | `/api/venues/search?city=&query=&venueType=&lat=&lng=&radiusKm=` | Venue search: live Geoapify (city or GPS `lat`/`lng` + `radiusKm`) + authorized catalog, or sample. Rate-limited. |
| GET | `/api/venues/:id` | Venue details (DB id, providerId, or `sample:*`). |
| GET | `/api/admin/catalog-venues?city=` | List published authorized catalog records (public read). |
| POST | `/api/admin/catalog-venues` | Create/update an authorized catalog record (requires `x-admin-token`). |
| POST | `/api/plans` | Create a plan. |
| GET | `/api/plans/:id` | Retrieve a plan (id or shareToken). |
| PATCH | `/api/plans/:id` | Update plan details / selected venue. |
| POST | `/api/plans/:id/layout` | Save the 3D layout. |
| POST | `/api/plans/:id/budget` | Replace budget line items; returns totals. |
| POST | `/api/plans/:id/venues` | Save/attach a venue to a plan (shortlist/select). |
| POST | `/api/ai/recommendations` | Generate theme/decor/menu/budget/timeline. Rate-limited. |
| POST | `/api/ai/chat` | Chat with plan context. Rate-limited. |

---

## Security & privacy

- API keys (`GEOAPIFY_API_KEY`, `OPENAI_API_KEY`) are read **server-side only**; only `NEXT_PUBLIC_*` values reach the browser.
- All endpoints validate input with Zod; AI and search endpoints apply per-IP **rate limiting** (`RATE_LIMIT_PER_MINUTE`).
- Plan edits validate that a selected venue actually belongs to the plan.
- Errors return safe messages; details are logged server-side only.
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

> **Note on verification in this environment:** the project was authored with file tools; the terminal in the authoring environment could not execute commands, so `npm install`, `build`, and `test` were **not run here**. Run the commands above locally to verify. See "Troubleshooting" if anything fails.

---

## Troubleshooting

- **"Plan not found" on `/plan/...`** — run `npm run db:setup` to create and seed the database.
- **Prisma client errors** — run `npm run prisma:generate` (the `build` script does this automatically).
- **3D scene blank / "not supported"** — your device/browser may lack WebGL; the app auto-switches to the 2D plan.
- **Live venues not showing** — confirm `GEOAPIFY_API_KEY` is set in `.env` and you've restarted the server. Check the Geoapify dashboard for remaining daily quota.
- **Switching to Postgres** — remember to change the Prisma `provider` and re-run migrations.

---

## Project structure

```
VizhaVibe/
├─ prisma/
│  ├─ schema.prisma        # data model (SQLite default, Postgres-ready)
│  └─ seed.ts              # catalog + sample venues + demo plan
├─ src/
│  ├─ app/                 # Next.js App Router (pages + /api route handlers)
│  ├─ components/
│  │  ├─ planner/          # 3D scene, 2D plan, explorer, panels, chatbot
│  │  ├─ setup/            # guided setup wizard
│  │  └─ ui/               # header, badges, config status
│  ├─ data/                # catalog + sample venues (single source of truth)
│  └─ lib/                 # db, config, schemas, venues, seating, ai/*
├─ tests/                  # vitest unit tests
└─ .env.example
```
