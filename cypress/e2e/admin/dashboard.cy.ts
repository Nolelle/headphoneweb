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

    // Step 2: Find a customer message by email
    cy.findMessage(customerEmail).as("customerMessage");

    // Step 3: Mark message as read if it's unread
    cy.get("@customerMessage").then(($message) => {
      if ($message.text().includes("UNREAD")) {
        cy.wrap($message).contains("Mark as Read").click();
        // Wait for status update
        cy.wrap($message).contains("READ").should("be.visible");
      }
    });

    // Step 4: Respond to the message
    cy.get("@customerMessage").within(() => {
      cy.respondToMessage(testMessageResponse);
    });

    // Step 5: Verify the response is saved
    cy.get("@customerMessage")
      .contains("RESPONDED", { timeout: 10000 })
      .should("be.visible");

    cy.get("@customerMessage")
      .contains("Previous Response:")
      .next()
      .contains(testMessageResponse)
      .should("be.visible");
  });

  it("should handle empty form validation when responding to messages", () => {
    // Login as admin
    cy.adminLogin(admin.username, admin.password);

    // Find a message that's not already responded to
    cy.contains("READ").closest(".bg-[hsl(0_0%_9%)]").as("readMessage");

    // Try to send an empty response
    cy.get("@readMessage").within(() => {
      // The Send Response button should be disabled when textarea is empty
      cy.contains("Send Response").should("be.disabled");

      // Type and delete text to test validation
      cy.get("textarea").type("Test").clear();
      cy.contains("Send Response").should("be.disabled");
    });
  });
});
