# Real Estate Agent Project

This project ranks Victorian properties with rule-based investment logic and can optionally generate Gemini explanations. It is designed to run on a fresh machine with no `.env` file by loading the bundled CSV dataset.

## Requirements

- Python 3.9+
- `pip install -r requirements.txt`

## Environment Variables

Create a `.env` file in the project root only if you want live integrations:

```bash
# Optional: Domain API credentials (attempts live Domain listings first)
CLIENT_ID=your_domain_client_id
CLIENT_SECRET=your_domain_client_secret

# Optional: Gemini SDK key (enables LLM reasoning)
GEMINI_API_KEY=your_gemini_api_key
```

If you omit these values, the project still runs from `vic_properties_1000.csv` and shows recommendations locally.

## Data Loading Behaviour

The app now uses the same loading logic in both CLI and Streamlit:

- No `CLIENT_ID` or `CLIENT_SECRET`: load `vic_properties_1000.csv` directly.
- Keys available: request a Domain access token, then try the live listings API.
- Live API failure for any reason: fall back to `vic_properties_1000.csv`.

When live data is returned, it is normalized into the same structure used by the CSV before filtering and ranking:

- `price`
- `rent_estimate`
- `property_type`
- `address`
- `suburb`
- `land_size`
- `bedrooms`

If the live payload does not include a rent estimate, the app derives one from the same target yield assumption used to keep the scoring pipeline running.

## How to Run

1. (Optional) Regenerate the local CSV dataset:

   ```bash
   python processing_Data.py
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the CLI script:

   ```bash
   python Project.py
   ```

CLI behavior:

- Always prints top recommendations.
- Uses live Domain data only when both Domain keys are present and the live request succeeds.
- Falls back to the local CSV automatically if keys are missing or the live request fails.
- Gemini reasoning is available only if `GEMINI_API_KEY` is set. The current CLI script prints recommendations only; Gemini helper functions are present in code but not wired into the CLI output flow.

## Streamlit UI

To launch the Streamlit interface (after installing dependencies):

```bash
python -m streamlit run front_end.py
```

Streamlit behavior:

- Always loads recommendation data, even with no `.env` file.
- Shows whether the current session is using live Domain data or CSV fallback.
- Supports sidebar filtering and top-ranked property display.
- Gemini reasoning button works only when `GEMINI_API_KEY` is configured.
