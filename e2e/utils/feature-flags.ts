export const mockFeatureFlags = {
  auth: true,
  "create-travel-note": true,
  "restore-password": false,
};

export function getFeatureFlags() {
  return mockFeatureFlags;
}
