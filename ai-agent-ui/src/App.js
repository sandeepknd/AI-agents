import React, { useEffect, useRef, useState } from "react";
import "./index.css";
import logo from "./logo.png"; // Logo image file
import TypingDots from "./TypingDots";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  //const [logUploaded, setLogUploaded] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, botThinking, isUploading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBotThinking(true);

    try {
      //const endpoint = logUploaded ? "http://localhost:8000/ask" : "http://localhost:8000/ask";
      const endpoint = "http://localhost:8000/ask";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage.text }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.response || "🤖 No response.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "❌ Failed to get a response from server.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setBotThinking(false);
    }
  };

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    //const isLog = ["log", "txt"].includes(ext);
    const isLog = ["log"].includes(ext);

    const endpoint = isLog ? "http://localhost:8000/upload-log" : "http://localhost:8000/upload";

    // Set message accordingly
    setUploadMessage(isLog ? "📤 Uploading " : "📤 Uploaded and analyzing ");
    setIsUploading(true);

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: `📄 Uploaded: ${selectedFile.name}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text:
            data.summary ||
            (isLog ? "✅ Log uploaded. Ask me anything!" : "✅ File uploaded and processed successfully."),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      //setLogUploaded(isLog);
    } catch (error) {
      console.error("Upload error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "❌ Upload failed. Please try again.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsUploading(false);
      setUploadMessage(""); // Clear upload message
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 bg-gradient-to-br from-green-100 via-blue-100 to-green-200">
      <div className="flex items-center gap-3 mb-4">
        <img src={logo} alt="Logo" className="w-10 h-10 rounded-full shadow-md" />
        <h1 className="text-3xl font-bold text-gray-800 drop-shadow-md">Welcome to Open Chat</h1>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-4 flex flex-col">
        <div className="h-[60vh] overflow-y-auto space-y-3 px-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${
                msg.type === "user" ? "justify-end" : "justify-start"
              } animate-fade-in-slide`}
            >
              {msg.type === "bot" && (
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                  🤖
                </div>
              )}
              <div>
                <div
                  className={`px-4 py-2 rounded-xl max-w-sm relative ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <span 
		    className={`text-xs text-gray-500 mt-1 block ${
    			msg.type === "user" ? "text-right" : "text-left"
  			}`}
			>
                  {msg.timestamp}
                </span>
              </div>
              {msg.type === "user" && (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                  😊
                </div>
              )}
            </div>
          ))}

          {isUploading && uploadMessage && (
            <div className="text-sm text-gray-600 italic mt-2 animate-pulse">
		<span>{uploadMessage}</span>
    		<TypingDots />
            </div>
          )}
          {botThinking && (
	     <div className="inline-flex items-center gap-2 text-sm text-gray-600 italic mt-2 animate-pulse">
		<span className="text-gray-600 text-sm">🤖 Bot is typing </span>
	  	<TypingDots />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
          >
            Send
          </button>
          <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">
            Upload
            <input type="file" onChange={handleUpload} hidden />
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;

