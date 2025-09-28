"use client";

import { useState, useEffect } from "react";
import { Search, GitBranch, Check } from "lucide-react";
import { getServiceCredentials } from "@/lib/config";

interface BranchSelectorProps {
  value: Record<string, string>;
  onChange: (branches: Record<string, string>) => void;
  repositories: string[];
}

interface RepoBranches {
  [repoName: string]: string[];
}

export function BranchSelector({
  value,
  onChange,
  repositories,
}: BranchSelectorProps) {
  const [repoBranches, setRepoBranches] = useState<RepoBranches>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const credentials = getServiceCredentials("github");

  // Fetch branches for each repository
  useEffect(() => {
    const fetchBranches = async () => {
      if (!credentials.token || repositories.length === 0) return;

      for (const repoFullName of repositories) {
        if (repoBranches[repoFullName]) continue; // Already fetched

        setLoading((prev) => ({ ...prev, [repoFullName]: true }));

        try {
          const [owner, repo] = repoFullName.split("/");
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/branches?per_page=50`,
            {
              headers: {
                Authorization: `token ${credentials.token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Daily-Dashboard",
              },
            }
          );

          if (response.ok) {
            const branches = await response.json();
            const branchNames = branches.map((branch: any) => branch.name);

            setRepoBranches((prev) => ({
              ...prev,
              [repoFullName]: branchNames,
            }));

            // Set default to 'main' or 'master' if not already set
            if (!value[repoFullName]) {
              const defaultBranch = branchNames.includes("main")
                ? "main"
                : branchNames.includes("master")
                ? "master"
                : branchNames[0] || "main";

              onChange({
                ...value,
                [repoFullName]: defaultBranch,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching branches for ${repoFullName}:`, error);
        } finally {
          setLoading((prev) => ({ ...prev, [repoFullName]: false }));
        }

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    fetchBranches();
  }, [repositories, credentials.token]);

  const handleBranchChange = (repoName: string, branch: string) => {
    onChange({
      ...value,
      [repoName]: branch,
    });
  };

  const filteredRepos = repositories.filter((repo) =>
    repo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8">
        <GitBranch className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          Select repositories first to choose branches
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-3">
        {filteredRepos.map((repoName) => {
          const branches = repoBranches[repoName] || [];
          const selectedBranch = value[repoName] || "main";
          const isLoading = loading[repoName];

          return (
            <div
              key={repoName}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {repoName}
                  </span>
                </div>
                {isLoading && (
                  <div className="text-xs text-gray-500">
                    Loading branches...
                  </div>
                )}
              </div>

              {branches.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={selectedBranch}
                    onChange={(e) =>
                      handleBranchChange(repoName, e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                        {(branch === "main" || branch === "master") &&
                          " (default)"}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Check className="h-3 w-3" />
                    <span>Selected: {selectedBranch}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isLoading ? "Fetching branches..." : "No branches found"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            No repositories match your search
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <strong>💡 Tip:</strong> Select different branches for each repository
        to monitor commits from specific feature branches, development branches,
        or any custom branches you're working on.
      </div>
    </div>
  );
}
