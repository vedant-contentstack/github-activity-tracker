"use client";

import { useState, useEffect } from "react";
import { Search, Check, GitBranch, Users } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    type: string;
  };
  stargazers_count: number;
  updated_at: string;
}

interface RepositorySelectorProps {
  token: string;
  username: string;
  selectedRepositories: string[];
  onSelectionChange: (repositories: string[]) => void;
}

export function RepositorySelector({
  token,
  username,
  selectedRepositories,
  onSelectionChange,
}: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (token && username) {
      fetchRepositories();
    }
  }, [token, username]);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);

    try {
      const allRepos: Repository[] = [];

      // 1. Fetch user's own repositories
      const userReposResponse = await fetch(
        `https://api.github.com/users/${username}/repos?type=owner&sort=updated&per_page=100`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Daily-Dashboard",
          },
        }
      );

      if (userReposResponse.ok) {
        const userRepos = await userReposResponse.json();
        allRepos.push(...userRepos);
      }

      // 2. Fetch organization repositories
      const orgsResponse = await fetch(`https://api.github.com/user/orgs`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      });

      if (orgsResponse.ok) {
        const orgs = await orgsResponse.json();

        for (const org of orgs.slice(0, 10)) {
          try {
            const orgReposResponse = await fetch(
              `https://api.github.com/orgs/${org.login}/repos?sort=updated&per_page=100`,
              {
                headers: {
                  Authorization: `token ${token}`,
                  Accept: "application/vnd.github.v3+json",
                  "User-Agent": "Daily-Dashboard",
                },
              }
            );

            if (orgReposResponse.ok) {
              const orgRepos = await orgReposResponse.json();
              allRepos.push(...orgRepos);
            }
          } catch (error) {
            console.error(`Error fetching repos for org ${org.login}:`, error);
          }
        }
      }

      // Remove duplicates and sort by last updated
      const uniqueRepos = allRepos.filter(
        (repo, index, self) => index === self.findIndex((r) => r.id === repo.id)
      );

      uniqueRepos.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setRepositories(uniqueRepos);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setError("Failed to fetch repositories. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRepositories = repositories.filter(
    (repo) =>
      repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRepositoryToggle = (repoFullName: string) => {
    const newSelection = selectedRepositories.includes(repoFullName)
      ? selectedRepositories.filter((name) => name !== repoFullName)
      : [...selectedRepositories, repoFullName];

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedRepositories.length === filteredRepositories.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredRepositories.map((repo) => repo.full_name));
    }
  };

  if (!token || !username) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Please save your GitHub credentials first to select repositories.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          Loading repositories...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select repositories to track ({selectedRepositories.length} selected)
        </p>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {selectedRepositories.length === filteredRepositories.length
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
        {filteredRepositories.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No repositories found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRepositories.map((repo) => {
              const isSelected = selectedRepositories.includes(repo.full_name);
              const isOrg = repo.owner.login !== username;

              return (
                <div
                  key={repo.id}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleRepositoryToggle(repo.full_name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {isOrg ? (
                            <Users className="w-3 h-3 text-gray-400" />
                          ) : (
                            <GitBranch className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {repo.full_name}
                          </span>
                          {repo.private && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6 truncate">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      ⭐ {repo.stargazers_count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedRepositories.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Selected: {selectedRepositories.join(", ")}
        </div>
      )}
    </div>
  );
}
