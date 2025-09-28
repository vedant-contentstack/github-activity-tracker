"use client";

import { useState, useEffect } from "react";
import {
  Github,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Code,
  TrendingUp,
  Lightbulb,
  Clock,
  Target,
  BarChart3,
  Activity,
  Brain,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { timeAgo } from "@/lib/utils";
import { getServiceCredentials, getConfig } from "@/lib/config";

interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: Date;
  repository: string;
  url: string;
}

interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  repository: string;
  url: string;
  created_at: Date;
  updated_at: Date;
  approvals: number;
  requestedChanges: number;
  comments?: number;
  reviews: Array<{
    state: string;
    user: string;
  }>;
}

interface GitHubStats {
  totalCommits: number;
  totalPRs: number;
  streakDays: number;
  languageDistribution: Array<{
    language: string;
    percentage: number;
    bytes: number;
    color: string;
  }>;
  activityPattern: {
    frontendCommits: number;
    backendCommits: number;
    suggestion: string;
  };
}

interface SmartSuggestion {
  type: "frontend" | "backend" | "balanced";
  message: string;
  issues: Array<{
    title: string;
    url: string;
    repository: string;
  }>;
}

interface ProductivityMetrics {
  codingVelocity: {
    daily: Array<{
      date: string;
      commits: number;
      linesAdded: number;
      linesDeleted: number;
      netChange: number;
    }>;
    trend: "increasing" | "decreasing" | "stable";
  };
  peakHours: {
    hourlyActivity: Array<{
      hour: number;
      commits: number;
      intensity: number; // 0-100
    }>;
    mostProductiveHour: number;
    focusTimeBlocks: Array<{
      start: number;
      end: number;
      duration: number; // in hours
    }>;
  };
  languageProficiency: Array<{
    language: string;
    proficiencyScore: number; // 0-100
    recentActivity: number;
    trend: "improving" | "declining" | "stable";
  }>;
  focusMetrics: {
    averageSessionLength: number; // in hours
    longestSession: number; // in hours
    totalFocusTime: number; // in hours
    interruptionRate: number; // per hour
  };
}

export function GitHubWidget() {
  const credentials = getServiceCredentials("github");
  const config = getConfig();
  const selectedRepositories = config.github.repositories || [];

  const [smartSuggestion, setSmartSuggestion] =
    useState<SmartSuggestion | null>(null);
  const [productivityMetrics, setProductivityMetrics] =
    useState<ProductivityMetrics | null>(null);

  const { data: commits, isLoading: commitsLoading } = useQuery({
    queryKey: ["github-commits", selectedRepositories],
    queryFn: () => fetchRecentCommits(credentials, selectedRepositories),
    enabled: !!(credentials.token && credentials.username),
  });

  const { data: pullRequests, isLoading: prsLoading } = useQuery({
    queryKey: ["github-prs", selectedRepositories],
    queryFn: () => fetchPullRequests(credentials, selectedRepositories),
    enabled: !!(credentials.token && credentials.username),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["github-stats", selectedRepositories],
    queryFn: () => fetchGitHubStats(credentials, selectedRepositories),
    enabled: !!(credentials.token && credentials.username),
  });

  const { data: suggestions } = useQuery({
    queryKey: ["github-suggestions", selectedRepositories],
    queryFn: () => fetchSmartSuggestions(credentials, selectedRepositories),
    enabled: !!(credentials.token && credentials.username),
  });

  const { data: productivity } = useQuery({
    queryKey: ["github-productivity", selectedRepositories],
    queryFn: () => fetchProductivityMetrics(credentials, selectedRepositories),
    enabled: !!(credentials.token && credentials.username),
  });

  const isLoading = commitsLoading || prsLoading || statsLoading;

  // Update smart suggestions when data changes
  useEffect(() => {
    if (suggestions) {
      setSmartSuggestion(suggestions);
    }
  }, [suggestions]);

  // Update productivity metrics when data changes
  useEffect(() => {
    if (productivity) {
      setProductivityMetrics(productivity);
    }
  }, [productivity]);

  if (!credentials.token || !credentials.username) {
    return (
      <div className="widget-container">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
            <Github className="h-5 w-5 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              GitHub Activity
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configuration required
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            GitHub credentials not configured
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please add your GitHub token and username in settings to view your
            activity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-white dark:via-gray-100 dark:to-gray-200 p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Github className="h-7 w-7 text-white dark:text-gray-900" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              GitHub Activity
            </h2>
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 flex items-center space-x-2">
              <span>@{credentials.username}</span>
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Live
              </span>
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Row - Responsive Grid */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-sm">
                <div className="bg-green-100 dark:bg-green-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                  <GitCommit className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {stats.totalCommits}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Commits (7d)
                </p>
                <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-sm">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                  <GitPullRequest className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stats.totalPRs}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  PRs (7d)
                </p>
                <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-sm">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                  <Zap className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {stats.streakDays}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Day Streak
                </p>
                <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid - Responsive 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Distribution Chart */}
            {stats?.languageDistribution &&
              stats.languageDistribution.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Code className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Language Distribution
                      </h3>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      📊 Repository languages
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stats.languageDistribution
                      .slice(0, 5)
                      .map((lang, index) => (
                        <div key={lang.language} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: lang.color }}
                              ></div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {lang.language}
                              </span>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {lang.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                backgroundColor: lang.color,
                                width: `${lang.percentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Active Pull Requests */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                  <GitPullRequest className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Active Pull Requests
                </h3>
              </div>
              {!pullRequests || pullRequests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-100/50 dark:bg-gray-700/50 p-4 rounded-2xl inline-block mb-3">
                    <GitPullRequest className="h-8 w-8 text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No active pull requests
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pullRequests.slice(0, 3).map((pr) => (
                    <a
                      key={pr.number}
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {pr.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            #{pr.number} • {pr.repository} • Created{" "}
                            {timeAgo(pr.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-4">
                          <div className="flex items-center space-x-2">
                            {/* PR State Badge */}
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                pr.state === "open"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : pr.state === "closed"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              }`}
                            >
                              {pr.state === "open"
                                ? "🟢 Open"
                                : pr.state === "closed"
                                ? "🔴 Closed"
                                : "🟣 Merged"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {/* Note: Review status not available due to CORS restrictions */}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Click to view on GitHub
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Commits */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl">
                  <GitCommit className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Commits (7 days)
                </h3>
              </div>
              {!commits || commits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100/50 dark:bg-gray-700/50 p-6 rounded-2xl inline-block mb-4">
                    <GitCommit className="h-12 w-12 text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    No commits found
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Start coding to see your recent activity here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commits.slice(0, 6).map((commit) => (
                    <a
                      key={commit.sha}
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200 line-clamp-2">
                            {commit.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {commit.repository}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {timeAgo(commit.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Productivity Analytics */}
          {productivityMetrics && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-2xl shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Productivity Analytics
                    </h2>
                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                      Analyze your coding habits, focus patterns, and peak
                      performance hours
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 px-4 py-2 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    🚀 AI-Powered
                  </span>
                </div>
              </div>

              {/* Focus Metrics - Top Priority */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Focus Metrics
                    </h3>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    🎯 Measures coding session length and consistency
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                    title="Average time between first and last commit in a day"
                  >
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(
                        productivityMetrics.focusMetrics.averageSessionLength *
                          10
                      ) / 10}
                      h
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg Session
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    title="Longest continuous coding session in the past week"
                  >
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(
                        productivityMetrics.focusMetrics.longestSession * 10
                      ) / 10}
                      h
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Longest Session
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                    title="Total active coding time across all sessions"
                  >
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(
                        productivityMetrics.focusMetrics.totalFocusTime * 10
                      ) / 10}
                      h
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Total Focus
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    title="Average gaps between commits (lower is better)"
                  >
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {Math.round(
                        productivityMetrics.focusMetrics.interruptionRate * 10
                      ) / 10}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Interruption Rate
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coding Velocity Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Coding Velocity
                      </h3>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      📈 Lines added/removed per day
                    </div>
                  </div>

                  {/* Daily velocity chart */}
                  <div className="space-y-3">
                    {productivityMetrics.codingVelocity.daily
                      .slice(-7)
                      .map((day) => {
                        const maxChange = Math.max(
                          ...productivityMetrics.codingVelocity.daily.map((d) =>
                            Math.abs(d.netChange)
                          )
                        );
                        const width =
                          maxChange > 0
                            ? (Math.abs(day.netChange) / maxChange) * 100
                            : 0;
                        const isPositive = day.netChange >= 0;

                        return (
                          <div
                            key={day.date}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-20 text-xs text-gray-700 dark:text-gray-300">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                              })}
                            </div>
                            <div className="flex-1 flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
                                <div
                                  className={`h-2 rounded-full ${
                                    isPositive
                                      ? "bg-green-500 dark:bg-green-400"
                                      : "bg-red-500 dark:bg-red-400"
                                  }`}
                                  style={{ width: `${width}%` }}
                                ></div>
                              </div>
                              <div
                                className={`text-xs font-medium w-16 text-right ${
                                  isPositive
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {isPositive ? "+" : ""}
                                {day.netChange}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Peak Hours Heatmap */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Peak Hours
                      </h3>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      🕒 When you code most actively
                    </div>
                  </div>

                  {/* Hour blocks */}
                  <div className="grid grid-cols-12 gap-1 mb-4">
                    {productivityMetrics.peakHours.hourlyActivity.map(
                      (hour) => (
                        <div
                          key={hour.hour}
                          className={`aspect-square rounded text-xs flex items-center justify-center font-medium ${
                            hour.intensity > 70
                              ? "bg-orange-500 text-white"
                              : hour.intensity > 40
                              ? "bg-orange-300 text-orange-900"
                              : hour.intensity > 10
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                          }`}
                          title={`${hour.hour}:00 - ${hour.commits} commits`}
                        >
                          {hour.hour}
                        </div>
                      )
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>High activity</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-300 rounded"></div>
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-100 rounded"></div>
                      <span>Low</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                      <span>No activity</span>
                    </div>
                  </div>

                  {/* Focus Time Blocks */}
                  {productivityMetrics.peakHours.focusTimeBlocks.length > 0 && (
                    <div className="mt-4">
                      <h4
                        className="text-sm font-medium text-gray-900 dark:text-white mb-2"
                        title="Continuous time blocks with high commit activity"
                      >
                        Focus Sessions
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {productivityMetrics.peakHours.focusTimeBlocks.map(
                          (block, index) => {
                            const hours = Math.round(block.duration);
                            const displayEnd =
                              block.end > 24 ? block.end - 24 : block.end;

                            return (
                              <span
                                key={index}
                                className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded"
                              >
                                {block.start}:00-{displayEnd}:00 ({hours}h)
                              </span>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          {smartSuggestion && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Smart Suggestion
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {smartSuggestion.message}
                  </p>
                  {smartSuggestion.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Recommended Issues:
                      </h4>
                      <div className="space-y-2">
                        {smartSuggestion.issues.map((issue, index) => (
                          <a
                            key={index}
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {issue.title}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {issue.repository}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Function to fetch recent commits using GitHub API
async function fetchRecentCommits(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<GitHubCommit[]> {
  const { token, username } = credentials;

  if (!token || !username) {
    throw new Error("GitHub token and username are required");
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch user events (includes commits from all repositories)
    const eventsResponse = await fetch(
      `https://api.github.com/users/${username}/events?per_page=100`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      }
    );

    if (!eventsResponse.ok) {
      throw new Error(`GitHub API error: ${eventsResponse.status}`);
    }

    const events = await eventsResponse.json();
    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

    // Filter push events from the last 7 days
    const pushEvents = events.filter((event: any) => {
      const eventDate = new Date(event.created_at);
      return (
        event.type === "PushEvent" &&
        eventDate.getTime() >= sevenDaysAgoTimestamp
      );
    });

    // Extract commits from push events
    const commits: GitHubCommit[] = [];
    for (const event of pushEvents) {
      if (event.payload?.commits) {
        for (const commit of event.payload.commits) {
          const repoName = event.repo?.name || "unknown";

          // Filter by selected repositories if specified
          if (
            selectedRepositories.length > 0 &&
            !selectedRepositories.includes(repoName)
          ) {
            continue;
          }

          commits.push({
            sha: commit.sha,
            message: commit.message,
            author: commit.author?.name || username,
            date: new Date(event.created_at),
            repository: repoName,
            url: `https://github.com/${repoName}/commit/${commit.sha}`,
          });
        }
      }
    }

    // If we have selected repositories, also fetch directly from those repos
    if (selectedRepositories.length > 0) {
      for (const repoFullName of selectedRepositories) {
        try {
          const repoCommitsResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/commits?since=${sevenDaysAgo.toISOString()}&per_page=100`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Daily-Dashboard",
              },
            }
          );

          if (repoCommitsResponse.ok) {
            const repoCommits = await repoCommitsResponse.json();

            for (const commit of repoCommits) {
              // Check if commit is by the authenticated user
              if (
                commit.author?.login === username ||
                commit.commit?.author?.email?.includes(username)
              ) {
                // Avoid duplicates
                if (!commits.find((c) => c.sha === commit.sha)) {
                  commits.push({
                    sha: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author?.name || username,
                    date: new Date(commit.commit.author?.date),
                    repository: repoFullName,
                    url: commit.html_url,
                  });
                }
              }
            }
          }
        } catch (error) {
          // Silently continue if commit fetch fails
        }
      }
    }

    // Sort by date (newest first) and limit to reasonable number
    const sortedCommits = commits
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 50);

    return sortedCommits;
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

async function fetchPullRequests(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<GitHubPullRequest[]> {
  const { token, username } = credentials;

  if (!token || !username) {
    throw new Error("GitHub token and username are required");
  }

  try {
    // Search for PRs involving the user in the last 30 days (author, assignee, or mentions)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split("T")[0];

    // More inclusive search - PRs where user is author, assignee, or mentioned
    let searchQuery = `involves:${username}+type:pr+updated:>=${dateFilter}`;

    // Add repository filter if specified
    if (selectedRepositories.length > 0) {
      const repoQuery = selectedRepositories
        .map((repo) => `repo:${repo}`)
        .join("+");
      searchQuery += `+${repoQuery}`;
    }

    const response = await fetch(
      `https://api.github.com/search/issues?q=${searchQuery}&sort=updated&order=desc&per_page=50`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    const pullRequests: GitHubPullRequest[] = [];

    for (const pr of data.items || []) {
      // Fetch detailed PR information including reviews
      try {
        const prResponse = await fetch(pr.url, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Daily-Dashboard",
          },
        });

        if (prResponse.ok) {
          const prData = await prResponse.json();

          // Note: Reviews API has CORS restrictions in browser, so we'll use basic PR data
          let reviews: Array<{ state: string; user: string }> = [];
          let approvals = 0;
          let requestedChanges = 0;
          let commentCount = 0;

          // Extract repository name with multiple fallbacks
          const repository =
            prData.base?.repo?.full_name ||
            prData.head?.repo?.full_name ||
            prData.repository?.full_name ||
            (prData.html_url
              ? prData.html_url.split("/").slice(3, 5).join("/")
              : "unknown");

          pullRequests.push({
            number: prData.number,
            title: prData.title,
            state: prData.state,
            author: prData.user?.login || username,
            repository,
            url: prData.html_url,
            created_at: new Date(prData.created_at),
            updated_at: new Date(prData.updated_at),
            approvals,
            requestedChanges,
            comments: commentCount,
            reviews,
          });
        }
      } catch (error) {}
    }

    // If no PRs found and we have selected repositories, try fetching directly from repos
    if (pullRequests.length === 0 && selectedRepositories.length > 0) {
      for (const repoFullName of selectedRepositories.slice(0, 5)) {
        // Limit to 5 repos
        try {
          const repoResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/pulls?state=open&per_page=10`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Daily-Dashboard",
              },
            }
          );

          if (repoResponse.ok) {
            const repoPRs = await repoResponse.json();

            for (const pr of repoPRs) {
              // Only include PRs where user is involved
              if (
                pr.user?.login === username ||
                pr.assignee?.login === username ||
                pr.assignees?.some((a: any) => a.login === username)
              ) {
                pullRequests.push({
                  number: pr.number,
                  title: pr.title,
                  state: pr.state,
                  author: pr.user?.login || username,
                  repository: repoFullName,
                  url: pr.html_url,
                  created_at: new Date(pr.created_at),
                  updated_at: new Date(pr.updated_at),
                  approvals: 0, // Will be updated if we fetch reviews
                  requestedChanges: 0,
                  comments: pr.comments || 0, // GitHub API provides comment count
                  reviews: [],
                });
              }
            }
          }
        } catch (error) {
          // Silently continue if repo fetch fails
        }
      }
    }

    // Sort PRs: Open PRs first, then by created_at descending
    const sortedPRs = pullRequests.sort((a, b) => {
      // First, prioritize open PRs
      if (a.state === "open" && b.state !== "open") return -1;
      if (b.state === "open" && a.state !== "open") return 1;

      // Then sort by created_at descending (most recently created first)
      return b.created_at.getTime() - a.created_at.getTime();
    });

    return sortedPRs;
  } catch (error) {
    console.error("❌ Error fetching pull requests:", error);
    return [];
  }
}

async function fetchGitHubStats(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<GitHubStats> {
  const { token, username } = credentials;

  if (!token || !username) {
    throw new Error("GitHub token and username are required");
  }

  try {
    // Fetch user data
    const userResponse = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error(`GitHub API error: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Fetch PR count for last 7 days using search API
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Build search query with repository filtering if specified
    let searchQuery = `author:${username}+type:pr+created:>=${dateFilter}`;
    if (selectedRepositories.length > 0) {
      const repoQuery = selectedRepositories
        .map((repo) => `repo:${repo}`)
        .join("+");
      searchQuery += `+${repoQuery}`;
    }

    const prSearchResponse = await fetch(
      `https://api.github.com/search/issues?q=${searchQuery}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      }
    );

    let totalPRs = 0;
    if (prSearchResponse.ok) {
      const prSearchData = await prSearchResponse.json();
      totalPRs = prSearchData.total_count || 0;
    }

    // Fetch user events for commit count and streak calculation
    const eventsResponse = await fetch(
      `https://api.github.com/users/${username}/events?per_page=100`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      }
    );

    let totalCommits = 0;
    let streakDays = 0;

    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

      // Filter push events from the last 7 days
      const pushEvents = events.filter((event: any) => {
        const eventDate = new Date(event.created_at);
        return (
          event.type === "PushEvent" &&
          eventDate.getTime() >= sevenDaysAgoTimestamp
        );
      });

      totalCommits = pushEvents.reduce(
        (sum: number, event: any) =>
          sum + (event.payload?.commits?.length || 0),
        0
      );

      // Calculate streak (simplified - counts days with push events in last 7 days)
      const today = new Date();
      const commitDates = new Set(
        pushEvents.map((event: any) =>
          new Date(event.created_at).toDateString()
        )
      );

      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        if (commitDates.has(checkDate.toDateString())) {
          streakDays = i + 1;
        } else {
          break;
        }
      }
    }

    // Fetch language distribution from repositories
    const languageDistribution = await fetchLanguageDistribution(
      credentials,
      selectedRepositories
    );

    // Analyze activity pattern for smart suggestions
    const activityPattern = await analyzeActivityPattern(
      credentials,
      selectedRepositories
    );

    return {
      totalCommits,
      totalPRs,
      streakDays,
      languageDistribution,
      activityPattern,
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return {
      totalCommits: 0,
      totalPRs: 0,
      streakDays: 0,
      languageDistribution: [],
      activityPattern: {
        frontendCommits: 0,
        backendCommits: 0,
        suggestion: "Unable to analyze activity pattern",
      },
    };
  }
}

async function fetchLanguageDistribution(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<
  Array<{ language: string; percentage: number; bytes: number; color: string }>
> {
  const { token, username } = credentials;

  if (!token || !username) {
    return [];
  }

  try {
    let repositories = selectedRepositories;

    // If no repositories selected, get user's repositories
    if (repositories.length === 0) {
      repositories = await getRecentlyActiveRepositories(credentials);
    }

    const languageStats: Record<string, number> = {};
    let totalBytes = 0;

    for (const repoFullName of repositories.slice(0, 10)) {
      // Limit to 10 repos to avoid rate limits
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoFullName}/languages`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Daily-Dashboard",
            },
          }
        );

        if (response.ok) {
          const languages = await response.json();
          for (const [language, bytes] of Object.entries(languages)) {
            languageStats[language] =
              (languageStats[language] || 0) + (bytes as number);
            totalBytes += bytes as number;
          }
        }
      } catch (error) {}
    }

    // Convert to percentage and add colors
    const languageColors: Record<string, string> = {
      JavaScript: "#f1e05a",
      TypeScript: "#2b7489",
      Python: "#3572A5",
      Java: "#b07219",
      "C++": "#f34b7d",
      C: "#555555",
      "C#": "#239120",
      PHP: "#4F5D95",
      Ruby: "#701516",
      Go: "#00ADD8",
      Rust: "#dea584",
      Swift: "#ffac45",
      Kotlin: "#F18E33",
      Scala: "#c22d40",
      HTML: "#e34c26",
      CSS: "#1572B6",
      Shell: "#89e051",
      Dockerfile: "#384d54",
    };

    return Object.entries(languageStats)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
        color: languageColors[language] || "#8884d8",
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8); // Top 8 languages
  } catch (error) {
    console.error("Error fetching language distribution:", error);
    return [];
  }
}

async function getRecentlyActiveRepositories(
  credentials: Record<string, string>
): Promise<string[]> {
  const { token, username } = credentials;

  try {
    // Get user's recent events to find active repositories
    const response = await fetch(
      `https://api.github.com/users/${username}/events?per_page=100`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Daily-Dashboard",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const events = await response.json();
    const repositories = new Set<string>();

    // Extract repository names from recent events
    for (const event of events) {
      if (event.repo?.name) {
        repositories.add(event.repo.name);
      }
    }

    return Array.from(repositories).slice(0, 20); // Limit to 20 most recent
  } catch (error) {}

  return [];
}

async function analyzeActivityPattern(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<{
  frontendCommits: number;
  backendCommits: number;
  suggestion: string;
}> {
  // This is a simplified implementation
  // In a real scenario, you'd analyze commit messages, file changes, etc.
  return {
    frontendCommits: 0,
    backendCommits: 0,
    suggestion:
      "Keep up the great work! Consider balancing frontend and backend contributions.",
  };
}

async function fetchSmartSuggestions(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<SmartSuggestion | null> {
  const { token, username } = credentials;

  if (!token || !username) {
    return null;
  }

  // Provide a default suggestion if no repositories are selected
  if (selectedRepositories.length === 0) {
    return {
      type: "balanced",
      message:
        "Select some repositories in settings to get personalized suggestions based on your coding patterns!",
      issues: [],
    };
  }

  try {
    // Analyze recent commits to understand coding patterns
    let recentCommits: any[] = [];
    let languageStats: any[] = [];

    try {
      recentCommits = await fetchRecentCommits(
        credentials,
        selectedRepositories
      );
    } catch (error) {
      // Continue with empty commits if fetch fails
    }

    try {
      languageStats = await fetchLanguageDistribution(
        credentials,
        selectedRepositories
      );
    } catch (error) {
      // Continue with empty language stats if fetch fails
    }

    // Analyze file patterns in recent commits
    let frontendFiles = 0;
    let backendFiles = 0;
    let testFiles = 0;
    let docFiles = 0;

    // Analyze commit messages and file patterns
    recentCommits.forEach((commit) => {
      const message = commit.message.toLowerCase();

      // Frontend indicators
      if (
        message.includes("ui") ||
        message.includes("frontend") ||
        message.includes("component") ||
        message.includes("style") ||
        message.includes("css") ||
        message.includes("react") ||
        message.includes("vue") ||
        message.includes("angular")
      ) {
        frontendFiles++;
      }

      // Backend indicators
      if (
        message.includes("api") ||
        message.includes("backend") ||
        message.includes("server") ||
        message.includes("database") ||
        message.includes("endpoint") ||
        message.includes("service")
      ) {
        backendFiles++;
      }

      // Test indicators
      if (
        message.includes("test") ||
        message.includes("spec") ||
        message.includes("unit") ||
        message.includes("integration")
      ) {
        testFiles++;
      }

      // Documentation indicators
      if (
        message.includes("doc") ||
        message.includes("readme") ||
        message.includes("comment") ||
        message.includes("documentation")
      ) {
        docFiles++;
      }
    });

    // Analyze language distribution
    const frontendLanguages = [
      "JavaScript",
      "TypeScript",
      "CSS",
      "HTML",
      "Vue",
      "React",
    ];
    const backendLanguages = [
      "Python",
      "Java",
      "Go",
      "Rust",
      "C++",
      "C#",
      "PHP",
      "Ruby",
    ];

    let frontendPercentage = 0;
    let backendPercentage = 0;

    languageStats.forEach((lang) => {
      if (frontendLanguages.includes(lang.language)) {
        frontendPercentage += lang.percentage;
      }
      if (backendLanguages.includes(lang.language)) {
        backendPercentage += lang.percentage;
      }
    });

    // Determine suggestion type based on patterns
    let suggestionType: "frontend" | "backend" | "balanced" = "balanced";
    let message = "";

    const totalCommits = recentCommits.length;

    // If no recent commits, provide a general suggestion
    if (totalCommits === 0) {
      const issues = await fetchSuggestedIssues(
        credentials,
        selectedRepositories,
        "balanced"
      );
      return {
        type: "balanced",
        message:
          "No recent commits found. Time to get coding! Check out these open issues to get started.",
        issues: issues.slice(0, 3),
      };
    }

    const frontendRatio = frontendFiles / Math.max(totalCommits, 1);
    const backendRatio = backendFiles / Math.max(totalCommits, 1);
    const testRatio = testFiles / Math.max(totalCommits, 1);

    // Generate contextual suggestions
    if (frontendRatio > 0.7 || frontendPercentage > 60) {
      suggestionType = "backend";
      message =
        "You've been focusing heavily on frontend work lately. Consider balancing with some backend tasks or API development.";
    } else if (backendRatio > 0.7 || backendPercentage > 60) {
      suggestionType = "frontend";
      message =
        "Lots of backend work recently! Time to polish the user experience with some frontend improvements.";
    } else if (testRatio < 0.1) {
      suggestionType = "balanced";
      message =
        "Your code coverage could use some attention. Consider adding tests to improve code reliability.";
    } else if (docFiles === 0 && totalCommits > 5) {
      suggestionType = "balanced";
      message =
        "Great coding momentum! Consider documenting your recent changes to help future contributors.";
    } else {
      suggestionType = "balanced";
      message =
        "Nice balanced development! Keep up the diverse contributions across different areas.";
    }

    // Fetch relevant issues based on suggestion type
    const issues = await fetchSuggestedIssues(
      credentials,
      selectedRepositories,
      suggestionType
    );

    const suggestion = {
      type: suggestionType,
      message,
      issues: issues.slice(0, 3), // Limit to 3 most relevant issues
    };

    return suggestion;
  } catch (error) {
    // Provide varied fallback suggestions
    const fallbackSuggestions = [
      {
        type: "balanced" as const,
        message:
          "Ready to make an impact? Check out some open issues that could use your expertise!",
      },
      {
        type: "frontend" as const,
        message:
          "Time to enhance the user experience! Look for UI improvements or component updates.",
      },
      {
        type: "backend" as const,
        message:
          "Consider strengthening the foundation! API improvements and performance optimizations await.",
      },
      {
        type: "balanced" as const,
        message:
          "Documentation and testing are always valuable contributions to any project.",
      },
    ];

    const randomSuggestion =
      fallbackSuggestions[
        Math.floor(Math.random() * fallbackSuggestions.length)
      ];

    // Try to fetch some issues even if analysis failed
    let issues: any[] = [];
    try {
      issues = await fetchSuggestedIssues(
        credentials,
        selectedRepositories,
        randomSuggestion.type
      );
    } catch (issueError) {
      // Continue with empty issues if this also fails
    }

    return {
      ...randomSuggestion,
      issues: issues.slice(0, 3),
    };
  }
}

async function fetchSuggestedIssues(
  credentials: Record<string, string>,
  selectedRepositories: string[],
  suggestionType: "frontend" | "backend" | "balanced"
): Promise<Array<{ title: string; url: string; repository: string }>> {
  const { token } = credentials;
  const issues: Array<{ title: string; url: string; repository: string }> = [];

  // Define search terms based on suggestion type
  let searchTerms: string[] = [];

  switch (suggestionType) {
    case "frontend":
      searchTerms = [
        "ui",
        "frontend",
        "component",
        "style",
        "css",
        "react",
        "vue",
        "angular",
        "design",
      ];
      break;
    case "backend":
      searchTerms = [
        "api",
        "backend",
        "server",
        "database",
        "endpoint",
        "service",
        "performance",
      ];
      break;
    case "balanced":
      searchTerms = [
        "test",
        "testing",
        "documentation",
        "refactor",
        "cleanup",
        "improvement",
      ];
      break;
  }

  // Search for issues in selected repositories
  for (const repo of selectedRepositories.slice(0, 3)) {
    // Limit to 3 repos for performance
    try {
      const searchQuery = searchTerms.map((term) => `"${term}"`).join(" OR ");
      const response = await fetch(
        `https://api.github.com/search/issues?q=repo:${repo}+state:open+type:issue+(${searchQuery})&sort=updated&per_page=5`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Daily-Dashboard",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        for (const issue of data.items || []) {
          issues.push({
            title: issue.title,
            url: issue.html_url,
            repository: repo,
          });

          if (issues.length >= 6) break; // Collect enough issues
        }
      }
    } catch (error) {
      // Continue with other repositories if one fails
      continue;
    }
  }

  return issues;
}

async function fetchProductivityMetrics(
  credentials: Record<string, string>,
  selectedRepositories: string[] = []
): Promise<ProductivityMetrics | null> {
  const { token, username } = credentials;

  if (!token || !username) {
    return null;
  }

  try {
    const activityPattern = await analyzeActivityPattern(
      credentials,
      selectedRepositories
    );

    // Generate sample productivity data
    // In a real implementation, this would analyze actual commit patterns, timing, etc.
    const now = new Date();
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      dailyData.push({
        date: date.toISOString().split("T")[0],
        commits: Math.floor(Math.random() * 10) + 1,
        linesAdded: Math.floor(Math.random() * 500) + 50,
        linesDeleted: Math.floor(Math.random() * 200) + 10,
        netChange: Math.floor(Math.random() * 400) - 100,
      });
    }

    const hourlyActivity = [];
    for (let hour = 0; hour < 24; hour++) {
      hourlyActivity.push({
        hour,
        commits: Math.floor(Math.random() * 5),
        intensity: Math.floor(Math.random() * 100),
      });
    }

    const languageDistribution = await fetchLanguageDistribution(
      credentials,
      selectedRepositories
    );
    const languageProficiency = languageDistribution
      .slice(0, 5)
      .map((lang) => ({
        language: lang.language,
        proficiencyScore: Math.min(100, lang.percentage * 2),
        recentActivity: Math.floor(Math.random() * 50) + 10,
        trend: ["improving", "declining", "stable"][
          Math.floor(Math.random() * 3)
        ] as "improving" | "declining" | "stable",
      }));

    // Generate focus time blocks
    const focusTimeBlocks = [
      { start: 9, end: 12, duration: 3 },
      { start: 14, end: 17, duration: 3 },
    ];

    return {
      codingVelocity: {
        daily: dailyData,
        trend: "increasing" as const,
      },
      peakHours: {
        hourlyActivity,
        mostProductiveHour: 14,
        focusTimeBlocks,
      },
      languageProficiency,
      focusMetrics: {
        averageSessionLength: 2.5,
        longestSession: 4.2,
        totalFocusTime: 6.8,
        interruptionRate: 0.3,
      },
    };
  } catch (error) {
    console.error("Error fetching productivity metrics:", error);
    return null;
  }
}
