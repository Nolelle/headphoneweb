declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to authenticate with site password
       * @example cy.enterSitePassword('mypassword')
       */
      enterSitePassword(password: string): Chainable<Element>;
    }
  }
}

// Command to enter site password
Cypress.Commands.add("enterSitePassword", (password: string) => {
  cy.url().then((url) => {
    // Only enter password if we're on the password page
    if (url.includes("/enter-password")) {
      cy.get('input[type="password"]').type(password);
      cy.contains("button", "Enter Site").click();

      // Wait for redirect to complete
      cy.url().should("not.include", "/enter-password");
    }
  });
});

export {};
