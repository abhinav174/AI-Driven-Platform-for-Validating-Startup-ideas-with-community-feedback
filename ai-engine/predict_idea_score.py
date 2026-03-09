import pickle
import random

model = pickle.load(open("ai-engine/models/idea_score_model.pkl","rb"))

features = [[
    random.randint(5,10),
    random.randint(5,10),
    random.randint(5,10)
]]

score = model.predict(features)
print(round(float(score[0]),2))
