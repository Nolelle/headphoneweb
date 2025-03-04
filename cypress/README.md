# Cypress E2E Testing Guide

This guide explains how to run the Cypress E2E tests for the headphoneweb application.

## Test Structure

Tests are organized in the `cypress/e2e` directory, following a feature-based structure:

- `cypress/e2e/contact/` - Tests for the contact form
- `cypress/e2e/admin/` - Tests for admin functionality
- (Additional test categories can be added as needed)

## Prerequisites

1. The application must be running locally on port 3000
2. PostgreSQL database must be running with the correct schema
3. Environment variables should be configured (or default values will be used)

## Running Tests

### Open Cypress Test Runner

```bash
npm run cypress:open
# or
yarn cypress:open
```

This opens the Cypress Test Runner UI where you can select and run specific tests.

### Run All Tests Headlessly

```bash
npm run cypress:run
# or
yarn cypress:run
```

### Run Specific Test Categories

To run only the contact form tests:

```bash
npm run cypress:contact
# or
yarn cypress:contact
```

### Run Tests with Development Server

This command starts the Next.js development server and runs Cypress tests against it:

```bash
npm run test:e2e
# or
yarn test:e2e
```

## Database Integration

Tests that verify database state use the `queryDatabase` task. This task connects to your local PostgreSQL database to verify that data has been properly saved.

Example:

```typescript
cy.task('queryDatabase', {
  query: 'SELECT * FROM contact_message WHERE email = $1',
  params: ['test@example.com']
}).then(result => {
  // Assert on the database results
  expect(result.rows.length).to.equal(1);
});
```

## Site Password Authentication

Since the application uses site-wide password protection, tests use the `enterSitePassword` command to handle authentication:

```typescript
cy.visit('/');
cy.enterSitePassword(Cypress.env('sitePassword'));
```

## Debugging Tests

1. Screenshots are saved in the `cypress/screenshots` directory
2. Videos of test runs are saved in the `cypress/videos` directory
3. Add `cy.log()` statements for debugging

## Environment Variables

Tests use values from `cypress.config.ts` or environment variables:

- `DB_USER`: Database username (default: "myuser")
- `DB_PASSWORD`: Database password (default: "mypassword")
- `DB_HOST`: Database host (default: "localhost")
- `DB_PORT`: Database port (default: "5432")
- `DB_NAME`: Database name (default: "headphoneweb")
