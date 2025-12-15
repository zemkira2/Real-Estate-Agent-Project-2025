import requests

client_id = "client_a389335dfc0682849f729cc801f16525"
client_secret = "secret_5df4c7d71b83e8e07a10d52120d3759f"

AUTH_URL = "https://auth.domain.com.au/v1/connect/token"
SCOPE = "api_listings_read"

def get_access_token():
    res = requests.post(
        AUTH_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": SCOPE,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return res.json()["access_token"]


def get_listing_ids(access_token, agency_id=22473, page_size=3):
    url = f"https://api.domain.com.au/sandbox/v1/agencies/{agency_id}/listings"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "listingStatusFilter": "live",
        "pageNumber": 1,
        "pageSize": page_size,
    }

    res = requests.get(url, headers=headers, params=params)
    res.raise_for_status()
    data = res.json()
    print(data)
    return [item["id"] for item in data]


def get_listing_detail(access_token, listing_id):
    url = f"https://api.domain.com.au/sandbox/v1/listings/{listing_id}"
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get(url, headers=headers)
    res.raise_for_status()
    return res.json()


def main():
    token = get_access_token()
    listing_ids = get_listing_ids(token, agency_id=22473, page_size=3)
    print("Listing IDs:", listing_ids)

    for lid in listing_ids:
        detail = get_listing_detail(token, lid)
        print("\n==== LISTING", lid, "====")
        print(detail)  # first time: inspect structure

main()
