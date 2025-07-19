This is the repo for creating an AI-powered chatbot aap. 
Currently, it supports the below AI agents for performing 
1. arithmetic operations (add, substract, multiply and division)
2. getting the weather of a city; currently hardcoded. The intention is to verify the appropriate tool calling
3. document uploader and analyzer; doc in pdf and txt format is uploaded throgh the UI and it automatically analyzes/summarizes it.
5. default fallback to llm based-response is also supported. In other words, If the user query doesn't correspond to any of the available tools, it is directly sent to the LLM.

Currently llama3 llm is used. 

Pre-requisites. 
ollama must be installed and should be runnig the llama3. Python along with the required python modules for llm need to installed. React also needs to be installed. 
Backend code is written in python for intercating with the LLM. Then it is wrapped in FastAPI to expose the API endpoint, which is consumed by the frontend written in react. 


Create a React app if not already done
npx create-react-app ai-agent-ui
cd ai-agent-ui
This sets up the correct package.json with a working "start" script.
Open your package.json file and ensure it has this under "scripts":
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
If "start" is missing, add it as shown.

Then install react-scripts if needed:
npm install react-scripts --save

Sample screenshot of the app. 

<img width="250" height="250" alt="image" src="https://github.com/user-attachments/assets/d43a14f5-80d8-4516-b16f-3ebe708f3f2d" />

<img width="250" height="250" alt="image" src="https://github.com/user-attachments/assets/bb913692-8320-4777-aeb5-00e9bc048703" />

**Run the backend**
navigate to the main directory where the python files exist and execute
**uvicorn main_fastapi:app --reload --host 0.0.0.0 --port 8000**

**Run the frontend** 
Navigate to the directory ai-agent-ui and execute
**npm start**

