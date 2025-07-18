import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/ask', { query });
      setResponse(res.data.response);
    } catch (err) {
      console.error('Request failed:', err);
      setResponse('❌ Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">🧠 Agentic AI App</h1>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
        <input
          type="text"
          className="w-full p-3 border rounded shadow"
          placeholder="Ask your question (e.g., 'What is 10 plus 5?')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 transition"
        >
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </form>

      {response && (
        <div className="mt-6 max-w-xl mx-auto bg-white p-4 rounded shadow border">
          <h2 className="font-semibold text-gray-700 mb-2">💬 Response:</h2>
          <pre className="text-gray-900 whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
}

export default App;

