import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Extend Vitest with additional matchers if needed
// Example: extend with custom matchers

// Set up global mocks here
// Example: mocking global objects like localStorage
vi.stubGlobal("localStorage", {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Example: mocking the fetch API globally
global.fetch = vi.fn();

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// Export any useful test utilities you create
export function createMockResponse(data: unknown) {
  return {
    json: vi.fn().mockResolvedValue(data),
    ok: true,
    status: 200,
    headers: new Headers(),
  };
}
