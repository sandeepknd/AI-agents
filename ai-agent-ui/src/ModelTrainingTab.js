import React, { useEffect, useRef, useState } from "react";
import { FaHistory, FaChevronLeft, FaChevronRight, FaMoon, FaSun, FaTrash, FaPaperPlane } from "react-icons/fa";

const ModelTrainingTab = () => {
  const [issue, setIssue] = useState("");
  const [resolution, setResolution] = useState("");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const responseRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/get-training-history")
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch((err) => console.error("Failed to fetch history:", err));
  }, []);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]);

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

    setResponse("");
    setLoading(true);

    const res = await fetch("http://localhost:8000/suggest-resolution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    console.log("LLM suggestion:", data);
    setResponse(data.suggestion || "❌ No suggestion found");
    setLoading(false);
  };

  const handleClearHistory = async () => {
    await fetch("http://localhost:8000/clear-training-history", { method: "POST" });
    setHistory([]);
    setSelectedHistory(null);
  };

  return (
    <div className={`flex w-full min-h-screen transition-colors ${darkMode ? "bg-gray-900 text-green" : "bg-white text-black"}`}>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-80" : "w-10"
        } bg-gray-100 dark:bg-gray-800 p-2 overflow-y-auto border-r border-gray-300 relative`}
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

      {/* Main Panel */}
{/* Main Panel */}
<div className="flex-1 h-[80vh] flex flex-col bg-gradient-to-br from-yellow-200 via-purple-200 to-blue-200 rounded-2xl shadow-lg p-6 ml-2">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold">📚 Model Training Assistant</h2>
    <button onClick={() => setDarkMode(!darkMode)} className="text-lg hover:text-yellow-500">
      {darkMode ? <FaSun /> : <FaMoon />}
    </button>
  </div>

  {/* Training Input */}
  <div>
    <input
      type="text"
      placeholder="Describe the issue (e.g., App crashed with OOM error)"
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

  {/* Suggestions Section */}
  <div className="border-t pt-4 mt-4 flex flex-col h-full">
    <h2 className="text-2xl font-bold mb-2">Ask for Suggestions</h2>

    {/* Input + Send Button */}
    <div className="relative mb-2">
      <input
        type="text"
        placeholder="Type an issue you're facing..."
        className="w-full border p-2 pr-12 rounded-lg"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleQuery();
        }}
      />
      <button
        onClick={handleQuery}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-800"
        title="Submit"
      >
        <FaPaperPlane size={22} />
      </button>
    </div>

    {/* Output Response Box - Fixed Height with Scroll */}
    <div className="flex-grow overflow-y-auto max-h-[200px] bg-gray-50 border border-green-200 p-4 rounded shadow-inner">
      {loading ? (
        <div className="text-gray-600 italic flex items-center gap-2 animate-pulse">
          <span className="dot-flashing" /> Thinking...
        </div>
      ) : response ? (
        <>
          <h3 className="font-semibold text-green-700 mb-1">Suggested Resolution:</h3>
          <p className="text-gray-800 whitespace-pre-line dark:text-white">{response}</p>
        </>
      ) : (
        <div className="text-gray-500 italic">No response yet.</div>
      )}
    </div>
  </div>
</div>

    </div>
  );
};

export default ModelTrainingTab;

