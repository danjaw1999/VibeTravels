# Feature Flags Plan

W naszym systemie feature flag, plan zakłada utworzenie uniwersalnego modułu TypeScript, który będzie wykorzystywany zarówno na frontendzie, jak i backendzie.

## Środowiska

Moduł obsługuje następujące środowiska:

- local
- integration
- prod

Wartość środowiska jest pobierana z zmiennej `PUBLIC_ENV_NAME` za pomocą `import.meta.env`.

## Główne funkcje

### getCurrentEnv

Funkcja `getCurrentEnv`:

- Pobiera wartość `PUBLIC_ENV_NAME`.
- Jeśli wartość jest jedną z akceptowanych (`local`, `integration`, `prod`), zwraca ją.
- W przeciwnym wypadku zwraca `null`.

### isFeatureEnabled

Funkcja `isFeatureEnabled`:

- Pobiera aktualne środowisko za pomocą `getCurrentEnv`.
- Jeśli środowisko jest niepoprawne (tj. `null`), zwraca `false`.
- W przeciwnym razie, dla zadanej flagi (typ: `'auth' | 'create-travel-note'`), zwraca `true` lub `false` w zależności od konfiguracji flag w danym środowisku.

### getFeatureFlags

Funkcja `getFeatureFlags`:

- Zwraca konfigurację flag dla bieżącego środowiska lub `null`, jeśli środowisko jest niepoprawne.

## Przykład implementacji modułu

```typescript
// src/features/featureFlags.ts
export type FeatureName = "auth" | "create-travel-note";
export type EnvironmentName = "local" | "integration" | "prod";

export interface FeatureFlags {
  auth: boolean;
  "create-travel-note": boolean;
}

const ENV_FEATURE_FLAGS: Record<EnvironmentName, FeatureFlags> = {
  local: {
    auth: true,
    "create-travel-note": true,
  },
  integration: {
    auth: true,
    "create-travel-note": false,
  },
  prod: {
    auth: false,
    "create-travel-note": false,
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
```

## Zastosowanie

- W endpointach API: Możesz warunkowo obsługiwać logikę autoryzacji lub zarządzania notatkami podróżniczymi.
- W stronach Astro: Można używać funkcji do dynamicznego włączania/wyłączania stron takich jak `login.astro`, `register.astro` lub `index.astro`.
- W widoczności kolekcji np. `NavBar.tsx`: Użycie funkcji umożliwia kontrolę widoczności menu lub przycisków w zależności od flag funkcjonalności.

Plan ten zakłada, że konfiguracja flag jest określana przy budowaniu aplikacji i nie może być dynamicznie zmieniana.
