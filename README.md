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
