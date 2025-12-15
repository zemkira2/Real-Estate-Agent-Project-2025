import streamlit as st
import pandas as pd
import numpy as np

st.set_page_config(page_title="🏠 AI Buyer Agent", layout="wide")
st.title("🏠 AI Buyer Agent – Property Recommendation System")
st.markdown("Upload your dataset or use the default sample. Filter properties, and get investment recommendations!")

# === Load CSV ===
@st.cache_data
def load_data(file):
    df = pd.read_csv(file)
    return df

sample_file = "sample_properties.csv"  # replace this with your actual CSV path
uploaded_file = st.file_uploader("Upload your property CSV", type=["csv"])

if uploaded_file:
    df = load_data(uploaded_file)
else:
    df = load_data(sample_file)

st.subheader("📊 Dataset Preview")
st.dataframe(df.head())

# === User Input ===
st.sidebar.header("🔍 Filter Preferences")

budget = st.sidebar.slider("Budget Range ($)", min_value=100000, max_value=2000000, step=50000, value=(400000, 1000000))
property_type = st.sidebar.selectbox("Property Type", options=["Any", "House", "Unit"])
suburb = st.sidebar.multiselect("Preferred Suburbs", options=sorted(df["suburb"].unique()))
bedrooms = st.sidebar.slider("Minimum Bedrooms", 1, 6, 2)

# === Filtering ===
filtered = df[
    (df["price"] >= budget[0]) & (df["price"] <= budget[1]) &
    (df["bedrooms"] >= bedrooms)
]

if property_type != "Any":
    filtered = filtered[filtered["property_type"] == property_type]

if suburb:
    filtered = filtered[filtered["suburb"].isin(suburb)]

st.subheader("🏘️ Filtered Properties")
st.write(f"Showing {len(filtered)} properties after filtering.")
st.dataframe(filtered.head(10))

# === Evaluation Functions ===
def rental_yield(row):
    return (row["rent_estimate"] * 52) / row["price"]

def growth_score(row):
    score = 0
    if row["land_size"] > 600:
        score += 5
    if row["suburb"] in ["HighGrowthville", "FastBoomTown"]:
        score += 5
    elif row["suburb"] in ["RegionalTown"]:
        score += 3
    return score

def risk_score(row):
    score = 0
    if row["suburb"] in ["FloodZone"]:
        score += 5
    if row["suburb"] in ["IndustrialArea"]:
        score += 2
    return score

def evaluate(df):
    df = df.copy()
    df["yield"] = df.apply(rental_yield, axis=1)
    df["yield_score"] = np.interp(df["yield"], [0, 0.1], [0, 10])
    df["growth_score"] = df.apply(growth_score, axis=1)
    df["risk_score"] = df.apply(risk_score, axis=1)
    df["final_score"] = 0.4 * df["yield_score"] + 0.4 * df["growth_score"] - 0.2 * df["risk_score"]
    return df.sort_values("final_score", ascending=False)

# === Ranking ===
if st.button("🚀 Recommend Properties"):
    if filtered.empty:
        st.warning("No properties match your filters.")
    else:
        ranked = evaluate(filtered)
        top_n = ranked.head(5).reset_index(drop=True)
        st.success("Here are your top recommendations:")
        st.dataframe(top_n)

        # Placeholder for LLM reasoning
        st.subheader("🧠 AI Explanation (Coming Soon)")
        st.info("This section will explain *why* each property is recommended using an LLM.")

