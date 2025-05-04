export const mockFeatureFlags = {
  auth: true,
  "create-travel-note": true,
  "restore-password": false,
  profile: false,
};

export function getFeatureFlags() {
  return mockFeatureFlags;
}
