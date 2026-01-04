import requests
import base64
import pandas as pd
from dotenv import load_dotenv
import os
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


# Encode credentials for Authorization header
def get_Access_token(CLIENT_ID, CLIENT_SECRET):
    credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    url = "https://auth.domain.com.au/v1/connect/token"

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    data = {"grant_type": "client_credentials", "scope": "api_listings_read"}

    response = requests.post(url, headers=headers, data=data)
    token = response.json()["access_token"]

    # print("Access Token:", token)
    return token


Access_Token = get_Access_token(CLIENT_ID, CLIENT_SECRET)


def get_properties_from_mock_api(Access_Token):
    if Access_Token != None:
        project_root = Path(__file__).resolve().parent
        csv_path = project_root / "vic_properties_1000.csv"
        df = pd.read_csv(csv_path)
        return df
    else:
        print("Access Token is empty")


df = get_properties_from_mock_api(Access_Token)
# print(df.head())


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


# print(filter_properties(df,[400000,1000000],"House",[],0))
# print(rental_yield_score(df.iloc[0]))
df["yield_score"] = df.apply(rental_yield_score, axis=1)


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


df["growth_score"] = df.apply(capital_growth_score, axis=1)
# print(df.head())


def risk_score(row):
    score = 0
    if row["suburb"] in flood_prone_suburbs:
        score += 5
    if row["suburb"] in bushfire_risk_suburbs:
        score += 3
    if row["suburb"] in industrial_zones:
        score += 2

    return score


df["risk_score"] = df.apply(risk_score, axis=1)


def rank_properties(df, top_n=5):
    df = df.copy()

    # Compute final score
    df["final_score"] = (
        0.4 * df["growth_score"] + 0.4 * df["yield_score"] - 0.2 * df["risk_score"]
    )

    # Sort and select top properties
    top_properties = df.sort_values("final_score", ascending=False).head(top_n)

    return top_properties


top_properties = rank_properties(df, top_n=5)
# print(top_properties[["address", "suburb", "final_score"]])


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


user_profile = {
    "budget_range": [400000, 1000000],
    "preferred_suburbs": [],
}
# api_url = "https://api.domain.com.au/sandbox/v1/agencies/22473/listings?listingStatusFilter=live&pageNumber=1&pageSize=20"

# headers = {
#     "Authorization": f"Bearer {get_Access_token(CLIENT_ID,CLIENT_SECRET)}",
#     "Content-Type": "application/json",
#     "X-Api-Call-Source": "live-api-browser"
# }
# response = requests.get(api_url, headers=headers)
# if response != None:
#     print(response.json())


from google import genai
import json

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


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
    print(response.text)


llm_input = prepare_llm_input(top_properties, user_profile)
generate_gemini_investment_reasoning(llm_input, client)
