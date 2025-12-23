import requests
import base64
import pandas as pd


CLIENT_ID = "client_e7e599072676e2b18682fa02c5687ab6"
CLIENT_SECRET = "secret_f06619135c23fdeac64817150c72eec0"


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

    print("Access Token:", token)
    return token


# Access_Token = get_Access_token(CLIENT_ID,CLIENT_SECRET)


def get_properties_from_mock_api(Access_Token):
    if Access_Token != None:
        df = pd.read_csv("vic_properties_1000.csv")
        return df
    else:
        print("Access Token is empty")


df = get_properties_from_mock_api("haha123")
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

city_suburbs = [
    "Richmond",
    "Fitzroy",
    "St Kilda",
    "Carlton",
    "Brunswick",
    "Frankston",
    "Werribee",
    "Dandenong",
    "Sunshine",
    "Box Hill",
    "Essendon",
    "Preston",
    "Reservoir",
    "South Yarra",
    "Toorak",
    "Hawthorn",
    "Footscray",
]

regional_suburbs = [
    "Geelong",
    "Ballarat",
    "Bendigo",
    "Shepparton",
    "Mildura",
    "Warrnambool",
    "Traralgon",
    "Echuca",
]


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
print(df.head())


def risk_score(row):
    # Rule 1: Flood-prone suburbs
    flood_prone_suburbs = ["Shepparton", "Warrnambool", "Traralgon"]

    # Rule 2: Bushfire-prone suburbs
    bushfire_risk_suburbs = ["Mildura", "Echuca", "Shepparton", "Ballarat", "Bendigo"]

    # Rule 3: Industrial zones or close to them
    industrial_zones = ["Sunshine", "Dandenong", "Werribee", "Footscray"]

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
print(top_properties[["address", "suburb", "final_score"]])


# api_url = "https://api.domain.com.au/sandbox/v1/agencies/22473/listings?listingStatusFilter=live&pageNumber=1&pageSize=20"

# headers = {
#     "Authorization": f"Bearer {get_Access_token(CLIENT_ID,CLIENT_SECRET)}",
#     "Content-Type": "application/json",
#     "X-Api-Call-Source": "live-api-browser"
# }
# response = requests.get(api_url, headers=headers)
# if response != None:
#     print(response.json())
