"use client";

import { useState, useEffect } from "react";
import { X, Github, Settings, Eye, EyeOff, Save, Check } from "lucide-react";
import {
  getConfig,
  saveConfig,
  serviceCredentialFields,
  type DashboardConfig,
} from "@/lib/config";
import { RepositorySelector } from "./repository-selector";
import { BranchSelector } from "./branch-selector";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onConfigChange,
}: SettingsModalProps) {
  const [config, setConfig] = useState<DashboardConfig>(() => {
    // Avoid hydration mismatch
    if (typeof window === "undefined") {
      return {
        github: { enabled: false, credentials: {} },
      };
    }
    return getConfig();
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setConfig(getConfig());
    }
  }, [isOpen]);

  const serviceIcons = {
    github: Github,
  };

  const serviceLabels = {
    github: "GitHub",
  };

  const handleServiceToggle = (service: keyof DashboardConfig) => {
    const newConfig = {
      ...config,
      [service]: {
        ...config[service],
        enabled: !config[service].enabled,
      },
    };
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange?.();
  };

  const handleCredentialChange = (
    service: keyof DashboardConfig,
    field: string,
    value: string
  ) => {
    const newConfig = {
      ...config,
      [service]: {
        ...config[service],
        credentials: {
          ...config[service].credentials,
          [field]: value,
        },
      },
    };
    setConfig(newConfig);
  };

  const handleRepositorySelectionChange = (
    service: keyof DashboardConfig,
    repositories: string[]
  ) => {
    const newConfig = {
      ...config,
      [service]: {
        ...config[service],
        repositories,
      },
    };
    setConfig(newConfig);
  };

  const handleBranchSelectionChange = (
    service: keyof DashboardConfig,
    branches: Record<string, string>
  ) => {
    const newConfig = {
      ...config,
      [service]: {
        ...config[service],
        branches,
      },
    };
    setConfig(newConfig);
  };

  const handleSaveCredentials = (service: keyof DashboardConfig) => {
    saveConfig(config);
    setSavedStates({ ...savedStates, [service]: true });
    setTimeout(() => {
      setSavedStates({ ...savedStates, [service]: false });
    }, 2000);
    onConfigChange?.();
  };

  const togglePasswordVisibility = (fieldKey: string) => {
    setShowPasswords({
      ...showPasswords,
      [fieldKey]: !showPasswords[fieldKey],
    });
  };

  if (!isOpen || !mounted) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dashboard Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-8">
            {Object.entries(serviceLabels).map(([serviceKey, serviceLabel]) => {
              const service = serviceKey as keyof DashboardConfig;
              const ServiceIcon = serviceIcons[service];
              const isEnabled = config[service].enabled;
              const fields = serviceCredentialFields[service];

              return (
                <div
                  key={service}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <ServiceIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {serviceLabel}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleServiceToggle(service)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {isEnabled && (
                    <div className="space-y-4">
                      {fields.map((field) => {
                        const fieldKey = `${service}-${field.key}`;
                        const isPassword = field.type === "password";
                        const isRepositorySelector =
                          field.type === "repository-selector";
                        const isBranchSelector =
                          field.type === "branch-selector";
                        const showPassword = showPasswords[fieldKey];

                        if (isRepositorySelector) {
                          return (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              <RepositorySelector
                                token={config[service].credentials.token || ""}
                                username={
                                  config[service].credentials.username || ""
                                }
                                selectedRepositories={
                                  config[service].repositories || []
                                }
                                onSelectionChange={(repositories) =>
                                  handleRepositorySelectionChange(
                                    service,
                                    repositories
                                  )
                                }
                              />
                            </div>
                          );
                        }

                        if (isBranchSelector) {
                          return (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              <BranchSelector
                                value={config[service].branches || {}}
                                onChange={(branches) =>
                                  handleBranchSelectionChange(service, branches)
                                }
                                repositories={
                                  config[service].repositories || []
                                }
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <div className="relative">
                              <input
                                type={
                                  isPassword && !showPassword
                                    ? "password"
                                    : "text"
                                }
                                value={
                                  config[service].credentials[field.key] || ""
                                }
                                onChange={(e) =>
                                  handleCredentialChange(
                                    service,
                                    field.key,
                                    e.target.value
                                  )
                                }
                                placeholder={`Enter your ${field.label.toLowerCase()}`}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                              />
                              {isPassword && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    togglePasswordVisibility(fieldKey)
                                  }
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => handleSaveCredentials(service)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {savedStates[service] ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Credentials</span>
                          </>
                        )}
                      </button>

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Setup Instructions:</strong>
                        </p>
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          <p>
                            1. Go to GitHub Settings → Developer settings →
                            Personal access tokens
                          </p>
                          <p>2. Generate a new token with 'repo' scope</p>
                          <p>3. Enter your GitHub username</p>
                          <p>
                            4. Optionally select specific repositories to track
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
