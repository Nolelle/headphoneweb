// cypress/support/admin-commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in as admin (handles site password if needed)
       * @example cy.adminLogin('admin', 'password')
       */
      adminLogin(username: string, password: string): Chainable<Element>;

      /**
       * Custom command to find a message by email or content
       * @example cy.findMessage('john@example.com')
       */
      findMessage(identifier: string): Chainable<Element>;

      /**
       * Custom command to respond to a message
       * @example cy.respondToMessage('Thank you for your inquiry')
       */
      respondToMessage(response: string): Chainable<Element>;
    }
  }
}

// Admin login command - now handles site password too
Cypress.Commands.add("adminLogin", (username: string, password: string) => {
  // Visit admin login (might redirect to site password page first)
  cy.visit("/admin/login");

  // Check if we're on the site password page
  cy.url().then((url) => {
    if (url.includes("/enter-password")) {
      // Handle site password
      cy.get('input[type="password"]').type("mypassword");
      cy.contains("button", "Enter Site").click();

      // After site password, we should be redirected to admin login
      cy.url().should("include", "/admin/login");
    }
  });

  // Now handle admin login
  cy.get("#username").type(username);
  cy.get("#password").type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/admin/dashboard");
  cy.contains("Admin Dashboard").should("be.visible");
});

// Find message command - updated to avoid problematic CSS selectors
Cypress.Commands.add("findMessage", (identifier: string) => {
  // First find the element containing the identifier text
  return (
    cy
      .contains(identifier)
      // Use a more reliable DOM traversal approach
      .parents()
      .filter((index, el) => {
        const classList = Cypress.$(el).attr("class") || "";
        return (
          classList.includes("pt-6") ||
          (classList.includes("space-y-") && classList.includes("bg-"))
        );
      })
      .first()
      .should("be.visible")
  );
});

// Respond to message command
Cypress.Commands.add("respondToMessage", (response: string) => {
  cy.get("textarea").type(response);
  cy.contains("Send Response").click();
  cy.contains("Response sent successfully", { timeout: 10000 }).should(
    "be.visible"
  );
});

export {};
