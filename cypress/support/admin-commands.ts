// cypress/support/admin-commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in as admin
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

// Admin login command
Cypress.Commands.add("adminLogin", (username: string, password: string) => {
  cy.visit("/admin/login");
  cy.get("#username").type(username);
  cy.get("#password").type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/admin/dashboard");
  cy.contains("Admin Dashboard").should("be.visible");
});

// Find message command
Cypress.Commands.add("findMessage", (identifier: string) => {
  return cy
    .contains(identifier)
    .closest(".bg-[hsl(0_0%_9%)]")
    .should("be.visible");
});

// Respond to message command
Cypress.Commands.add("respondToMessage", (response: string) => {
  cy.get("textarea").type(response);
  cy.contains("Send Response").click();
  cy.contains("Response sent successfully", { timeout: 10000 }).should(
    "be.visible"
  );
});

export {}; // This is needed to make TypeScript treat this file as a module
