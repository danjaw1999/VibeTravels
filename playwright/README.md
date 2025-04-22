# E2E Tests for VibeTravels

This directory contains end-to-end tests using Playwright.

## Prerequisites

- Node.js installed
- VibeTravels project dependencies installed
- Environment variables for testing set up

## Environment Variables

Create or update your `.env` file with the following variables:

```
E2E_USERNAME_ID=your-user-id  # User ID for testing
E2E_USERNAME=your-email@example.com  # Email for login
E2E_PASSWORD=your-password  # Password for login
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Authentication and Test Data Creation

This test suite includes:

1. **Authentication Setup** (`auth.setup.ts`)
   - Logs in using the E2E test credentials from environment variables
   - Saves the authentication state for use in subsequent tests
   - Creates a storage state file at `playwright/.auth/user.json`

2. **Travel Note Creation Test** (`create-travel-note.spec.ts`) 
   - Creates a new travel note with a unique name
   - Uses the authenticated state from the setup
   - Verifies the note was created successfully

3. **Database Teardown** (`global.teardown.ts`)
   - Runs after all tests to clean up created data
   - Removes all attractions and travel notes created by the test user

## Running the Complete Test Suite

To run the complete test suite with authentication, tests, and cleanup:

```bash
npx playwright test
```

The tests will run in sequence:
1. Authentication setup
2. Tests (including travel note creation)
3. Database cleanup

## Running Tests

To run all tests:

```bash
npx playwright test
```

To run a specific test file:

```bash
npx playwright test login.spec.ts
```

To run tests with UI mode:

```bash
npx playwright test --ui
```

## Test Structure

- `tests/` - Test files
- `page-objects/` - Page Object Models for test organization
- `screenshots/` - Screenshots captured during tests
- `test-results/` - Test results and reports
- `report/` - HTML reports generated after test runs

## Page Objects

We use the Page Object Model pattern for better test organization:

- `LoginPage.ts` - Handles login page interactions
- `HomePage.ts` - Handles home page interactions

## Debugging Tests

To debug tests:

1. Run with UI mode: `npx playwright test --ui`
2. Check test screenshots in `playwright/screenshots/`
3. View HTML report: `npx playwright show-report`

## Database Teardown

After running E2E tests, the test data created in Supabase will be automatically cleaned up, specifically:

1. All attractions associated with travel notes created by the E2E test user will be deleted
2. All travel notes created by the E2E test user will be deleted

The teardown process uses the specified E2E user ID from environment variables.

## Troubleshooting

If you encounter issues with the database teardown:

1. Check that your environment variables are correctly set
2. Verify that the test user ID in `E2E_USERNAME_ID` exists in your Supabase instance
3. Ensure you have the correct permissions to delete data from the tables