import requests
import base64
import pandas as pd
from dotenv import load_dotenv
import os
from google import genai
import json
import re
from pathlib import Path
from config import (
    city_suburbs,
    regional_suburbs,
    flood_prone_suburbs,
    bushfire_risk_suburbs,
    industrial_zones,
    SYSTEM_PROMPT,
)

load_dotenv()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CSV_COLUMNS = [
    "price",
    "rent_estimate",
    "property_type",
    "address",
    "suburb",
    "land_size",
    "bedrooms",
]


def load_csv_properties():
    csv_path = Path(__file__).resolve().parent / "vic_properties_1000.csv"
    return pd.read_csv(csv_path)


def _coerce_int(value, default=0):
    if value is None:
        return default
    if isinstance(value, (int, float)) and not pd.isna(value):
        return int(value)
    if isinstance(value, str):
        match = re.search(r"-?\d[\d,]*", value)
        if match:
            return int(match.group(0).replace(",", ""))
    return default


def _nested_get(data, *path):
    current = data
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _first_value(*values):
    for value in values:
        if value not in (None, "", [], {}):
            return value
    return None


def estimate_rent_from_yield_score(price, target_yield_score=4):
    if price <= 0:
        return 0
    annual_yield = target_yield_score / 100
    return int(round((price * annual_yield) / 52))


def _normalize_property_type(listing):
    property_type = _first_value(
        _nested_get(listing, "propertyDetails", "propertyType"),
        listing.get("propertyType"),
    )

    if property_type is None:
        property_types = listing.get("propertyTypes") or []
        if property_types:
            property_type = property_types[0]

    property_type = str(property_type or "Unknown").strip().lower()
    type_map = {
        "apartment": "Unit",
        "apartmentunitflat": "Unit",
        "unit": "Unit",
        "house": "House",
    }
    return type_map.get(property_type, property_type.title())


def _normalize_live_listing(listing):
    price = _coerce_int(
        _first_value(
            _nested_get(listing, "priceDetails", "price"),
            _nested_get(listing, "priceDetails", "displayPrice"),
            _nested_get(listing, "listingPrice"),
            listing.get("price"),
        )
    )
    rent_estimate = _coerce_int(
        _first_value(
            _nested_get(listing, "priceDetails", "rent"),
            _nested_get(listing, "priceDetails", "rentEstimate"),
            listing.get("rentEstimate"),
        )
    )
    if rent_estimate <= 0:
        rent_estimate = estimate_rent_from_yield_score(price)

    return {
        "price": price,
        "rent_estimate": rent_estimate,
        "property_type": _normalize_property_type(listing),
        "address": _first_value(
            _nested_get(listing, "addressParts", "displayAddress"),
            _nested_get(listing, "addressParts", "streetAddress"),
            listing.get("displayAddress"),
            listing.get("address"),
            "Address unavailable",
        ),
        "suburb": _first_value(
            _nested_get(listing, "addressParts", "suburb"),
            _nested_get(listing, "addressParts", "suburbName"),
            listing.get("suburb"),
            "Unknown",
        ),
        "land_size": _coerce_int(
            _first_value(
                listing.get("landArea"),
                listing.get("landSize"),
                _nested_get(listing, "propertyDetails", "landArea"),
                _nested_get(listing, "propertyDetails", "landSize"),
            )
        ),
        "bedrooms": _coerce_int(
            _first_value(
                listing.get("bedrooms"),
                _nested_get(listing, "propertyDetails", "bedrooms"),
            )
        ),
    }


def normalize_live_api_response(payload):
    listings = payload if isinstance(payload, list) else payload.get("listings", [])
    normalized_rows = [_normalize_live_listing(listing) for listing in listings]
    df = pd.DataFrame(normalized_rows, columns=CSV_COLUMNS)
    if df.empty:
        raise ValueError("Live API returned no listings.")
    df["property_type"] = df["property_type"].replace({"Apartment": "Unit"})
    df = df[df["price"] > 0].reset_index(drop=True)
    if df.empty:
        raise ValueError("Live API listings could not be normalized into usable rows.")
    return df


def get_Access_token(client_id, client_secret):
    credentials = f"{client_id}:{client_secret}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    url = "https://auth.domain.com.au/v1/connect/token"

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {"grant_type": "client_credentials", "scope": "api_listings_read"}

    response = requests.post(url, headers=headers, data=data, timeout=20)
    response.raise_for_status()
    token = response.json()["access_token"]

    # print("Access Token:", token)
    return token


def get_properties_from_live_api(access_token):
    api_url = "https://api.domain.com.au/sandbox/v1/agencies/22473/listings?listingStatusFilter=live&pageNumber=1&pageSize=20"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Api-Call-Source": "live-api-browser",
    }

    response = requests.get(api_url, headers=headers, timeout=20)
    response.raise_for_status()
    return normalize_live_api_response(response.json())


def load_properties():
    api_mode, api_message = check_API_Keys()
    if api_mode == "csv":
        return load_csv_properties(), "csv", api_message

    try:
        access_token = get_Access_token(CLIENT_ID, CLIENT_SECRET)
        live_df = get_properties_from_live_api(access_token)
        return live_df, "live", "Loaded live listings from the Domain API."
    except (requests.RequestException, KeyError, ValueError) as error:
        fallback_df = load_csv_properties()
        return (
            fallback_df,
            "csv_fallback",
            f"Live API failed ({error}). Falling back to local CSV.",
        )


def filter_properties(df, budget, property_type, suburbs, min_bedrooms):
    filtered = df[
        (df["price"] >= budget[0])
        & (df["price"] <= budget[1])
        & (df["bedrooms"] >= min_bedrooms)
    ]
    if property_type != "Any":
        filtered = filtered[filtered["property_type"] == property_type]
    if suburbs:
        filtered = filtered[filtered["suburb"].isin(suburbs)]
    return filtered


def rental_yield_score(data):
    yield_value = (data["rent_estimate"] * 52) / data["price"]
    return min(10, max(0, yield_value * 100))


def capital_growth_score(row):
    score = 0

    # Rule 1: Land size
    if row["land_size"] > 800:
        score += 4
    elif row["land_size"] > 600:
        score += 2
    # city suburbs growth better example
    if row["suburb"] in city_suburbs:
        score += 5
    elif row["suburb"] in regional_suburbs:
        score += 3

    return min(score, 10)


def risk_score(row):
    score = 0
    if row["suburb"] in flood_prone_suburbs:
        score += 5
    if row["suburb"] in bushfire_risk_suburbs:
        score += 3
    if row["suburb"] in industrial_zones:
        score += 2

    return score


def add_scores(df):
    df = df.copy()

    # Compute final score
    df["yield_score"] = df.apply(rental_yield_score, axis=1)
    df["growth_score"] = df.apply(capital_growth_score, axis=1)
    df["risk_score"] = df.apply(risk_score, axis=1)
    df["final_score"] = (
        0.4 * df["growth_score"] + 0.4 * df["yield_score"] - 0.2 * df["risk_score"]
    )
    return df


def rank_properties(df, top_n=5):
    df = df.copy()

    # Compute final score
    df["final_score"] = (
        0.4 * df["growth_score"] + 0.4 * df["yield_score"] - 0.2 * df["risk_score"]
    )

    # Sort and select top properties
    top_properties = df.sort_values("final_score", ascending=False).head(top_n)

    return top_properties


def prepare_llm_input(top_properties_df, user_profile):
    properties = []

    for _, row in top_properties_df.iterrows():
        properties.append(
            {
                "address": row["address"],
                "suburb": row["suburb"],
                "price": row["price"],
                "property_type": row["property_type"],
                "bedrooms": row["bedrooms"],
                "rent_estimate": row["rent_estimate"],
                "land_size": row["land_size"],
                "yield_score": round(row["yield_score"], 2),
                "growth_score": row["growth_score"],
                "risk_score": row["risk_score"],
                "final_score": round(row["final_score"], 3),
            }
        )

    return {"user_profile": user_profile, "recommended_properties": properties}


def check_API_Keys():
    if not CLIENT_ID or not CLIENT_SECRET:
        return "csv", "No Domain API keys found. Loaded local CSV."
    return "live_attempt", "Domain API keys found. Live API will be attempted."


def get_gemini_client():
    if not GEMINI_API_KEY:
        return None
    return genai.Client(api_key=GEMINI_API_KEY)


def generate_gemini_investment_reasoning(llm_input, client):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            {
                "role": "user",
                "parts": [
                    {"text": SYSTEM_PROMPT},
                    {
                        "text": "User profile:\n"
                        + json.dumps(llm_input["user_profile"], indent=2)
                    },
                    {
                        "text": "Recommended properties:\n"
                        + json.dumps(llm_input["recommended_properties"], indent=2)
                    },
                ],
            }
        ],
    )
    return response.text


def main():
    df, source, message = load_properties()
    print(message)
    df = add_scores(df)

    user_profile = {
        "budget_range": [400000, 1000000],
        "preferred_suburbs": [],
    }

    filtered = filter_properties(
        df,
        budget=user_profile["budget_range"],
        property_type="Any",
        suburbs=user_profile["preferred_suburbs"],
        min_bedrooms=0,
    )

    top_properties = rank_properties(filtered, top_n=5)

    print("\nTop Property Recommendations:\n")
    print(top_properties[["address", "suburb", "final_score"]])
    # reasoning = generate_gemini_investment_reasoning(llm_input, client)
    # if reasoning:
    #     print(reasoning)


if __name__ == "__main__":
    main()
