import pandas as pd
import numpy as np
import random
from pathlib import Path

random.seed(42)
np.random.seed(42)

vic_suburbs = [
    "Richmond",
    "Fitzroy",
    "St Kilda",
    "Carlton",
    "Brunswick",
    "Geelong",
    "Ballarat",
    "Bendigo",
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
    "Shepparton",
    "Mildura",
    "Warrnambool",
    "Traralgon",
    "Echuca",
]


street_names = [
    "High St",
    "Main Rd",
    "Queen St",
    "King St",
    "Victoria Ave",
    "Smith St",
    "Chapel St",
    "Station St",
    "Bridge Rd",
    "Glenferrie Rd",
    "Lygon St",
]

n = 1000
data = []

for _ in range(n):
    suburb = random.choice(vic_suburbs)
    street = random.choice(street_names)
    number = random.randint(1, 300)
    address = f"{number} {street}"

    property_type = random.choice(["House", "Unit"])
    bedrooms = random.choices([1, 2, 3, 4, 5], weights=[5, 20, 40, 25, 10])[0]
    land_size = (
        random.randint(150, 1200)
        if property_type == "House"
        else random.randint(50, 300)
    )

    # Base price varies by property type and suburb
    base_price = {
        "House": random.randint(500000, 1200000),
        "Unit": random.randint(350000, 800000),
    }[property_type]

    # Add price variation based on size and bedrooms
    price = (
        base_price
        + bedrooms * 20000
        + (land_size * 20 if property_type == "House" else 0)
    )

    # Rent is weekly; approx 3-5% rental yield
    annual_rent = price * np.random.uniform(0.03, 0.05)
    rent_estimate = round(annual_rent / 52)

    data.append(
        {
            "price": int(price),
            "rent_estimate": int(rent_estimate),
            "property_type": property_type,
            "address": address,
            "suburb": suburb,
            "land_size": land_size,
            "bedrooms": bedrooms,
        }
    )

df = pd.DataFrame(data)
output_path = Path(__file__).resolve().parent / "vic_properties_1000.csv"
df.to_csv(output_path, index=False)
