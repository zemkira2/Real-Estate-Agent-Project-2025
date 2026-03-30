# Real Estate Agent Project

AI-powered property recommendation system for Australian real estate. Includes both a Python CLI/Streamlit backend and a Next.js web application with user authentication and AI-driven suggestions.

## Project Structure

```
├── Project.py              # Python CLI: scoring, filtering, Gemini reasoning
├── front_end.py            # Streamlit UI (legacy)
├── processing_Data.py      # CSV data generator (1000 VIC properties)
├── config.py               # Scoring rules and LLM system prompt
├── vic_properties_1000.csv # Mock property dataset
├── requirements.txt        # Python dependencies
└── website/                # Next.js web application
    ├── src/
    │   ├── app/            # Pages and API routes
    │   ├── lib/            # Auth, scoring, data loading
    │   └── components/     # Reusable UI components
    └── public/data/        # CSV data for the website
```

## Features

- **User Authentication** - Sign up and log in with email/password (JWT-based)
- **Smart Search** - Filter by price range, location, property type, bedrooms
- **Purpose Selection** - Choose "Live" or "Invest" for tailored recommendations
- **Rule-Based Scoring** - Rental yield, capital growth, and risk evaluation
- **AI Suggestions** - Gemini-powered analysis with pros, cons, and risk explanations
- **Responsive UI** - Clean, modern interface with no technical errors shown to users

## Requirements

### Python (CLI / Streamlit)

- Python 3.9+
- `pip install -r requirements.txt`

### Website (Next.js)

- Node.js 18+
- npm

## Quick Start

### Option 1: Next.js Website (Recommended)

```bash
cd website
npm install
cp .env.local.example .env.local   # then edit with your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Python CLI

```bash
pip install -r requirements.txt
python Project.py
```

### Option 3: Streamlit UI

```bash
pip install -r requirements.txt
python -m streamlit run front_end.py
```

## Environment Variables

Create a `.env.local` file in the `website/` directory:

```bash
# Required: Secret key for JWT authentication
JWT_SECRET=your-random-secret-key

# Optional: Gemini API key (enables AI suggestions)
GEMINI_API_KEY=your_gemini_api_key

# Optional: Domain API credentials (enables live property data)
CLIENT_ID=your_domain_client_id
CLIENT_SECRET=your_domain_client_secret
```

The website works without API keys -- it loads property data from the CSV file. AI suggestions require a Gemini API key.

## How It Works

1. **Data Loading** - Properties are loaded from `vic_properties_1000.csv` (1000 mock VIC properties)
2. **Scoring** - Each property is scored on:
   - **Rental Yield** (0-10): Based on `(rent * 52) / price`
   - **Capital Growth** (0-10): Land size + suburb location rules
   - **Risk** (0-10): Flood, bushfire, and industrial zone penalties
3. **Ranking** - Final score = `0.4 * growth + 0.4 * yield - 0.2 * risk` (adjusted by purpose)
4. **AI Analysis** - Gemini generates natural-language explanations for recommended properties

## Deployment

### Vercel (Recommended for Website)

The Next.js website is ready for Vercel deployment:

```bash
cd website
npx vercel
```

**Important:** For production, you need a real database for user authentication. See the Database section below.

### Database Suggestions

The current implementation uses in-memory storage for user accounts (suitable for development). For production deployment on Vercel, consider:

| Database | Free Tier | Best For | Setup |
|----------|-----------|----------|-------|
| **Supabase** | 500MB, 50K rows | Full-featured (auth + DB) | [supabase.com](https://supabase.com) |
| **Vercel Postgres** | 256MB | Tight Vercel integration | Vercel dashboard |
| **PlanetScale** | 1GB, 1B reads | MySQL-compatible, branching | [planetscale.com](https://planetscale.com) |
| **Neon** | 512MB | Serverless Postgres | [neon.tech](https://neon.tech) |

**Recommended:** Supabase -- provides both PostgreSQL database and built-in authentication, has a generous free tier, and integrates well with Next.js.

To migrate from in-memory to a database:
1. Replace the `users` Map in `website/src/lib/auth.ts` with database queries
2. Add a `users` table with columns: `id`, `email`, `password_hash`, `name`, `created_at`
3. Install the database client library (e.g., `@supabase/supabase-js`)

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, TypeScript
- **Auth**: JWT (jose) + bcryptjs
- **AI**: Google Gemini API
- **Data**: CSV-based mock dataset (1000 VIC properties)
- **Python Backend**: pandas, Streamlit, google-genai
