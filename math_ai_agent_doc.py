# ✅ Minimal LLaMA3 Tool-Calling Agent (No LangChain Agent)
# Uses Ollama (LLaMA3) to parse natural language into JSON for tool execution

import json
import subprocess
import sys
from pathlib import Path
from PyPDF2 import PdfReader
import smtplib
from email.message import EmailMessage
import re
from email.mime.text import MIMEText
import base64
from gmail_auth import get_gmail_service

import requests
LLM_URL     = "http://localhost:11434"
# === STEP 1: Define local tools ===
def add_numbers(numbers):
    print("[DEBUG] add_numbers() called")
    return sum(numbers)

def subtract(a, b):
    print("[DEBUG] subtract() called")
    return a - b

def multiply(numbers):
    print("[DEBUG] multiply() called")
    result = 1
    for n in numbers:
        result *= n
    return result

def divide(a, b):
    print("[DEBUG] divide() called")
    if b == 0:
        return "Error: Division by zero"
    return a / b

def get_weather(city):
    print(f"[DEBUG] get_weather() called with city={city}")
    return f"The weather in {city} is 25°C and sunny (hardcoded)"

def analyze_document(path):
    print(f"[DEBUG] analyze_document() called with path={path}")
    file_path = Path(path)

    if not file_path.exists():
        return f"File not found: {path}"
        
    # Read text based on file type
    if file_path.suffix.lower() == ".txt":
        text = file_path.read_text(encoding="utf-8")
    elif file_path.suffix.lower() == ".pdf":
        reader = PdfReader(str(file_path))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        return "Unsupported file type. Only .txt and .pdf are supported."

    # Send summary request to LLaMA3
    print("[INFO] Sending document content for summarization...")
    prompt = f"Please summarize or analyze the following document content:\n{text[:4000]}"  # Truncate for safety
    response = call_llama3(prompt)
    return response.strip()

def send_email(to_address: str, subject: str, body: str):
    service = get_gmail_service()

    message = MIMEText(body)
    message['to'] = to_address
    message['from'] = "me"
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    message_body = {'raw': raw}

    send_result = service.users().messages().send(userId="me", body=message_body).execute()
    print("send_result is {}".format(send_result))
    return f"✅ Email sent! ID: {send_result['id']}"

def email_agent(query: str) -> str:
    # Updated regex with non-greedy and greedy match groups
    pattern = r"send email to (?P<to>.+?) subject (?P<subject>.+) body (?P<body>.+)"
    match = re.match(pattern, query, re.IGNORECASE)
    if not match:
        return "❌ Could not parse the email format. Use: send email to [recipient] subject [subject] body [message]."

    try:
        to = match.group("to").strip()
        subject = match.group("subject").strip()
        body = match.group("body").strip()
        return send_email(to, subject, body)
    except Exception as e:
        return f"❌ Failed to send email: {str(e)}"

# === STEP 2: Define tool registry ===
tool_registry = {
    "add_numbers": add_numbers,
    "subtract": subtract,
    "multiply": multiply,
    "divide": divide,
    "get_weather": get_weather,
    "email_agent": email_agent,
    "analyze_document": analyze_document
}

# === STEP 3: Use LLaMA3 via Ollama to parse the user's intent ===
def call_llama3(prompt):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )
    return response.json()["response"]

# === STEP 4: Parse intent and execute tools manually ===
def process_input(user_query):
    print("\n[INFO] [process_input] Sending prompt to LLaMA3...")
    system_prompt = (
        "You are an AI tool-calling assistant."
        " Read the user's query and return an output in JSON object in the format: {\"tool\": tool_name, \"args\": arguments}."
        "\nAvailable tools are:"
        " add_numbers(numbers: list of numbers) : returns the result of addition"
        " subtract(a: number, b: number) : returns the result of substraction"
        " multiply(numbers: list of numbers) : returns the result of multiplication"
        " divide(a: number, b: number) : returns the result of division"
        " get_weather(city: string) : returns the weather of the city passed as a parameter."
        " analyze_document(path: string) : analyzes or summarizes a text or PDF document from the specified file path."
        " email_agent(query: string) : sends email to the mentioned recipients with subject and body."
        "\nIf there is no available tool for the respective user input, then just return { \"tool\": null, \"args\": { \"query\": \"...\" } }"
        "\nONLY return a valid JSON. No explanation, no markdown."
    )

    full_prompt = system_prompt + f"\nUser: {user_query}\n"
    output = call_llama3(full_prompt)

    try:
        print(f"[DEBUG] LLaMA3 output: {output}")
        tool_call = json.loads(output)
        tool_name = tool_call["tool"]
        args = tool_call["args"]

        if tool_name in tool_registry:
            result = tool_registry[tool_name](**args)
            print("✅ Tool {} returned: {}".format(tool_name, result))
            return f"{result}"

        elif tool_name is None:
            # Fallback to direct LLM response
            print("[INFO] No tool used. Asking LLaMA3 directly for response...")
            response = call_llama3(args.get("query", user_query))
            return f"{response}"

        else:
            return f"❌ Unknown tool: {tool_name}"

    except json.JSONDecodeError:
        return "❌ Invalid JSON from LLaMA3. Falling back to chat mode:\n" + call_llama3(user_query)

    except Exception as e:
        return f"❌ Error while executing tool: {e}"


# === CLI Entry Point ===
if __name__ == "__main__":
    print("🤖 LLaMA3 Tool Executor (no LangChain)")
    while True:
        user_input = input("\n🧠 Your query (or 'exit'): ")
        if user_input.strip().lower() in ["exit", "quit"]:
            break
        process_input(user_input)
