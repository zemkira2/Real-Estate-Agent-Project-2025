import requests
import base64
import pandas as pd


CLIENT_ID = "client_e7e599072676e2b18682fa02c5687ab6"
CLIENT_SECRET = "secret_f06619135c23fdeac64817150c72eec0"

# Encode credentials for Authorization header
def get_Access_token(CLIENT_ID,CLIENT_SECRET):
    credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    url = "https://auth.domain.com.au/v1/connect/token"

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "client_credentials",
        "scope": "api_listings_read"    
    }

    response = requests.post(url, headers=headers, data=data)
    token = response.json()["access_token"]

    print("Access Token:", token)
    return token

Access_Token = get_Access_token(CLIENT_ID,CLIENT_SECRET)

def get_properties_from_mock_api(Access_Token):
    if(Access_Token != None):
        df = pd.read_csv("sample_properties.csv")
        return df
    else:
        print("Access Token is empty")

df = get_properties_from_mock_api(Access_Token)
# print(df.head())

def filter_properties(df, budget, property_type, suburbs, min_bedrooms):
    filtered = df[
        (df["price"] >= budget[0]) & (df["price"] <= budget[1]) &
        (df["bedrooms"] >= min_bedrooms)
    ]
    if property_type != "Any":
        filtered = filtered[filtered["property_type"] == property_type]
    if suburbs:
        filtered = filtered[filtered["suburb"].isin(suburbs)]
    return filtered

def rental_yield_score(row):
    yield_value = (row["rent_estimate"] * 52) / row["price"]
    return min(10, max(0, yield_value * 100))

print(filter_properties(df,[400000,500000],"Any","",0))
# api_url = "https://api.domain.com.au/sandbox/v1/agencies/22473/listings?listingStatusFilter=live&pageNumber=1&pageSize=20"

# headers = {
#     "Authorization": f"Bearer {get_Access_token(CLIENT_ID,CLIENT_SECRET)}",
#     "Content-Type": "application/json",
#     "X-Api-Call-Source": "live-api-browser"
# }
# response = requests.get(api_url, headers=headers)
# if response != None:
#     print(response.json())



