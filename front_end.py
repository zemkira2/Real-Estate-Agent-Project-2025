import streamlit as st

from Project import (
    add_scores,
    filter_properties,
    generate_gemini_investment_reasoning,
    get_gemini_client,
    get_properties_from_mock_api,
    prepare_llm_input,
    rank_properties,
    Access_Token,
)

st.set_page_config(page_title="Real Estate Agent", layout="wide")

st.title("Real Estate Agent")
st.write(
    "Browse mock property recommendations from the CSV. "
    "Gemini reasoning appears when `GEMINI_API_KEY` is configured."
)

df = get_properties_from_mock_api(Access_Token)
df = add_scores(df)

st.sidebar.header("Search Criteria")

budget_min = st.sidebar.number_input(
    "Min budget", min_value=0, value=400000, step=10000
)
budget_max = st.sidebar.number_input(
    "Max budget", min_value=0, value=1000000, step=10000
)

all_suburbs = sorted(df["suburb"].unique().tolist())
selected_suburbs = st.sidebar.multiselect("Preferred suburbs", options=all_suburbs)

property_type = st.sidebar.selectbox("Property type", ["Any", "House", "Unit"])

filtered = filter_properties(
    df,
    budget=[budget_min, budget_max],
    property_type=property_type,
    suburbs=selected_suburbs,
    min_bedrooms=0,
)

if filtered.empty:
    st.warning("No properties match your criteria. Try widening your search.")
    st.stop()

top_properties = rank_properties(filtered, top_n=5)

st.subheader("Top Recommendations")
st.dataframe(
    top_properties[
        [
            "address",
            "suburb",
            "price",
            "property_type",
            "bedrooms",
            "rent_estimate",
            "final_score",
        ]
    ].reset_index(drop=True),
    use_container_width=True,
)

user_profile = {
    "budget_range": [budget_min, budget_max],
    "preferred_suburbs": selected_suburbs,
    "property_type": property_type,
}

llm_input = prepare_llm_input(top_properties, user_profile)
client = get_gemini_client()
# reasoning = generate_gemini_investment_reasoning(llm_input, client)

st.subheader("LLM Reasoning")
if st.button("Generate LLM reasoning"):
    with st.spinner(
        "Generating...",
    ):
        reasoning = generate_gemini_investment_reasoning(llm_input, client)
        st.write(reasoning)
