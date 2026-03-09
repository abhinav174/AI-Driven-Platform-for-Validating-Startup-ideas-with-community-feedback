from sklearn.feature_extraction.text import TfidfVectorizer

def tfidf_matrix(texts):
    vectorizer = TfidfVectorizer(stop_words="english")
    return vectorizer.fit_transform(texts)
