# main_api.py (FastAPI backend)
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from math_ai_agent_doc import process_input, call_llama3  # import your function
from fastapi import UploadFile, File
from rag_log_analyzer import build_vectorstore, get_qa_chain, build_vectorstore_from_all_logs
import os, shutil, json, pytz
from PyPDF2 import PdfReader
#------------For Calendar --------------
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import Optional
from datetime import datetime, timedelta




app = FastAPI()
UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)





# -------------------------------
# Calendar Configuration 
# -------------------------------
CLIENT_SECRETS_FILE = "credentials_calendar.json"  # Download from Google Cloud
SCOPES = ["https://www.googleapis.com/auth/calendar"]
REDIRECT_URI = "http://localhost:8000/oauth2callback"
TOKEN_FILE = "token.json"

#os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # Allow HTTP for local dev


def build_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, [SCOPES])
    if not creds or not creds.valid:
        raise Exception("Invalid or missing credentials. Please authorize first.")
    return build("calendar", "v3", credentials=creds)

# -------------------------------
# STEP 1: AUTHORIZATION URL
# -------------------------------
@app.get("/authorize-calendar")
def authorize_calendar():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    auth_url, state = flow.authorization_url(prompt="consent")
    return RedirectResponse(auth_url)

# -------------------------------
# STEP 2: CALLBACK HANDLER
# -------------------------------
@app.get("/oauth2callback")
def oauth2callback(request: Request):
    try:
        # Extract query params
        code = request.query_params.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Missing authorization code")

        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )

        # Fetch token using the authorization code
        flow.fetch_token(code=code)

        credentials = flow.credentials

        # Save credentials to token.json for reuse
        with open(TOKEN_FILE, "w") as token:
            token.write(credentials.to_json())

        return JSONResponse({"message": "Authorization successful. You can now use Calendar API."})

    except Exception as e:
        print(f"OAuth Error: {str(e)}")
        raise HTTPException(status_code=500, detail="OAuth failed")
# -------------------------------
# STEP 3: LIST UPCOMING EVENTS
# -------------------------------
@app.get("/get-events")
def get_events():
    if not os.path.exists(TOKEN_FILE):
        raise HTTPException(status_code=400, detail="Authorize first at /authorize-calendar")

    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    try:
        service = build("calendar", "v3", credentials=creds)

        events_result = service.events().list(
            calendarId="primary",
            maxResults=10,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        events = events_result.get("items", [])
        if not events:
            return {"message": "No upcoming events found."}

        formatted_events = []
        for event in events:
            start = event["start"].get("dateTime", event["start"].get("date"))
            formatted_events.append({"summary": event["summary"], "start": start})

        return {"events": formatted_events}

    except Exception as e:
        print(f"Calendar API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch events")

# -------------------------------
# STEP 4: CREATE EVENT
# -------------------------------
@app.post("/create-event")
async def create_event(request: Request):
    if not os.path.exists(TOKEN_FILE):
        raise HTTPException(status_code=400, detail="Authorize first at /authorize-calendar")

    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    try:
        data = await request.json()
        summary = data.get("summary")
        start_time = data.get("start")
        end_time = data.get("end")

        if not (summary and start_time and end_time):
            raise HTTPException(status_code=400, detail="Missing required fields")

        service = build("calendar", "v3", credentials=creds)
        event = {
            "summary": summary,
            "start": {"dateTime": start_time, "timeZone": "Asia/Kolkata"},
            "end": {"dateTime": end_time, "timeZone": "Asia/Kolkata"},
        }

        created_event = service.events().insert(calendarId="primary", body=event).execute()
        return {"message": "Event created", "eventLink": created_event.get("htmlLink")}

    except Exception as e:
        print(f"Create Event Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create event")


# -------------------------------
# STEP 4: Retrieve events by date
# -------------------------------
@app.get("/get-events-by-date")
def get_events_by_date(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    try:
        service = build_service()

        # Parse input date
        user_date = datetime.strptime(date, "%Y-%m-%d")
        timezone = pytz.timezone("Asia/Kolkata")  # Change as needed
        start_of_day = timezone.localize(datetime(user_date.year, user_date.month, user_date.day, 0, 0, 0))
        end_of_day = start_of_day + timedelta(days=1)

        events_result = service.events().list(
            calendarId="primary",
            timeMin=start_of_day.isoformat(),
            timeMax=end_of_day.isoformat(),
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        events = events_result.get("items", [])
        if not events:
            return {"message": f"No events found for {date}"}
        print('events -> {}'.format(events[0]))
        formatted_events = [
            {
                "summary": event.get("summary", "No Title"),
                "start": event.get("start", {}).get("dateTime", event.get("start", {}).get("date")),
                "end": event.get("end", {}).get("dateTime", event.get("end", {}).get("date")),
                "link": event.get("hangoutLink", ""),
                "attendees": [a.get("email") for a in event.get("attendees", [])] if event.get("attendees") else [],
                "location": event.get("location", "N/A")
            }
            for event in events
        ]
        return {"date": date, "events": formatted_events}
    except Exception as e:
        print("Error:", str(e))
        return {"error": str(e)}
#------------------end of Calendar support-----------------







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
