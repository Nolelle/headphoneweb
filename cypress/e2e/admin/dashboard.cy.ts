describe("Admin Dashboard Management", () => {
  // Test data
  const admin = {
    username: "admin",
    password: "admin123"
  };
  const testMessageResponse =
    "Thank you for your inquiry. Our headphones have a battery life of approximately 20 hours on a single charge.";

  // Customer email to look for (from your seed data)
  const customerEmail = "john.smith@example.com";

  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("should allow admin to log in, view messages, and respond to them", () => {
    // Step 1: Login as admin using custom command
    cy.adminLogin(admin.username, admin.password);

    // Step 2: Check if the page loaded correctly and contains messages
    cy.contains("Admin Dashboard").should("be.visible");
    cy.contains("Contact Messages").should("be.visible");

    // Wait for messages to load
    cy.contains(customerEmail, { timeout: 10000 }).should("be.visible");

    // Step 3: Find the correct message card by email
    cy.contains("span", customerEmail)
      .parents('[data-testid^="message-card-"]')
      .as("messageCard");

    // Debug logging
    cy.get("@messageCard").then(($card) => {
      cy.log("Found message card:", $card.attr("data-testid"));
    });

    // Step 4: Check if message is unread and mark it as read if needed
    cy.get("@messageCard").then(($card) => {
      if ($card.text().includes("UNREAD")) {
        cy.wrap($card).contains("Mark as Read").click({ force: true });
        // Wait for the status to update
        cy.wrap($card).contains("READ", { timeout: 5000 }).should("be.visible");
      }
    });

    // Step 5: Look for and use the textarea
    cy.get("@messageCard").then(($card) => {
      // Check if the message already has a response
      if (
        $card.text().includes("RESPONDED") ||
        $card.text().includes("Previous Response:")
      ) {
        cy.log("Message already has a response, skipping response step");
        // Skip to checking the response is there
        cy.wrap($card).contains("Previous Response:").should("exist");
      } else {
        // Try to find the textarea
        cy.wrap($card).within(() => {
          // First check if the response form exists at all
          cy.get('[data-testid="response-form"]').should("exist");

          // Then look for the textarea within the form
          cy.get('[data-testid="response-textarea"]')
            .should("exist")
            .type(testMessageResponse);

          // Click the Send Response button
          cy.contains("Send Response").click({ force: true });

          // Wait for the response to be processed
          cy.wait(5000);
        });

        // Check for success indicators
        cy.get("@messageCard")
          .contains("Previous Response:", { timeout: 10000 })
          .should("exist");
        cy.get("@messageCard").contains(testMessageResponse).should("exist");
      }
    });
  });

  it("should handle empty form validation when responding to messages", () => {
    // Login as admin first
    cy.adminLogin(admin.username, admin.password);

    // Wait for messages to load
    cy.contains(customerEmail, { timeout: 10000 }).should("be.visible");

    // Spy on window alert
    const stub = cy.stub();
    cy.on("window:alert", stub);

    // Click on a message to view details
    cy.get("[data-testid^=message-card-]:first").click({ force: true });

    // The response form should be visible
    cy.get("[data-testid=response-form]").should("be.visible");

    // Check the Send Response button is disabled with empty form
    cy.get("[data-testid=send-response-button]").should("be.disabled");

    // Clear the stub
    cy.then(() => {
      stub.resetHistory();
    });
  });
});
