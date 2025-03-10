// cypress/support/db-commands.ts
import { Pool } from "pg";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to query the database
       * @param options.query - SQL query to execute
       * @param options.params - Query parameters
       * @example cy.task('queryDatabase', { query: 'SELECT * FROM users WHERE email = $1', params: ['test@example.com'] })
       */
      task(
        event: "queryDatabase",
        options: { query: string; params?: any[] }
      ): Chainable<any>;
    }
  }
}

// This file doesn't contain implementation - that will be in the cypress.config.ts
