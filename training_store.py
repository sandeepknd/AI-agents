# File: training_store.py

import json
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
import torch

TRAINING_FILE = Path("training_data.json")

def save_issue_resolution(issue, resolution):
    training_data = []
    if TRAINING_FILE.exists():
        training_data = json.loads(TRAINING_FILE.read_text())

    training_data.append({
        "issue": issue,
        "resolution": resolution
    })
    TRAINING_FILE.write_text(json.dumps(training_data, indent=2))



model = SentenceTransformer("all-MiniLM-L6-v2")

def load_training_data():
    if TRAINING_FILE.exists():
        return json.loads(TRAINING_FILE.read_text())
    return []

def find_similar_issues(query, top_k=3):
    data = load_training_data()
    if not data:
        return []

    issues = [item["issue"] for item in data]
    corpus_embeddings = model.encode(issues, convert_to_tensor=True)
    query_embedding = model.encode(query, convert_to_tensor=True)

    hits = util.semantic_search(query_embedding, corpus_embeddings, top_k=top_k)[0]

    return [data[hit['corpus_id']] for hit in hits]

