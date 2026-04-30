# CLAUDE.md

## Project Overview

Real Estate Agent — an AI-powered property recommendation app for Australian (VIC) real estate. Next.js 14 web app with JWT auth, paginated property search/scoring, and Gemini 2.5 Flash AI analysis.

## Commands

```bash
cd website
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npx tsc --noEmit  # Type-check without emitting
```

## Architecture

- **Framework**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS
- **Auth**: JWT via `jose`, passwords hashed with `bcryptjs`, HTTP-only cookies
- **Data**: Live property listings via RapidAPI (Realty Base AU); `loadProperties()` is async
- **Users**: JSON file store at `website/data/users.json` (auto-created)
- **AI**: Google Gemini 2.5 Flash via `@google/generative-ai`; model `gemini-2.5-flash`, `maxOutputTokens: 8192`
- **Middleware**: `src/middleware.ts` protects `/dashboard/*` routes, redirects auth pages if logged in
- **Path alias**: `@/*` maps to `./src/*`

## Key Directories

```
website/src/
  app/                      # Pages and API routes (App Router)
    api/auth/               # login, signup, logout, me endpoints
    api/properties/         # Paginated search endpoint (page, pageSize params)
    api/ai-suggestion/      # Gemini deep analysis endpoint
    dashboard/              # Main search + paginated results + AI report
    dashboard/property/[id]/ # Property detail page
  components/               # Logo, Navbar, PropertyCard
  lib/
    auth.ts                 # JWT helpers & JSON user store
    constants.ts            # Shared constants
    markdown.ts             # Line-by-line markdown renderer (h1-h3, ul, hr, code)
    properties.ts           # loadProperties() — async, fetches from RapidAPI
    scoring.ts              # filterProperties(), rankProperties(), addScores()
    suburbs.ts              # getAllSuburbKeys() — VIC suburb list for autocomplete
```

## Environment Variables

Required: `JWT_SECRET`, `RAPIDAPI_KEY`
Optional: `GEMINI_API_KEY` (free at aistudio.google.com — enables AI report)

Copy `website/.env.local.example` to `website/.env.local`. Never commit `.env.local`.

## Pagination

`/api/properties` accepts `page` (default 1) and `pageSize` (default 20, max 100). It ranks all filtered results then slices for the page. Response includes `totalMatches`, `totalPages`, `currentPage`. Dashboard has a per-page selector (10/20/50) and numbered pagination controls that call `searchProperties(page)`.

## AI Analysis

`/api/ai-suggestion` (POST) accepts `properties` (up to 20) and `userProfile`. The dashboard always fetches the top 20 results independently of the current page before calling the AI endpoint. The prompt instructs Gemini to produce:

1. **Top Picks for Living** — 3 properties with lifestyle fit, strengths, considerations, buyer profile
2. **Top Picks for Investment** — 3 properties with gross yield %, annual income, growth outlook, risks
3. **Suburb Insights** — patterns across the suburb set
4. **Our Recommendation** — tailored to the user's stated purpose

Pre-calculated financials (annual rent, gross yield %) are included in the prompt so the model uses real numbers.

## Scoring Algorithm

Properties scored on three axes in `lib/scoring.ts`:
- **Rental yield**: `(rent_estimate × 52) / price` → scaled 0–10
- **Capital growth**: land size + suburb category (city suburbs score higher)
- **Risk**: flood-prone (+5), bushfire zone (+3), industrial area (+2)
- **Final score**: weighted combination; purpose biases weights (invest → yield/growth; live → low risk + bedrooms)

`rankProperties(filtered, filtered.length, purpose)` sorts all matches; the API then slices for the requested page.

## Style Conventions

- Tailwind CSS with custom theme: `primary` (navy blue) and `gold` color palettes
- Fonts: `font-display` (Fraunces serif) for headings, `font-sans` (Plus Jakarta Sans) for body
- Custom shadows: `shadow-card`, `shadow-card-hover`, `shadow-gold`
- UI pattern: rounded-2xl cards, stone-50 backgrounds, uppercase tracking-wider labels
- Components are "use client" — server components not used for pages
- AI markdown output styled via `.ai-markdown` CSS class in `globals.css`
