import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle

data = {
    "innovation": [6,7,8,9,5],
    "feasibility": [7,6,8,7,5],
    "impact": [8,9,7,9,6],
    "score": [70,75,85,90,65]
}

df = pd.DataFrame(data)
X = df[["innovation","feasibility","impact"]]
y = df["score"]

model = RandomForestRegressor()
model.fit(X,y)

pickle.dump(model, open("models/idea_score_model.pkl","wb"))
