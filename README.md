# Real Estate Agent Project

AI-powered property recommendation system for Australian real estate, built with Next.js.

## Project Structure

```text
website/
├── public/data/              # CSV property dataset
├── data/users.json           # Local auth store (auto-created)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page
│   │   ├── dashboard/
│   │   │   ├── page.tsx      # Search & ranked results
│   │   │   └── property/[id] # Property detail page
│   │   └── api/
│   │       ├── auth/         # Login, signup, logout, me
│   │       ├── properties/   # Search & single property
│   │       └── ai-suggestion # Gemini-powered analysis
│   ├── components/
│   │   ├── Logo.tsx          # Brand logo
│   │   ├── Navbar.tsx        # Navigation bar
│   │   └── PropertyCard.tsx  # Property result card
│   ├── lib/
│   │   ├── auth.ts           # JWT auth & user storage
│   │   ├── constants.ts      # Shared constants
│   │   ├── markdown.ts       # Markdown renderer
│   │   ├── properties.ts     # CSV data loading
│   │   └── scoring.ts        # Property scoring algorithm
│   └── middleware.ts         # Route protection
├── .env.local.example        # Environment variable template
├── tailwind.config.ts        # Custom theme (primary/gold palette)
└── package.json
```

## Features

- Email/password authentication with JWT sessions
- Local account persistence in `data/users.json`
- Search filters: budget, suburb, property type, bedrooms, buyer purpose
- Ranked property recommendations with scoring breakdown
- Property detail pages with hero image, price summary, and AI analysis
- Gemini-powered AI suggestions (optional)
- CSV-backed mock dataset for local development

## Tech Stack

- Next.js 14 / React 18
- TypeScript
- Tailwind CSS
- jose (JWT handling)
- bcryptjs (password hashing)
- Google Gemini API (optional)

## Quick Start

```bash
cd website
npm install
cp .env.local.example .env.local   # then edit with your values
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `website/.env.local` from the example file:

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Random secret key for signing JWT tokens |
| `GEMINI_API_KEY` | No | Enables AI property suggestions |
| `CLIENT_ID` | No | Domain.com.au API client ID |
| `CLIENT_SECRET` | No | Domain.com.au API client secret |

The app works without external APIs by using the bundled CSV dataset.

## How Scoring Works

Each property is scored on three dimensions:

- **Rental yield** — based on `(rent_estimate * 52) / price`
- **Capital growth** — based on land size and suburb category
- **Risk** — based on flood, bushfire, and industrial-zone heuristics

The final score is a weighted combination. Results can be biased toward living or investment depending on the user's selected purpose.

## Authentication

- Server: hashed passwords stored in `website/data/users.json`
- Client: signed-in user profile mirrored in `localStorage` for UX
- Passwords are never stored in the browser

To reset accounts during development, delete `website/data/users.json`.

## Deployment

Builds cleanly as a Next.js 14 app for Vercel or any Node-compatible platform.

For production, replace the JSON auth store with a database. The migration point is [auth.ts](website/src/lib/auth.ts), where file reads/writes can be swapped for database queries.
