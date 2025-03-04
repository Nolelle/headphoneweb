// cypress/e2e/contact/form-submission.cy.ts

describe("Contact Form Submission", () => {
  // Test data to use in the form
  const testContactData = {
    name: "Test User",
    email: "test.user@example.com",
    message: "This is a test message sent from Cypress automation."
  };

  beforeEach(() => {
    // Visit the homepage
    cy.visit("/");

    // Handle site password if needed
    cy.enterSitePassword(Cypress.env("sitePassword"));

    // Scroll to the contact form section
    cy.get("#contact").scrollIntoView();

    // Ensure the form is visible
    cy.contains("Contact Us").should("be.visible");
  });

  it("should submit the contact form and show success message", () => {
    // Fill out the form
    cy.get("#name").type(testContactData.name);
    cy.get("#email").type(testContactData.email);
    cy.get("#message").type(testContactData.message);

    // Take a screenshot before submission
    cy.screenshot("contact-form-filled");

    // Submit the form
    cy.contains("button", "Send message").click();

    // Verify success message appears
    cy.contains("Message Sent Successfully!", { timeout: 10000 }).should(
      "be.visible"
    );

    // Verify success dialog content
    cy.contains("Thank you for contacting us!").should("be.visible");

    // Take a screenshot of success message
    cy.screenshot("contact-form-success");
  });

  // This test verifies the data in the database
  it("should save the contact form data to the database", () => {
    // First submit the form with unique identifiable data
    const uniqueMessage = `Cypress test message: ${Date.now()}`;

    cy.get("#name").type(testContactData.name);
    cy.get("#email").type(testContactData.email);
    cy.get("#message").type(uniqueMessage);

    // Submit the form
    cy.contains("button", "Send message").click();

    // Wait for success message
    cy.contains("Message Sent Successfully!", { timeout: 10000 }).should(
      "be.visible"
    );

    // Use custom command to check database
    cy.task("queryDatabase", {
      query: "SELECT * FROM contact_message WHERE message = $1",
      params: [uniqueMessage]
    }).then((result) => {
      // Check that we found a record
      expect(result.rows.length).to.equal(1);

      // Verify the data matches what we submitted
      const savedMessage = result.rows[0];
      expect(savedMessage.name).to.equal(testContactData.name);
      expect(savedMessage.email).to.equal(testContactData.email);
      expect(savedMessage.message).to.equal(uniqueMessage);
      expect(savedMessage.status).to.equal("UNREAD");

      // Log success for debugging
      cy.log("Successfully verified database record", savedMessage);
    });
  });

  // You can add this test to verify form validation if needed
  it("should validate required fields", () => {
    // Try to submit the form without entering any data
    cy.contains("button", "Send message").click();

    // Form should not submit and fields should be marked as required
    // Note: The exact behavior depends on your form implementation
    cy.contains("Message Sent Successfully!").should("not.exist");

    // Check for HTML5 validation or custom validation messages
    // The exact selectors and messages will depend on your implementation
    cy.get("#email:invalid").should("exist");
    cy.get("#message:invalid").should("exist");
  });

  // Clean up test data after all tests
  after(() => {
    // Clean up test data from the database
    cy.task("queryDatabase", {
      query: "DELETE FROM contact_message WHERE email = $1",
      params: [testContactData.email]
    });
  });
});
