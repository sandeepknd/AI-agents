import React, { useState } from "react";
import axios from "axios";
import TypingDots from "./TypingDots";

const PRReviewPanel = () => {
  const [theme, setTheme] = useState("light");
  const [reviewPrUrl, setReviewPrUrl] = useState("");
  const [commentPrUrl, setCommentPrUrl] = useState("");
  const [branchName, setBranchName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [commentText, setCommentText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [commentMsg, setCommentMsg] = useState("");

  const isValidPRUrl = (url) => {
    const regex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+$/;
    return regex.test(url);
  };

  const extractRepoInfo = (url) => {
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = url.match(regex);
    return match ? { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) } : null;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const info = extractRepoInfo(reviewPrUrl);
    if (!info) return setMessage("❌ Invalid PR URL format.");

    const payload = {
      pull_request: { html_url: reviewPrUrl, head: { ref: branchName } },
      repository: { clone_url: repoUrl },
    };

    try {
      setReviewLoading(true);
      setMessage("");
      await axios.post("http://localhost:8000/webhook", payload);
      setMessage("✅ PR submitted for review successfully.");
    } catch (err) {
      setMessage("❌ Failed to submit PR for review.");
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAISuggestion = async () => {
    const info = extractRepoInfo(commentPrUrl);
    if (!info) return setCommentMsg("❌ Invalid PR URL format.");

    try {
      setAiLoading(true);
      setAiSuggestion("Generating suggestion...");
      const response = await axios.post("http://localhost:8000/generate-comment", {
        pr_url: commentPrUrl,
      });
      setAiSuggestion(response.data.comment || "No suggestion generated.");
    } catch (err) {
      setAiSuggestion("❌ Failed to generate suggestion.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const info = extractRepoInfo(commentPrUrl);
    if (!info) return setCommentMsg("❌ Invalid PR URL format.");

    const payload = { pr_url: commentPrUrl, comment: commentText };

    try {
      setCommentLoading(true);
      setCommentMsg("");
      await axios.post("http://localhost:8000/comment", payload);
      setCommentMsg("✅ Comment posted to PR.");
    } catch (err) {
      setCommentMsg("❌ Failed to post comment.");
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-black"} min-h-screen p-6`}>
      <div className="max-w-2xl mx-auto p-6 rounded-2xl shadow-xl space-y-10 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">GitHub PR Tools</h1>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded text-sm border dark:border-white border-black"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">1️⃣ Submit PR for Review</h2>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={reviewPrUrl}
                onChange={(e) => setReviewPrUrl(e.target.value)}
                required
                placeholder="Pull Request URL"
                className="w-full border p-2 rounded pr-10"
              />
              {isValidPRUrl(reviewPrUrl) && (
                <span className="absolute top-2 right-3 text-green-600 font-bold">✅</span>
              )}
            </div>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              required
              placeholder="Branch Name"
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              placeholder="Repository Clone URL"
              className="w-full border p-2 rounded"
            />
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={reviewLoading}
              >
                Submit PR
              </button>
              {reviewLoading && <TypingDots />}
            </div>
          </form>
          {message && <p className="mt-2 text-sm">{message}</p>}
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="text-xl font-semibold mb-4">💬 Post Comment to PR</h2>
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={commentPrUrl}
                onChange={(e) => setCommentPrUrl(e.target.value)}
                required
                placeholder="Pull Request URL"
                className="w-full border p-2 rounded pr-10"
              />
              {isValidPRUrl(commentPrUrl) && (
                <span className="absolute top-2 right-3 text-green-600 font-bold">✅</span>
              )}
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
              rows="3"
              placeholder="Enter your comment here"
              className="w-full border p-2 rounded"
            />
            <div className="flex space-x-2 items-center">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={commentLoading}
              >
                Post Comment
              </button>
              {commentLoading && <TypingDots />}
              <button
                type="button"
                onClick={handleAISuggestion}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                disabled={aiLoading}
              >
                ✨ Suggest with AI
              </button>
              {aiLoading && <TypingDots />}
            </div>
          </form>
          {commentMsg && <p className="mt-2 text-sm">{commentMsg}</p>}
          {aiSuggestion && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <h4 className="font-medium mb-1">💡 AI Suggestion:</h4>
              <pre className="whitespace-pre-wrap text-sm">{aiSuggestion}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRReviewPanel;

