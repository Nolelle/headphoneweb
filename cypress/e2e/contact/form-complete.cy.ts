// cypress/e2e/contact/form-complete.cy.ts
describe("Contact Form Complete Flow", () => {
  // Generate unique test data to avoid test collisions
  const generateUniqueTestData = () => ({
    name: "Test User",
    email: `test.user.${Date.now()}@example.com`,
    message: `Test message sent from Cypress automation at ${new Date().toISOString()}`
  });

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

  it("should submit the contact form and verify database entry", () => {
    const testData = generateUniqueTestData();

    // Fill out the form
    cy.get("#name").type(testData.name);
    cy.get("#email").type(testData.email);
    cy.get("#message").type(testData.message);

    // Take a screenshot before submission
    cy.screenshot("contact-form-filled");

    // Submit the form
    cy.contains("button", "Send message").click({ force: true });

    // Verify success message appears
    cy.contains("Message Sent Successfully!", { timeout: 10000 }).should(
      "be.visible"
    );

    // Verify success dialog content
    cy.contains("Thank you for contacting us!").should("be.visible");

    // Take a screenshot of success message
    cy.screenshot("contact-form-success");

    // Verify the database entry
    cy.task("queryDatabase", {
      query: "SELECT * FROM contact_message WHERE email = $1",
      params: [testData.email]
    }).then((result) => {
      // Check that we found a record
      expect(result.rows.length).to.equal(1);

      // Verify the data
      const savedMessage = result.rows[0];
      expect(savedMessage.name).to.equal(testData.name);
      expect(savedMessage.email).to.equal(testData.email);
      expect(savedMessage.message).to.equal(testData.message);
      expect(savedMessage.status).to.equal("UNREAD");

      // Log success for debugging
      cy.log("Successfully verified database record", savedMessage);
    });
  });

  it("should validate form fields properly", () => {
    // Try to submit without entering any data
    cy.contains("button", "Send message").click({ force: true });

    // Form should not submit and fields should be marked as required
    cy.contains("Message Sent Successfully!").should("not.exist");

    // At least check that we didn't get success message
    // Different HTML5 validation behaviors might occur depending on browser
    cy.get("input:invalid,textarea:invalid").should("exist");

    // Fix one field at a time and test validation
    cy.get("#name").type("Test User");
    cy.contains("button", "Send message").click({ force: true });
    cy.contains("Message Sent Successfully!").should("not.exist");

    cy.get("#email").type("invalid-email"); // Using invalid format
    cy.contains("button", "Send message").click({ force: true });
    cy.contains("Message Sent Successfully!").should("not.exist");

    // Fix email format
    cy.get("#email").clear().type("valid@example.com");
    cy.contains("button", "Send message").click({ force: true });
    cy.contains("Message Sent Successfully!").should("not.exist");

    // Add a very short message (potentially too short)
    cy.get("#message").type("Short");
    cy.contains("button", "Send message").click({ force: true });

    // Check if there's length validation
    // If there's a minimum length requirement, we'll see an error message or no success
    cy.get("body").then(($body) => {
      if (!$body.text().includes("Message Sent Successfully!")) {
        // Add a longer message if validation failed
        cy.get("#message")
          .clear()
          .type(
            "This is a much longer test message that should pass validation"
          );
        cy.contains("button", "Send message").click({ force: true });
        cy.contains("Message Sent Successfully!", { timeout: 10000 }).should(
          "be.visible"
        );
      }
    });
  });

  it("should display proper loading state during submission", () => {
    const testData = generateUniqueTestData();

    // Fill form
    cy.get("#name").type(testData.name);
    cy.get("#email").type(testData.email);
    cy.get("#message").type(testData.message);

    // Intercept the contact API to be able to wait for it
    cy.intercept("POST", "/api/contact").as("contactSubmit");

    // Submit and check for loading state
    cy.contains("button", "Send message").click({ force: true });

    // Wait for the button to change to loading state
    cy.get("[data-testid=sending-button]", { timeout: 2000 }).should("exist");

    // Check if the button shows loading state through classes or visual indicators
    cy.get("[data-testid=sending-button]").should(($btn) => {
      // Check if the button is disabled
      expect($btn.prop("disabled")).to.be.true;
    });

    // Wait for the request to complete
    cy.wait("@contactSubmit");

    // Eventually success message should appear
    cy.contains("Message Sent Successfully!", { timeout: 10000 }).should(
      "be.visible"
    );
  });

  // Clean up test data after all tests
  after(() => {
    // Clean up test data from the database using pattern matching
    cy.task("queryDatabase", {
      query:
        "DELETE FROM contact_message WHERE email LIKE 'test.user.%@example.com'"
    });
  });
});
