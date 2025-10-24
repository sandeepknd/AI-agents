# AI-Assistant 
## 🚀 Overview

This is an AI-assistant designed to facilitate efficient machine learning model training (It is is RAG based. It stores the issues and respective resolutions fed to the model as part of the training, in the local vector db. When the user sends out any troubleshooting query, it queries the local vector database and fetches three most relevant resolutions based on the trained history. Then it adds these results to the actual user query and sends them to LLM for the final answer which is eventually presented to the user.), to automate the pull request (PR) review process with deatiled comments on code quality and optimization, to manage gmail calendar, to compose and send/delete mail with voice controlled instructions and to summarize logs/documents/reports.   

It uses python (as the backend) wrapped in FastAPI and React as the Frontend. 



## 🛠️ Getting Started

**Prerequisites**

Python 3.8+

Install ollama 

`curl -fsSL https://ollama.com/install.sh | sh`

run the backend from the AI-agents directory where main_fastapi.py exists

`uvicorn main_fastapi:app --reload --host 0.0.0.0 --port 8000`

run the frontend from the ai-agent-ui directory. 

`npm start`

## 👁️ preview
<img width="1050" height="703" alt="image" src="https://github.com/user-attachments/assets/95ee41c5-5a9d-4bd0-a1f9-bf4b6cccee42" />

