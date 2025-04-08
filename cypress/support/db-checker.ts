// cypress/support/db-checker.ts
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to verify the database connection is working
       * @example cy.verifyDatabaseConnection()
       */
      verifyDatabaseConnection(): Chainable<Element>;
    }
  }
}

Cypress.Commands.add("verifyDatabaseConnection", () => {
  cy.log("Verifying database connection...");

  // Try to query the database
  cy.task("queryDatabase", {
    query: "SELECT 1 as test"
  }).then((result) => {
    cy.log(`Database connection result: ${JSON.stringify(result)}`);
    expect(result.rows).to.have.length(1);
    expect(result.rows[0].test).to.equal(1);
    cy.log("✅ Database connection successful");
  });
});

export {};
