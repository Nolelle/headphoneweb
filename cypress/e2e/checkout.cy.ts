// cypress/e2e/checkout.cy.js

describe("Checkout Flow", () => {
  beforeEach(() => {
    // Add a product to cart before each test
    cy.visit("/products");

    // Handle site password if needed
    cy.enterSitePassword(Cypress.env("sitePassword"));

    cy.get('[data-cy="product-card"]').first().click();
    cy.get('[data-cy="add-to-cart"]').click();
    cy.get('[data-cy="cart-icon"]').click();
    cy.get('[data-cy="checkout-button"]').click();
  });

  it("should complete the checkout flow successfully", () => {
    // Test case #31: Checkout Flow Completeness
    // Fill out shipping information
    cy.get('[data-cy="checkout-form"]').within(() => {
      cy.get('[name="name"]').type("Test User");
      cy.get('[name="email"]').type("test@example.com");
      cy.get('[name="address"]').type("123 Test St");
      cy.get('[name="city"]').type("Test City");
      cy.get('[name="state"]').type("TS");
      cy.get('[name="zip"]').type("12345");
      cy.get('[data-cy="continue-button"]').click();
    });

    // Test Stripe payments (using test mode)
    cy.get('iframe[name^="__privateStripeFrame"]').then(($iframe) => {
      const $body = $iframe.contents().find("body");
      cy.wrap($body).find('input[name="cardnumber"]').type("4242424242424242");
      cy.wrap($body).find('input[name="exp-date"]').type("1234");
      cy.wrap($body).find('input[name="cvc"]').type("123");
      cy.wrap($body).find('input[name="postal"]').type("12345");
    });

    cy.get('[data-cy="submit-payment"]').click();

    // Verify order confirmation
    cy.url().should("include", "/order-confirmation");
    cy.get('[data-cy="order-confirmation"]').should("be.visible");
    cy.get('[data-cy="order-summary"]').should("be.visible");
  });

  it("should handle payment errors gracefully", () => {
    // Test case #33: Error Handling During Payment Processing
    cy.get('[data-cy="checkout-form"]').within(() => {
      cy.get('[name="name"]').type("Test User");
      cy.get('[name="email"]').type("test@example.com");
      cy.get('[name="address"]').type("123 Test St");
      cy.get('[name="city"]').type("Test City");
      cy.get('[name="state"]').type("TS");
      cy.get('[name="zip"]').type("12345");
      cy.get('[data-cy="continue-button"]').click();
    });

    // Use a test card that will be declined
    cy.get('iframe[name^="__privateStripeFrame"]').then(($iframe) => {
      const $body = $iframe.contents().find("body");
      cy.wrap($body).find('input[name="cardnumber"]').type("4000000000000002"); // Declined card
      cy.wrap($body).find('input[name="exp-date"]').type("1234");
      cy.wrap($body).find('input[name="cvc"]').type("123");
      cy.wrap($body).find('input[name="postal"]').type("12345");
    });

    cy.get('[data-cy="submit-payment"]').click();

    // Verify error message
    cy.contains("Your card was declined").should("be.visible");
    cy.get('[data-cy="try-again"]').should("be.visible");
  });

  it("should display order confirmation accurately", () => {
    // Test case #32: Order Confirmation Accuracy
    // Similar to the first test, but focusing on the confirmation details
    // Abbreviated for brevity - would complete the checkout flow first
    // Then verify specific order details on the confirmation page
    cy.get('[data-cy="checkout-form"]').within(() => {
      cy.get('[name="name"]').type("Test User");
      cy.get('[name="email"]').type("test@example.com");
      cy.get('[name="address"]').type("123 Test St");
      cy.get('[name="city"]').type("Test City");
      cy.get('[name="state"]').type("TS");
      cy.get('[name="zip"]').type("12345");
      cy.get('[data-cy="continue-button"]').click();
    });

    // Complete payment
    cy.get('iframe[name^="__privateStripeFrame"]').then(($iframe) => {
      const $body = $iframe.contents().find("body");
      cy.wrap($body).find('input[name="cardnumber"]').type("4242424242424242");
      cy.wrap($body).find('input[name="exp-date"]').type("1234");
      cy.wrap($body).find('input[name="cvc"]').type("123");
      cy.wrap($body).find('input[name="postal"]').type("12345");
    });

    cy.get('[data-cy="submit-payment"]').click();

    // Verify specific order details
    cy.url().should("include", "/order-confirmation");
    cy.get('[data-cy="order-items"]').should("be.visible");
    cy.get('[data-cy="order-total"]').should("be.visible");
    cy.get('[data-cy="customer-info"]').should("contain", "Test User");
    cy.get('[data-cy="shipping-address"]').should("contain", "123 Test St");
  });
});
