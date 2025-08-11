# gmail_auth.py
import os.path
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Scopes: Full Gmail access
#SCOPES = ['https://www.googleapis.com/auth/gmail.send']
#SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.readonly', 'openid', 'email', 'profile']
SCOPES = ['https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.readonly']
MAIL_TOKEN = 'token_mail.pickle'
MAIL_CREDENTIALS = 'credentials_rh_mail.json'



def get_gmail_service():
    creds = None

    # Load token if available
    if os.path.exists(MAIL_TOKEN):
        with open(MAIL_TOKEN, 'rb') as token:
            creds = pickle.load(token)

    # If no valid token, start OAuth
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                MAIL_CREDENTIALS, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(MAIL_TOKEN, 'wb') as token:
            pickle.dump(creds, token)

    return build('gmail', 'v1', credentials=creds)

