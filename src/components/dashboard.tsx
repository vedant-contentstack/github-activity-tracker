"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GitHubWidget } from "@/components/widgets/github-widget";
import { SettingsModal } from "@/components/settings/settings-modal";
import { getConfig, type DashboardConfig } from "@/lib/config";

export function Dashboard() {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    // Avoid hydration mismatch by using defaultConfig on initial render
    if (typeof window === "undefined") {
      return {
        github: { enabled: false, credentials: {} },
      };
    }
    return getConfig();
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(getConfig());
  }, []);

  const handleConfigChange = () => {
    setConfig(getConfig());
  };

  const enabledServices = Object.entries(config).filter(
    ([_, serviceConfig]) => serviceConfig.enabled
  );

  const hasEnabledServices = enabledServices.length > 0;

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen p-4 lg:p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-[100rem] mx-auto space-y-6">
        <DashboardHeader onSettingsClick={() => setIsSettingsOpen(true)} />

        {!hasEnabledServices ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Your Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Get started by enabling and configuring the services you want to
                see on your dashboard.
              </p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configure Services
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Dashboard Grid Layout */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {config.github.enabled && (
                <div className="col-span-1">
                  <GitHubWidget />
                </div>
              )}
              {/* Future widgets can be added here with responsive grid positioning */}
            </div>
          </div>
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onConfigChange={handleConfigChange}
        />
      </div>
    </div>
  );
}
