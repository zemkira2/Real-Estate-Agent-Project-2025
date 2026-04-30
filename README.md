# Real Estate Agent Project

AI-powered property recommendation system for Australian (VIC) real estate, built with Next.js 14.

## Project Structure

```text
website/
├── public/data/              # Fallback CSV property dataset
├── data/users.json           # Local auth store (auto-created)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # Search, paginated results & AI report
│   │   │   └── property/[id] # Property detail page
│   │   └── api/
│   │       ├── auth/         # login, signup, logout, me
│   │       ├── properties/   # Paginated search & single property
│   │       └── ai-suggestion # Gemini 2.5 Flash deep analysis
│   ├── components/
│   │   ├── Logo.tsx
│   │   ├── Navbar.tsx
│   │   └── PropertyCard.tsx
│   ├── lib/
│   │   ├── auth.ts           # JWT auth & user storage
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
- Search filters: budget range, suburbs (autocomplete), property type, bedrooms, buyer purpose
- Paginated results with configurable page size (10 / 20 / 50 per page)
- Ranked property cards with yield, growth, and risk score breakdown
- Property detail pages with images and full listing info
- AI Property Report powered by Gemini 2.5 Flash — analyses top 20 results and produces:
  - Top 3 picks for living (lifestyle fit, safety, schools, pros/cons)
  - Top 3 picks for investment (gross yield %, annual income, growth outlook, risks)
  - Suburb-level market insights
  - Personalised recommendation based on user's stated purpose

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

The app loads live listings from the RapidAPI endpoint. Without `RAPIDAPI_KEY` the properties list will be empty.

## How Scoring Works

Each property is scored on three dimensions and ranked server-side:

| Dimension | Calculation |
|---|---|
| Rental yield | `(rent_estimate × 52) ÷ price` |
| Capital growth | Land size + suburb category (city / regional) |
| Risk | Flood-prone, bushfire, and industrial-zone heuristics |

The final score is a weighted combination. When the user selects **Invest** purpose, yield and growth are weighted higher; **Live** purpose weights low risk and bedroom count higher.

## Pagination

The `/api/properties` endpoint accepts `page` and `pageSize` query params and returns `totalPages` and `currentPage`. The dashboard UI exposes a per-page selector and numbered page controls.

## AI Report

Clicking **AI Analysis** fetches the top 20 matching properties (independent of the current page) and sends them to Gemini 2.5 Flash with the user's full profile. The model returns a structured markdown report with per-property deep dives and a tailored recommendation. The free tier of Gemini is sufficient for normal usage.

## Authentication

- Passwords are bcrypt-hashed and stored in `website/data/users.json`
- Sessions use signed JWT tokens in HTTP-only cookies
- Client mirrors basic user info in `localStorage` for UI use only

To reset accounts during development, delete `website/data/users.json`.

## Deployment

Builds as a standard Next.js 14 app for Vercel or any Node-compatible platform. For production, replace the JSON auth store with a database — the migration point is [`auth.ts`](website/src/lib/auth.ts).
