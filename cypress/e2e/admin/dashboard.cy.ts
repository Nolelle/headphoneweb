describe("Admin Dashboard Management", () => {
  // Test data
  const admin = {
    username: "admin",
    password: "admin123" // Should match your seed data
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
        cy.wrap($card).contains("Mark as Read").click();
        // Wait for the status to update
        cy.wrap($card).contains("READ", { timeout: 5000 }).should("be.visible");
      }
    });

    // Step 5: Look for and use the textarea
    cy.get("@messageCard").within(() => {
      // Check if the textarea exists and log detailed information
      cy.document().then((doc) => {
        const textareas = doc.querySelectorAll("textarea");
        cy.log(`Number of textareas found: ${textareas.length}`);
        if (textareas.length === 0) {
          cy.log("No textareas found in the message card");
        }
      });

      // Try using a more specific selector
      cy.get('[data-testid="response-textarea"]').should("exist");
      cy.get('[data-testid="response-textarea"]').type(testMessageResponse);

      // Click the Send Response button
      cy.contains("Send Response").click();

      // Wait for the response to be processed
      cy.wait(5000);
    });

    // Step 6: Check for success indicators
    cy.get("@messageCard")
      .contains("Previous Response:", { timeout: 10000 })
      .should("exist");
    cy.get("@messageCard").contains(testMessageResponse).should("exist");
  });

  it("should handle empty form validation when responding to messages", () => {
    // Login as admin
    cy.adminLogin(admin.username, admin.password);

    // Wait for messages to load
    cy.get("body").contains("READ", { timeout: 10000 }).should("exist");

    // Find a message with READ status
    cy.contains("span", "READ")
      .parents('[data-testid^="message-card-"]')
      .as("readMessage");

    // Try to send without entering text - button should be disabled
    cy.get("@readMessage").within(() => {
      // Find the Send Response button and check if it's disabled
      cy.contains("Send Response").should("be.disabled");

      // Try with a more specific selector
      cy.get('[data-testid="response-textarea"]').should("exist");
      cy.get('[data-testid="response-textarea"]').type("Test").clear();
      cy.contains("Send Response").should("be.disabled");
    });
  });
});
