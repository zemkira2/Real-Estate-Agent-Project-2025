# Real Estate Agent Project

AI-powered property recommendation system for Australian real estate. This repo includes:

- a Python CLI workflow for scoring and filtering mock VIC listings
- a legacy Streamlit UI
- a Next.js web app with authentication, property images, ranked results, detail pages, and AI-generated suggestions

## Project Structure

```text
.
|-- Project.py                # Python CLI: scoring, filtering, Gemini reasoning
|-- front_end.py              # Streamlit UI
|-- processing_Data.py        # CSV data generator
|-- config.py                 # Scoring rules and LLM prompt
|-- vic_properties_1000.csv   # Mock property dataset for Python tools
|-- requirements.txt          # Python dependencies
`-- website/
    |-- public/data/          # CSV data used by the Next.js app
    |-- src/
    |   |-- app/              # App Router pages and API routes
    |   |-- components/       # Reusable UI components
    |   `-- lib/              # Auth, scoring, and property loading
    |-- data/users.json       # Local auth store, created automatically
    `-- package.json          # Website dependencies and scripts
```

## Current Features

- Email/password authentication with JWT sessions
- Local account persistence in `website/data/users.json`
- Safe browser-side profile persistence in `localStorage`
- Search filters for budget, suburb, property type, bedrooms, and buyer purpose
- Ranked recommendation cards with property images and visible pricing
- Click-through property detail pages with hero image, price summary, score breakdown, and AI analysis
- CSV-backed mock property dataset for local development
- Gemini-powered property suggestions when `GEMINI_API_KEY` is configured

## Requirements

### Python tools

- Python 3.9 or newer
- `pip install -r requirements.txt`

### Website

- Node.js 18 or newer
- npm 9 or newer

## Quick Start

### Run the Next.js website

```powershell
cd website
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Run the Python CLI

```powershell
pip install -r requirements.txt
python Project.py
```

### Run the Streamlit UI

```powershell
pip install -r requirements.txt
python -m streamlit run front_end.py
```

## Environment Variables

Create `website/.env.local`:

```bash
JWT_SECRET=your-random-secret-key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_ID=your_domain_client_id
CLIENT_SECRET=your_domain_client_secret
```

Notes:

- `JWT_SECRET` is required for website authentication.
- `GEMINI_API_KEY` is optional and enables AI suggestions.
- `CLIENT_ID` and `CLIENT_SECRET` are optional for Domain API access in the Python flow.
- The website works without external APIs by using the bundled CSV dataset.

## Authentication Storage

The Next.js app now stores auth data in two places:

- Server-side account records are saved to `website/data/users.json`.
- The signed-in user profile is mirrored in browser `localStorage` for a smoother local experience.

Passwords are not stored in the browser. The server stores hashed passwords only.

If you want to reset local website accounts during development, stop the app and delete `website/data/users.json`.

## How Property Ranking Works

Each property is scored using the mock dataset:

- Rental yield score: based on `(rent_estimate * 52) / price`
- Capital growth score: based on land size and suburb category
- Risk score: based on flood, bushfire, and industrial-zone heuristics
- Final score: weighted combination of growth, yield, and risk

The website can also bias the ranking depending on whether the user is buying to live in the property or invest.

## Deployment Notes

The website builds cleanly as a Next.js 14 app and can be deployed to Vercel or another Node-compatible platform.

For local or demo deployment, the JSON auth store is fine. For real production usage, replace `website/data/users.json` with a proper database-backed auth system such as:

- Supabase
- Vercel Postgres
- Neon
- PlanetScale

The main migration point is [website/src/lib/auth.ts](website/src/lib/auth.ts), where file-based reads and writes can be replaced with database queries.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- jose for JWT handling
- bcryptjs for password hashing
- Google Gemini API
- pandas and Streamlit for the Python tools
