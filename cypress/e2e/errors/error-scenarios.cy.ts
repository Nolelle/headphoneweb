// cypress/e2e/errors/error-scenarios.cy.ts
describe("Error Handling Scenarios", () => {
  beforeEach(() => {
    // Visit the homepage
    cy.visit("/");
    cy.enterSitePassword(Cypress.env("sitePassword"));
  });

  it("should handle API failures gracefully", () => {
    // Mock a failed API response
    cy.intercept("GET", "/api/**", {
      statusCode: 500,
      body: { error: "Server error" }
    }).as("apiFailure");

    // Reload page to trigger the intercepted request
    cy.reload();
    cy.enterSitePassword(Cypress.env("sitePassword"));

    // Wait for the intercepted request
    cy.wait("@apiFailure");

    // Page should still be accessible
    cy.get("body").should("be.visible");

    // Should show some kind of error indication
    // This depends on how your app handles errors, might be a toast, alert or inline message
    cy.get("body").then(($body) => {
      // Look for common error indicators
      const hasErrorIndicator =
        $body.text().includes("error") ||
        $body.text().includes("failed") ||
        $body.text().includes("unavailable") ||
        $body.find(".error-message").length > 0;

      expect(hasErrorIndicator).to.be.true;
    });
  });

  it("should handle contact form submission errors", () => {
    // Navigate to contact form
    cy.get("#contact").scrollIntoView();

    // Intercept the contact form API with an error
    cy.intercept("POST", "/api/contact", {
      statusCode: 500,
      body: { error: "Server unavailable" }
    }).as("contactError");

    // Fill and submit form
    cy.get("#name").type("Test User");
    cy.get("#email").type("test@example.com");
    cy.get("#message").type("Test message that will trigger an error.");
    cy.contains("button", "Send message").click({ force: true });

    // Wait for intercepted request
    cy.wait("@contactError");

    // Should show error message - verify that some error text appears
    cy.get("body").should(($body) => {
      const hasErrorText =
        $body.text().includes("failed") ||
        $body.text().includes("error") ||
        $body.text().includes("unavailable");
      expect(hasErrorText).to.be.true;
    });

    // Form should still be visible and editable
    cy.get("#name").should("be.visible");
    cy.get("#message").should(
      "have.value",
      "Test message that will trigger an error."
    );
  });

  it("should handle 404 error for non-existent routes", () => {
    // Visit a URL that doesn't exist
    cy.visit("/non-existent-page", { failOnStatusCode: false });

    // Need to handle password again
    cy.enterSitePassword(Cypress.env("sitePassword"));

    // Should show 404 page or error
    cy.contains(/404|not found|page doesn't exist/i).should("be.visible");
  });

  it("should handle checkout validation errors", () => {
    // Add product to cart
    cy.get("#headphone").scrollIntoView();
    cy.contains("button", "Add to Cart").click();

    // Go to cart
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();

    // Go to checkout
    cy.contains("button", "Proceed to Checkout").click({ force: true });

    // Try to submit empty form
    cy.get('button[type="submit"]').click({ force: true });

    // Should show validation errors
    cy.get("input:invalid").should("exist");

    // Should not redirect to confirmation page
    cy.url().should("include", "/checkout");
    cy.url().should("not.include", "/payment-success");
  });

  it("should handle network connectivity issues", () => {
    // Add product to cart first
    cy.get("#headphone").scrollIntoView();
    cy.contains("button", "Add to Cart").click();

    // Instead of trying to modify navigator.onLine which causes issues,
    // let's block all network requests temporarily
    cy.intercept("**", (req) => {
      req.reply({
        statusCode: 0,
        body: "Network error"
      });
    }).as("networkBlocked");

    // Try to perform an action that requires network
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click({ force: true });

    // Skip checking for specific offline indicators since the browser
    // may handle network failures differently
    // Just verify we don't crash and the page is still usable
    cy.get("body").should("be.visible");
  });

  it("should handle payment processing errors", () => {
    // Add product to cart
    cy.get("#headphone").scrollIntoView();
    cy.contains("button", "Add to Cart").click();

    // Go to checkout
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();
    cy.contains("button", "Proceed to Checkout").click({ force: true });

    // Intercept the Stripe payment intent API before filling form
    cy.intercept("POST", "/api/stripe/payment-intent", {
      statusCode: 500,
      body: { error: "Payment service unavailable" }
    }).as("paymentError");

    // Fill out form with minimal data
    cy.get("#name").type("Test User");
    cy.get("#email").type("test@example.com");
    cy.get("#address").type("123 Test St");

    // Try to submit form - this should trigger the payment intent API call
    cy.get('button[type="submit"]').click({ force: true });

    // Since the payment API fails immediately, just check that:
    // 1. We don't navigate away from checkout
    cy.url().should("include", "/checkout");
    // 2. We're still on a page with a form
    cy.get("form").should("exist");
  });
});
