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

flood_prone_suburbs = ["Shepparton", "Warrnambool", "Traralgon"]

bushfire_risk_suburbs = ["Mildura", "Echuca", "Shepparton", "Ballarat", "Bendigo"]

industrial_zones = ["Sunshine", "Dandenong", "Werribee", "Footscray"]

SYSTEM_PROMPT = """
You are an AI real estate investment analyst.

RULES:
- Use ONLY the provided property data
- Do NOT invent prices, yields, or growth
- Be balanced and professional
- Clearly explain risks
- No financial guarantees
- Australian real estate context

OUTPUT STRUCTURE:
1. Summary of Recommended Properties
2. Pros and Cons (bullet points)
3. Investment Reasoning
4. Risk Explanation
"""
