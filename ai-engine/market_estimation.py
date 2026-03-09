import sys
import pandas as pd
import json

text = sys.argv[1].lower()

if "finance" in text:
    industry = "FinTech"
elif "education" in text:
    industry = "EdTech"
elif "health" in text:
    industry = "HealthTech"
elif "software" in text:
    industry = "SaaS"
else:
    industry = "General"

df = pd.read_csv("ai-engine/datasets/industry_market.csv")
row = df[df["industry"] == industry].iloc[0]

result = {
    "industry": industry,
    "market_potential": row["potential"],
    "TAM": row["tam"],
    "SAM": row["sam"],
    "SOM": row["som"]
}

print(json.dumps(result))
