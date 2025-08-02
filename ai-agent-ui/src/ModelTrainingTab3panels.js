import React, { useEffect, useState, useRef } from "react";
import {
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaMoon,
  FaSun,
  FaTrash,
  FaPaperPlane,
} from "react-icons/fa";

const ModelTrainingTab = () => {
  const [issue, setIssue] = useState("");
  const [resolution, setResolution] = useState("");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [botThinking, setBotThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/get-training-history")
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch((err) => console.error("Failed to fetch history:", err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, botThinking]);

  const handleTrain = async () => {
    if (!issue.trim() || !resolution.trim()) return;

    const payload = { issue, resolution };

    const res = await fetch("http://localhost:8000/train-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "Training saved");
    setIssue("");
    setResolution("");
    fetch("http://localhost:8000/get-training-history")
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []));
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    const userMessage = { sender: "user", text: query };
    setChatMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setBotThinking(true);

    try {
      const res = await fetch("http://localhost:8000/suggest-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      const botMessage = {
        sender: "bot",
        text: data.suggestion || "❌ No suggestion found",
      };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Failed to fetch suggestion." },
      ]);
    } finally {
      setBotThinking(false);
    }
  };

  const handleClearHistory = async () => {
    await fetch("http://localhost:8000/clear-training-history", { method: "POST" });
    setHistory([]);
    setSelectedHistory(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleQuery();
  };

  return (
    <div
      className={`flex h-[85vh] w-full gap-x-4 px-4 transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
    >
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-10"
        } bg-gray-100 dark:bg-gray-800 p-2 overflow-y-auto border-r border-gray-300 relative rounded-xl shadow-lg`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-2 right-2 text-sm hover:text-blue-500"
        >
          {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>

        {sidebarOpen && (
          <>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaHistory /> Training History
            </h2>
            <ul className="space-y-2">
              {history.length === 0 ? (
                <li className="text-gray-500 italic">No history yet.</li>
              ) : (
                history.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => setSelectedHistory(item)}
                    title={item.issue}
                    className={`p-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-colors duration-200 ${
                      selectedHistory === item
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    📁 {item.issue}
                  </li>
                ))
              )}
            </ul>
            <button
              onClick={handleClearHistory}
              className="mt-4 flex items-center gap-1 text-red-500 text-sm hover:text-red-700"
            >
              <FaTrash /> Clear all
            </button>
          </>
        )}
      </div>

      {/* Model Training Panel */}
      <div className="w-[35%] p-6 border-r border-gray-300 bg-gradient-to-br from-yellow-200 via-purple-200 to-blue-200 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">📚 Model Training Assistant</h2>
          <button onClick={() => setDarkMode(!darkMode)} className="text-lg hover:text-yellow-500">
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>

        <input
          type="text"
          placeholder="Describe the issue"
          className="w-full border p-2 rounded-lg mb-2"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />
        <textarea
          placeholder="Describe the resolution or workaround"
          className="w-full border p-2 rounded-lg h-24 mb-2"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
        <button
          onClick={handleTrain}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Training Data
        </button>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 p-4 flex flex-col h-full bg-gradient-to-br from-yellow-200 via-purple-200 to-blue-200 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-2">🤖 AI Suggestions</h2>
        <div className="flex-1 overflow-y-auto flex flex-col space-y-4 pr-2">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 shadow-md max-w-xs ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white self-end max-w-[60%]"
                    : "bg-gray-200 text-gray-900 self-start max-w-[100%]"
                }`}
		  >
		  {msg.sender === "bot" ? (
			  /^\d+\.\s/.test(msg.text.trim()) ? (
				  <ol className="list-decimal pl-6 space-y-1">
				  {msg.text
					  .split(/\n(?=\d+\.\s)/)
					  .map((item, idx) => (
						  <li key={idx} className="text-sm text-gray-900 font-sans leading-relaxed">
						  {item.replace(/^\d+\.\s/, "").trim()}
						  </li>
					  ))}
				  </ol>
			  ) : (
				  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">{msg.text}</pre>
			  )
		  ) : (
			  msg.text
		  )}

              </div>
            </div>
          ))}
          {botThinking && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
              <span className="dot-flash">● ● ●</span> Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-4 flex items-center">
          <input
            type="text"
            placeholder="Type an issue you're facing..."
            className="flex-1 border p-2 rounded-lg mr-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleQuery}
            className="text-2xl p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
            title="Send"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelTrainingTab;

