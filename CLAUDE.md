# CLAUDE.md

## Project Overview

Real Estate Agent — an AI-powered property recommendation app for Australian (VIC) real estate. Next.js 14 web app with JWT auth, property search/scoring, and optional Gemini AI suggestions.

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
- **Data**: CSV dataset in `website/public/data/`, parsed with `csv-parse`
- **Users**: JSON file store at `website/data/users.json` (auto-created)
- **AI**: Google Gemini via `@google/generative-ai` (optional, needs `GEMINI_API_KEY`)
- **Middleware**: `src/middleware.ts` protects `/dashboard/*` routes, redirects auth pages if logged in
- **Path alias**: `@/*` maps to `./src/*`

## Key Directories

```
website/src/
  app/                    # Pages and API routes (App Router)
    api/auth/             # login, signup, logout, me endpoints
    api/properties/       # Search and single-property endpoints
    api/ai-suggestion/    # Gemini-powered analysis endpoint
    dashboard/            # Main search + results page
    dashboard/property/[id]/ # Property detail page
  components/             # Logo, Navbar, PropertyCard
  lib/                    # auth.ts, scoring.ts, properties.ts, constants.ts, markdown.ts
```

## Style Conventions

- Tailwind CSS with custom theme: `primary` (navy blue) and `gold` color palettes
- Fonts: `font-display` (Fraunces serif) for headings, `font-sans` (Plus Jakarta Sans) for body
- Custom shadows: `shadow-card`, `shadow-card-hover`, `shadow-gold`
- UI pattern: rounded-2xl cards, stone-50 backgrounds, uppercase tracking-wider labels
- Components are "use client" — server components not used for pages

## Environment Variables

Required: `JWT_SECRET`
Optional: `GEMINI_API_KEY`, `CLIENT_ID`, `CLIENT_SECRET`

Copy `website/.env.local.example` to `website/.env.local`. Never commit `.env.local`.

## Scoring Algorithm

Properties scored on three axes in `lib/scoring.ts`:
- Rental yield: `(rent_estimate * 52) / price`
- Capital growth: land size + suburb category
- Risk: flood, bushfire, industrial-zone heuristics
- Final score: weighted combination, biased by purpose (live vs invest)
