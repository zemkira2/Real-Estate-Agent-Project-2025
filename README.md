# Real Estate Agent Project

AI-powered property recommendation system for Australian (VIC) real estate, built with Next.js 14.

## Project Structure

```text
website/
├── data/users.json           # Local auth store (auto-created, stores preferences)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page (redirects to onboarding)
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # Hub — choose Find a Home or Invest
│   │   │   ├── live/         # Self-living search & results
│   │   │   ├── invest/       # Investment search & results
│   │   │   └── property/[id] # Property detail page
│   │   └── api/
│   │       ├── auth/         # login, signup, logout, me, preferences
│   │       ├── properties/   # Paginated search endpoint
│   │       └── ai-suggestion # Gemini 2.5 Flash deep analysis
│   ├── components/
│   │   ├── DashboardContent.tsx  # Shared search/results component
│   │   ├── OnboardingModal.tsx   # 4-step preferences wizard
│   │   ├── Logo.tsx
│   │   ├── Navbar.tsx
│   │   └── PropertyCard.tsx
│   ├── lib/
│   │   ├── auth.ts           # JWT auth, user storage & preferences
│   │   ├── constants.ts      # Shared constants
│   │   ├── markdown.ts       # Markdown renderer (headers, lists, hr, code)
│   │   ├── properties.ts     # Live data via RapidAPI (Realty Base AU)
│   │   ├── scoring.ts        # Property scoring & ranking algorithm
│   │   └── suburbs.ts        # VIC suburb list for autocomplete
│   └── middleware.ts         # Route protection
├── .env.local.example        # Environment variable template
├── tailwind.config.ts        # Custom theme (primary/gold palette)
└── package.json
```

## Features

- Email/password authentication with JWT sessions (HTTP-only cookies)
- **Onboarding wizard** — 4-step preferences popup shown on first signup:
  - Purpose (live / invest / any), budget range, property type & bedrooms, preferred suburbs
  - Preferences saved to user account and pre-loaded on every visit
- **Split dashboard** — two dedicated pages with purpose-locked scoring:
  - `/dashboard/live` — ranked for comfort, safety, schools, and lifestyle
  - `/dashboard/invest` — ranked for rental yield, capital growth, and low risk
- Search filters: budget range, suburbs (autocomplete), property type, bedrooms
- Paginated results with configurable page size (10 / 20 / 50 per page)
- Ranked property cards with yield, growth, and risk score breakdown
- Property detail pages with images and full listing info
- **AI Property Report** powered by Gemini 2.5 Flash — analyses top 20 results:
  - Top 3 picks for living (lifestyle fit, safety, schools, pros/cons)
  - Top 3 picks for investment (gross yield %, annual income, growth outlook, risks)
  - Suburb-level market insights
  - Personalised recommendation based on user's purpose

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router, React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS (custom navy/gold theme) |
| Auth | `jose` (JWT), `bcryptjs` (password hashing) |
| Property data | RapidAPI — Realty Base AU |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |

## Quick Start

```bash
cd website
npm install
cp .env.local.example .env.local   # then fill in your keys
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Random secret for signing JWT tokens |
| `RAPIDAPI_KEY` | Yes | RapidAPI key for live property data (Realty Base AU) |
| `GEMINI_API_KEY` | No | Enables the AI Property Report (free at aistudio.google.com) |

## User Flow

1. User signs up → **onboarding modal** appears (purpose, budget, bedrooms, suburbs)
2. Preferences saved → redirected to **dashboard hub**
3. Hub shows two paths: **Find a Home** (`/dashboard/live`) or **Investment Properties** (`/dashboard/invest`)
4. Each page pre-loads saved preferences and runs an initial search
5. User refines filters and clicks **AI Analysis** for a detailed Gemini report
6. Preferences can be updated anytime via the **⚙ Preferences** button in the navbar

## How Scoring Works

Each property is scored on three dimensions and ranked server-side:

| Dimension | Calculation |
|---|---|
| Rental yield | `(rent_estimate × 52) ÷ price` |
| Capital growth | Land size + suburb category (city / regional) |
| Risk | Flood-prone (+5), bushfire (+3), industrial zone (+2) heuristics |

The final score is a weighted combination. `/dashboard/invest` weights yield and growth higher; `/dashboard/live` weights low risk and bedroom count higher.

## Pagination

`/api/properties` accepts `page` and `pageSize` (default 20, max 100). Returns `totalPages` and `currentPage`. The dashboard exposes a per-page selector and numbered page controls.

## AI Report

Clicking **AI Analysis** fetches the top 20 matching properties independently of the current page and sends them to Gemini 2.5 Flash with the user's full profile. The model returns a structured markdown report with per-property deep dives and a tailored recommendation. Gemini's free tier is sufficient for normal usage.

## Authentication & Preferences

- Passwords are bcrypt-hashed and stored in `website/data/users.json`
- Sessions use signed JWT tokens in HTTP-only cookies
- `UserPreferences` (budget, suburbs, bedrooms, property type, purpose) are stored alongside the user record and returned by `GET /api/auth/me`
- Update preferences via `POST /api/auth/preferences`

To reset accounts during development, delete `website/data/users.json`.

## Deployment

Builds as a standard Next.js 14 app for Vercel or any Node-compatible platform. For production, replace the JSON auth store with a database — the migration point is [`auth.ts`](website/src/lib/auth.ts).
