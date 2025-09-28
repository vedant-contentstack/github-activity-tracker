export interface ServiceConfig {
  enabled: boolean;
  credentials: Record<string, string>;
  repositories?: string[]; // For GitHub service repository selection
  branches?: Record<string, string>; // For GitHub branch selection per repository {repo: branch}
}

export interface DashboardConfig {
  github: ServiceConfig;
}

export const defaultConfig: DashboardConfig = {
  github: {
    enabled: false,
    credentials: {},
  },
};

export const serviceCredentialFields = {
  github: [
    {
      key: "token",
      label: "GitHub Personal Access Token",
      type: "password",
      required: true,
    },
    { key: "username", label: "GitHub Username", type: "text", required: true },
    {
      key: "repositories",
      label: "Repository Selection",
      type: "repository-selector",
      required: false,
    },
    {
      key: "branches",
      label: "Branch Selection",
      type: "branch-selector",
      required: false,
    },
  ],
} as const;

const CONFIG_STORAGE_KEY = "dashboard-config";

export function getConfig(): DashboardConfig {
  if (typeof window === "undefined") return defaultConfig;

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.error("Error reading config from localStorage:", error);
  }

  return defaultConfig;
}

export function saveConfig(config: DashboardConfig): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving config to localStorage:", error);
  }
}

export function updateServiceConfig(
  service: keyof DashboardConfig,
  update: Partial<ServiceConfig>
): void {
  const config = getConfig();
  config[service] = { ...config[service], ...update };
  saveConfig(config);
}

export function isServiceEnabled(service: keyof DashboardConfig): boolean {
  const config = getConfig();
  return config[service].enabled;
}

export function getServiceCredentials(
  service: keyof DashboardConfig
): Record<string, string> {
  const config = getConfig();
  return config[service].credentials;
}
