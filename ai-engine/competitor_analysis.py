import sys
import pandas as pd
import json
from sklearn.metrics.pairwise import cosine_similarity
from nlp_utils import tfidf_matrix

idea = sys.argv[1]

df = pd.read_csv("ai-engine/datasets/startups.csv")

texts = df["description"].tolist()
texts.append(idea)

matrix = tfidf_matrix(texts)
scores = cosine_similarity(matrix[-1], matrix[:-1])[0]

top = scores.argsort()[-3:][::-1]

result = []
for i in top:
    result.append({
        "name": df.iloc[i]["name"],
        "industry": df.iloc[i]["industry"],
        "similarity": round(float(scores[i]), 2)
    })

print(json.dumps(result))
