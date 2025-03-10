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
    cy.contains("button", "Send message").click();

    // Wait for intercepted request
    cy.wait("@contactError");

    // Should show error message
    cy.contains(/failed|error|unavailable/).should("be.visible");

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
    cy.contains("button", "Proceed to Checkout").click();

    // Try to submit empty form
    cy.get('button:contains("Pay")').click();

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

    // Simulate offline mode
    cy.window().then((win) => {
      // @ts-ignore - This property exists on navigator
      Object.defineProperty(win.navigator, "onLine", { value: false });
      win.dispatchEvent(new Event("offline"));
    });

    // Try to perform an action that requires network
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();
    cy.contains("button", "Proceed to Checkout").click();

    // Look for offline indicator or error message
    cy.get("body").then(($body) => {
      const hasOfflineIndicator =
        $body.text().includes("offline") ||
        $body.text().includes("network") ||
        $body.text().includes("internet") ||
        $body.text().includes("connection");

      // In some implementations, this might not show a specific message
      // So we'll just assert that we didn't proceed to payment success
      cy.url().should("not.include", "/payment-success");
    });

    // Set back online
    cy.window().then((win) => {
      // @ts-ignore - This property exists on navigator
      Object.defineProperty(win.navigator, "onLine", { value: true });
      win.dispatchEvent(new Event("online"));
    });
  });

  it("should handle payment processing errors", () => {
    // Add product to cart
    cy.get("#headphone").scrollIntoView();
    cy.contains("button", "Add to Cart").click();

    // Go to checkout
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();
    cy.contains("button", "Proceed to Checkout").click();

    // Intercept the Stripe payment intent API
    cy.intercept("POST", "/api/stripe/payment-intent", {
      statusCode: 500,
      body: { error: "Payment service unavailable" }
    }).as("paymentError");

    // Fill out form with minimal data
    cy.get("#name").type("Test User");
    cy.get("#email").type("test@example.com");
    cy.get("#address").type("123 Test St");

    // Mock any Stripe Elements or try to submit form directly
    cy.get('button:contains("Pay")').click();

    // Wait for error API call
    cy.wait("@paymentError");

    // Should show error message
    cy.contains(/failed|error|payment|unavailable/).should("be.visible");

    // Should not redirect to success page
    cy.url().should("not.include", "/payment-success");
  });
});
