"use client";

import { Calendar, Settings, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

interface DashboardHeaderProps {
  onSettingsClick: () => void;
}

export function DashboardHeader({ onSettingsClick }: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentDate = new Date();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    window.location.reload();
  };

  return (
    <header className="glass-effect rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Good {getGreeting()}!
            </h1>
            <p className="text-gray-800 dark:text-gray-200">
              {formatDate(currentDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Refresh Dashboard"
          >
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
