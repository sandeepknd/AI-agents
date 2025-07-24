# main_api.py (FastAPI backend)
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from math_ai_agent_doc import process_input, call_llama3  # import your function
from fastapi import UploadFile, File
from rag_log_analyzer import build_vectorstore, get_qa_chain, build_vectorstore_from_all_logs
import os, shutil
from PyPDF2 import PdfReader


UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app = FastAPI()

# Allow local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

'''
@app.post("/ask")
async def ask_agent(req: QueryRequest):
    response = process_input(req.query)
    return {"response": response}
'''

@app.post("/ask")
#async def ask(query: dict):
async def ask(req: QueryRequest):
    #question = query.get("query", "").lower()
    question = req.query.lower()

    # Heuristics to detect if it's a log-related query
    log_keywords = ["log", "error", "stacktrace", "traceback", "exception", "debug", "crash", "warning", "failure", "summar"]

    if any(kw in question for kw in log_keywords):
        # Use RAG for log-related query
        qa = get_qa_chain()
        result = qa.run(question)
    else:
        result = process_input(req.query)

    return {"response": result}


def extract_text(file_path: str) -> str:
    if file_path.endswith(".pdf"):
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        return "Unsupported file format"

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    text = extract_text(file_path)
    analysis_prompt = f"Please summarize the following document:\n\n{text[:4000]}"  # limit size

    #from math_ai_agent_doc import call_llama3  # or wherever your LLaMA3 call is defined
    summary = call_llama3(analysis_prompt)

    return {"summary": summary.strip()}

@app.post("/upload-log")
async def upload_log(file: UploadFile = File(...)):
    os.makedirs("logs", exist_ok=True)
    filepath = f"logs/{file.filename}"
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    #build_vectorstore(filepath)
    build_vectorstore_from_all_logs()  # Consolidated across all logs
    #return {"summary": f"{file.filename} uploaded and indexed successfully."}
    return {"summary": f"{file.filename} uploaded and all logs re-indexed."}

@app.post("/analyze-log")
async def analyze_log(query: dict):
    question = query.get("query", "")
    qa = get_qa_chain()
    result = qa.run(question)
    return {"response": result}
