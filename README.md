# Real Estate Agent Project

This project ranks properties from a CSV file using rule-based investment logic and can optionally generate Gemini explanations. It defaults to **mock/CSV mode** when API keys are missing, so you can run it on any machine.

## Requirements

- Python 3.9+
- `pip install -r requirements.txt`

## Environment Variables

Create a `.env` file in the project root (optional):

```bash
# Optional: Domain API credentials (enables live token fetch)
CLIENT_ID=your_domain_client_id
CLIENT_SECRET=your_domain_client_secret

# Optional: Gemini SDK key (enables LLM reasoning)
GEMINI_API_KEY=your_gemini_api_key
```

If you omit these values, the project still runs in **mock/CSV mode** and outputs recommendations from the local CSV.

## How to Run

1. (Optional) Regenerate mock data:

   ```bash
   python processing_Data.py
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the project:

   ```bash
   python Project.py
   ```

The script prints top property recommendations from `vic_properties_1000.csv`. If `GEMINI_API_KEY` is set, it will also generate Gemini reasoning output.
