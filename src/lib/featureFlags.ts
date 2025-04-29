export type FeatureName = "auth" | "create-travel-note" | "restore-password";
export type EnvironmentName = "local" | "integration" | "prod";

export interface FeatureFlags {
  auth: boolean;
  "create-travel-note": boolean;
  "restore-password": boolean;
}

const ENV_FEATURE_FLAGS: Record<EnvironmentName, FeatureFlags> = {
  local: {
    auth: true,
    "create-travel-note": true,
    "restore-password": false,
  },
  integration: {
    auth: true,
    "create-travel-note": false,
    "restore-password": false,
  },
  prod: {
    auth: false,
    "create-travel-note": false,
    "restore-password": false,
  },
};

export function getCurrentEnv(): EnvironmentName | null {
  const envFromConfig = import.meta.env.PUBLIC_ENV_NAME;
  if (envFromConfig === "local" || envFromConfig === "integration" || envFromConfig === "prod") {
    return envFromConfig as EnvironmentName;
  }
  return null;
}

export function isFeatureEnabled(feature: FeatureName): boolean {
  const env = getCurrentEnv();
  if (!env) return false;
  const featureFlags = ENV_FEATURE_FLAGS[env];
  return featureFlags[feature] === true;
}

export function getFeatureFlags(): FeatureFlags | null {
  const env = getCurrentEnv();
  if (!env) return null;
  return { ...ENV_FEATURE_FLAGS[env] };
}
