"use client";

import React, { useState } from "react";
import {
  Search,
  GitCommit,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function GitHubCommitAnalyzer() {
  const [repoUrl, setRepoUrl] = useState(
    "https://github.com/sandipkatel/sandipkatel"
  );
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<any>(null);

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(".git", "") };
  };

  const fetchCommits = async () => {
    setLoading(true);
    setError("");
    setCommits([]);
    setSelectedCommit(null);

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setError("Invalid GitHub URL");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits`
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      setCommits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitDetails = async (sha: any) => {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) return;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${sha}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch commit details: ${response.status}`);
      }

      const data = await response.json();
      setSelectedCommit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const analyzeCommitMatch = (commit: any) => {
    if (!commit || !commit.files)
      return { match: "unknown", confidence: 0, analysis: [] };

    const message = commit.commit.message.toLowerCase();
    const files = commit.files;
    const analysis: { file: any; changes: string; status: any; matches: any; relevance: string; }[] = [];

    // Extract key terms from commit message
    const terms = message.match(/\b\w+\b/g) || [];

    // Analyze file changes
    files.forEach((file: { filename: string; additions: any; deletions: any; status: any; }) => {
      const fileName = file.filename.toLowerCase();
      const fileTerms = fileName.split(/[\/\._-]/).filter((t) => t.length > 2);

      const matches = fileTerms.filter((term) =>
        terms.some(
          (msgTerm : string) =>
            typeof msgTerm === "string" && (msgTerm.includes(term) || term.includes(msgTerm))
        )
      );

      analysis.push({
        file: file.filename,
        changes: `+${file.additions} -${file.deletions}`,
        status: file.status,
        matches: matches.length,
        relevance: matches.length > 0 ? "high" : "low",
      });
    });

    const totalMatches = analysis.reduce((sum, a) => sum + a.matches, 0);
    const confidence = Math.min(100, (totalMatches / files.length) * 50 + 30);

    let match = "unknown";
    if (confidence > 60) match = "good";
    else if (confidence > 30) match = "partial";
    else match = "poor";

    return { match, confidence: Math.round(confidence), analysis };
  };

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case "good":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "partial":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "poor":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <GitCommit className="w-8 h-8" />
            GitHub Commit Analyzer
          </h1>
          <p className="text-slate-400">
            Verify if commit messages match actual file changes
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <label className="block text-sm font-medium mb-2">
            Repository URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchCommits}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Analyze Commits
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {commits.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <GitCommit className="w-5 h-5" />
                Commits ({commits.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commits.map((commit: any) => (
                  <div
                    key={commit.sha}
                    onClick={() => fetchCommitDetails(commit.sha)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedCommit?.sha === commit.sha
                        ? "bg-blue-600/30 border-2 border-blue-500"
                        : "bg-slate-700 hover:bg-slate-600 border border-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <GitCommit className="w-4 h-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {commit.commit.message.split("\n")[0]}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="truncate">
                            {commit.commit.author.name}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(
                              commit.commit.author.date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <code className="text-xs text-slate-500 block mt-1">
                          {commit.sha.substring(0, 7)}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Commit Analysis
              </h2>
              {!selectedCommit ? (
                <div className="text-center py-12 text-slate-400">
                  <GitCommit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a commit to analyze</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Commit Message</h3>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {selectedCommit.commit.message}
                    </p>
                  </div>

                  {(() => {
                    const analysis = analyzeCommitMatch(selectedCommit);
                    return (
                      <>
                        <div className="bg-slate-700 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {getMatchIcon(analysis.match)}
                            <div>
                              <h3 className="font-semibold">Match Quality</h3>
                              <p className="text-sm text-slate-400">
                                Confidence: {analysis.confidence}%
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                analysis.match === "good"
                                  ? "bg-green-500"
                                  : analysis.match === "partial"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${analysis.confidence}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="bg-slate-700 rounded-lg p-4">
                          <h3 className="font-semibold mb-3">
                            Files Changed ({selectedCommit.files.length})
                          </h3>
                          <div className="space-y-2">
                            {analysis.analysis.map((item, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg text-sm ${
                                  item.relevance === "high"
                                    ? "bg-green-900/30 border border-green-700"
                                    : "bg-slate-600 border border-slate-500"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4" />
                                  <code className="text-xs flex-1 truncate">
                                    {item.file}
                                  </code>
                                </div>
                                <div className="flex gap-3 text-xs text-slate-400">
                                  <span className="text-green-400">
                                    +{item.changes.split(" ")[0].substring(1)}
                                  </span>
                                  <span className="text-red-400">
                                    {item.changes.split(" ")[1]}
                                  </span>
                                  <span className="capitalize">
                                    {item.status}
                                  </span>
                                  {item.relevance === "high" && (
                                    <span className="text-green-400">
                                      • Relevant
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <a
                    href={selectedCommit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
                  >
                    View on GitHub →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
