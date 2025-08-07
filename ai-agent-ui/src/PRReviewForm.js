import React, { useState } from "react";
import axios from "axios";

const PRReviewForm = () => {
  const [prUrl, setPrUrl] = useState("");
  const [branchName, setBranchName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const extractRepoInfo = (prUrl) => {
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = prUrl.match(regex);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      prNumber: parseInt(match[3], 10),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const info = extractRepoInfo(prUrl);
    if (!info) {
      setMessage("Invalid PR URL format.");
      return;
    }

    const payload = {
      pull_request: {
        html_url: prUrl,
        head: {
          ref: branchName,
        },
      },
      repository: {
        clone_url: repoUrl,
      },
    };

    try {
      setLoading(true);
      setMessage("");
      const response = await axios.post("http://localhost:8000/webhook", payload);
      setMessage("✅ Review request submitted successfully.");
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to submit the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Submit Pull Request for Review</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Pull Request URL:</label>
          <input
            type="text"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            required
            className="w-full border p-2 rounded"
            placeholder="https://github.com/owner/repo/pull/123"
          />
        </div>

        <div>
          <label className="block font-medium">Branch Name:</label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            required
            className="w-full border p-2 rounded"
            placeholder="e.g., branch-name"
          />
        </div>

        <div>
          <label className="block font-medium">Repository Clone URL:</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
            className="w-full border p-2 rounded"
            placeholder="git@github.com:<owner>/repo.git"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default PRReviewForm;

