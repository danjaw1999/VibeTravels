# VibeTravels Testing Guide

This guide explains how to write and run tests for the VibeTravels application.

## Testing Stack

- **Unit and Component Tests**: Vitest with React Testing Library
- **End-to-End Tests**: Playwright
- **Test Coverage**: Vitest's built-in coverage reporter

## Running Tests

### Unit and Component Tests

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode (during development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# View E2E test report
npm run test:e2e:report
```

## Writing Tests

### Unit Tests with Vitest

Unit tests are located in `__tests__` directories next to the components/functions they test. For example:

- Component: `src/components/LoginButton.tsx`
- Test: `src/components/__tests__/LoginButton.test.tsx`

Guidelines for writing unit tests:

- Use the `vi` object for test doubles
  - `vi.fn()` for function mocks
  - `vi.spyOn()` to monitor existing functions
  - `vi.stubGlobal()` for global mocks
- Use `vi.mock()` to mock modules
- Use React Testing Library for component tests
- Implement proper assertions with specific matchers

Example:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### End-to-End Tests with Playwright

E2E tests are located in the `playwright/tests` directory and use the Page Object Model pattern with page objects in `playwright/page-objects`.

Guidelines for writing E2E tests:

- Use the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Use visual comparison with `expect(page).toHaveScreenshot()`
- Implement proper assertions with Playwright's expect library

Example:

```typescript
import { test, expect } from "@playwright/test";
import { HomePage } from "../page-objects/HomePage";

test("should navigate to about page", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.clickNavLink("About");
  await expect(page).toHaveURL(/.*about/);
});
```

## Best Practices

1. **Write tests before or alongside the code** - Follow TDD when possible
2. **Test behavior, not implementation** - Focus on what the user sees/experiences
3. **Keep tests isolated** - Tests should not depend on each other
4. **Use meaningful assertions** - Make sure your test verifies what you think it does
5. **Match test structure to application structure** - Makes tests easier to find
6. **Minimize use of snapshot testing** - Use for stable components only
7. **Run tests in CI/CD pipeline** - Ensure tests pass before deployment
