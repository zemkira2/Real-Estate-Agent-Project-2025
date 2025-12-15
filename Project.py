import requests
import base64

CLIENT_ID = "client_e7e599072676e2b18682fa02c5687ab6"
CLIENT_SECRET = "secret_f06619135c23fdeac64817150c72eec0"

# Encode credentials for Authorization header
credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
encoded_credentials = base64.b64encode(credentials.encode()).decode()

url = "https://auth.domain.com.au/v1/connect/token"

headers = {
    "Authorization": f"Basic {encoded_credentials}",
    "Content-Type": "application/x-www-form-urlencoded"
}

data = {
    "grant_type": "client_credentials",
    "scope": "api_listings_read"     # request permissions
}

response = requests.post(url, headers=headers, data=data)
token = response.json()["access_token"]

print("Access Token:", token)

api_url = "https://api.domain.com.au/sandbox/v1/agencies/22473/listings?listingStatusFilter=live&pageNumber=1&pageSize=20"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "X-Api-Call-Source": "live-api-browser"
}



response = requests.get(api_url, headers=headers)

print(response.json())