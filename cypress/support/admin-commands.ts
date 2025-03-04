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

      /**
       * Custom command to respond to a message with retry logic
       * @example cy.respondToMessageWithRetry('Thank you for your inquiry')
       */
      respondToMessageWithRetry(response: string): Chainable<Element>;
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

// Find message command - updated to use more reliable selectors
Cypress.Commands.add("findMessage", (identifier: string) => {
  // Look for the email that contains the identifier
  return cy
    .contains("span", identifier)
    .parents('[data-testid^="message-card-"]')
    .should("be.visible");
});

// Respond to message command with improved reliability
Cypress.Commands.add("respondToMessage", (response: string) => {
  // Find the textarea using a more specific selector
  cy.get('[data-testid="response-textarea"]').should("exist");
  cy.get('[data-testid="response-textarea"]').clear().type(response);

  // Click the Send Response button
  cy.contains("Send Response").click();

  // Wait for the success toast or for the status to change to RESPONDED
  cy.wait(5000); // Longer wait for backend processing

  // Check for success indicators
  cy.contains("Previous Response:", { timeout: 10000 }).should("exist");
});

// More robust command with retry logic for flaky operations
Cypress.Commands.add("respondToMessageWithRetry", (response: string) => {
  cy.get("textarea").clear().type(response);
  cy.contains("Send Response").click();

  // Try multiple ways to detect success with retries
  let attempts = 0;
  const maxAttempts = 5;

  function checkSuccess() {
    if (attempts >= maxAttempts) {
      throw new Error(
        `Failed to confirm response success after ${maxAttempts} attempts`
      );
    }

    attempts++;
    cy.wait(1000); // Wait between checks

    cy.get("body").then(($body) => {
      const text = $body.text();
      const hasSuccess = text.includes("Response sent successfully");
      const hasRespondedStatus = text.includes("RESPONDED");
      const hasSuccessElement =
        $body.find("#response-success-message").length > 0;

      if (hasSuccess || hasRespondedStatus || hasSuccessElement) {
        // Success found, continue
        return;
      } else if (attempts < maxAttempts) {
        // Try again
        cy.wait(1000);
        checkSuccess();
      } else {
        // Final attempt failed
        throw new Error("Could not verify successful response");
      }
    });
  }

  checkSuccess();
});

export {};
