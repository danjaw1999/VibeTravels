import { vi, afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "node:util";

// Extend Vitest with Testing Library matchers
expect.extend(matchers);

// Mock TextEncoder/TextDecoder for Astro components
global.TextEncoder = NodeTextEncoder;
global.TextDecoder = NodeTextDecoder as typeof global.TextDecoder;

if (!process.env.PUBLIC_ENV_NAME) {
  process.env.PUBLIC_ENV_NAME = import.meta.env.PUBLIC_ENV_NAME;
}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Intersection Observer
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock fetch API
global.fetch = vi.fn();

// Mock Astro specific globals
vi.stubGlobal("Astro", {
  request: {
    url: "http://localhost:3000",
    headers: new Headers(),
  },
});

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  localStorage.clear();
});

// Export test utilities
export function createMockResponse(data: unknown, status = 200) {
  return {
    json: vi.fn().mockResolvedValue(data),
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
  };
}

export function createMockError(status = 500, message = "Internal Server Error") {
  return {
    json: vi.fn().mockRejectedValue(new Error(message)),
    ok: false,
    status,
    headers: new Headers(),
  };
}

// Mock feature flags
vi.mock("@/lib/featureFlags", () => ({
  isFeatureEnabled: vi.fn().mockReturnValue(true),
  getCurrentEnv: vi.fn().mockReturnValue("local"),
  getFeatureFlags: vi.fn().mockReturnValue({
    auth: true,
    "create-travel-note": true,
    "restore-password": false,
  }),
}));
