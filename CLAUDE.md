# CLAUDE.md

## Project Overview

Real Estate Agent — an AI-powered property recommendation app for Australian (VIC) real estate. Next.js 14 web app with JWT auth, user preferences, paginated property search/scoring, and Gemini 2.5 Flash AI analysis. Dashboard is split into two purpose-specific pages: `/dashboard/live` and `/dashboard/invest`.

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
- **Users**: JSON file store at `website/data/users.json` (auto-created); stores hashed password + `UserPreferences`
- **AI**: Google Gemini 2.5 Flash via `@google/generative-ai`; model `gemini-2.5-flash`, `maxOutputTokens: 8192`
- **Middleware**: `src/middleware.ts` protects `/dashboard/*` routes, redirects auth pages if logged in
- **Path alias**: `@/*` maps to `./src/*`

## Key Directories

```
website/src/
  app/                        # Pages and API routes (App Router)
    api/auth/                 # login, signup, logout, me, preferences endpoints
    api/properties/           # Paginated search endpoint (page, pageSize params)
    api/ai-suggestion/        # Gemini deep analysis endpoint
    dashboard/                # Hub page — choose Live or Invest
    dashboard/live/           # Self-living search page (purpose=live locked)
    dashboard/invest/         # Investment search page (purpose=invest locked)
    dashboard/property/[id]/  # Property detail page
  components/
    DashboardContent.tsx      # Shared search + results + AI component (accepts mode prop)
    OnboardingModal.tsx       # 4-step preferences wizard modal
    Navbar.tsx                # Nav with Live/Invest tabs + Preferences button
    Logo.tsx
    PropertyCard.tsx
  lib/
    auth.ts                   # JWT helpers, JSON user store, UserPreferences type, saveUserPreferences()
    constants.ts              # Shared constants
    markdown.ts               # Line-by-line markdown renderer (h1-h3, ul, hr, code)
    properties.ts             # loadProperties() — async, fetches from RapidAPI
    scoring.ts                # filterProperties(), rankProperties(), addScores()
    suburbs.ts                # getAllSuburbKeys() — VIC suburb list for autocomplete
```

## Environment Variables

Required: `JWT_SECRET`, `RAPIDAPI_KEY`
Optional: `GEMINI_API_KEY` (free at aistudio.google.com — enables AI report)

Copy `website/.env.local.example` to `website/.env.local`. Never commit `.env.local`.

## User Preferences

`UserPreferences` (defined in `lib/auth.ts`) is stored on the user record in `users.json`:

```ts
interface UserPreferences {
  purpose: "live" | "invest" | "any";
  budgetMin: number;
  budgetMax: number;
  propertyType: string;
  minBedrooms: number;
  suburbs: string[];
}
```

- Saved via `POST /api/auth/preferences`
- Returned by `GET /api/auth/me` (full user lookup from storage, not JWT-only)
- `getCurrentUser()` in `auth.ts` reads the full user record (including preferences) from `users.json` using the ID from the JWT
- `OnboardingModal.tsx` is shown after signup (`/dashboard?onboarding=true`) and when preferences are unset
- Preferences pre-populate the search form in `DashboardContent.tsx`

## Dashboard Structure

- `/dashboard` — hub page: two cards (Find a Home / Investment Properties) + preferences summary + Edit button
- `/dashboard/live` — `<DashboardContent mode="live" />` — purpose locked to live, search pre-loaded from preferences
- `/dashboard/invest` — `<DashboardContent mode="invest" />` — purpose locked to invest, search pre-loaded from preferences
- `DashboardContent.tsx` is the shared component; `mode` prop locks the purpose and changes headings/labels

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
- **Final score**: weighted combination; `mode="invest"` weights yield/growth higher; `mode="live"` weights low risk + bedrooms

`rankProperties(filtered, filtered.length, purpose)` sorts all matches; the API then slices for the requested page.

## Style Conventions

- Tailwind CSS with custom theme: `primary` (navy blue) and `gold` color palettes
- Fonts: `font-display` (Fraunces serif) for headings, `font-sans` (Plus Jakarta Sans) for body
- Custom shadows: `shadow-card`, `shadow-card-hover`, `shadow-gold`
- UI pattern: rounded-2xl cards, stone-50 backgrounds, uppercase tracking-wider labels
- Components are "use client" — server components not used for pages
- AI markdown output styled via `.ai-markdown` CSS class in `globals.css`
