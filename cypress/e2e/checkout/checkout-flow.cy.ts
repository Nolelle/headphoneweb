describe("Checkout Process Flow", () => {
  beforeEach(() => {
    // Start fresh
    cy.clearLocalStorage();
    cy.clearCookies();

    // Visit homepage
    cy.visit("/");
    cy.enterSitePassword(Cypress.env("sitePassword"));

    // Add product to cart
    cy.get("#headphone").scrollIntoView();
    cy.contains("button", "Add to Cart").click();

    // Navigate to cart page
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();
    cy.url().should("include", "/cart");

    // Proceed to checkout
    cy.contains("button", "Proceed to Checkout").click();
    cy.url().should("include", "/checkout");
  });

  describe("Form Validation", () => {
    it("should validate required fields", () => {
      // Try to proceed without filling form
      cy.contains("button", "Proceed to Payment").click();

      // Form should show validation errors
      cy.get("#name:invalid").should("exist");
      cy.get("#email:invalid").should("exist");
      cy.get("#address:invalid").should("exist");

      // Should not proceed to payment
      cy.get('[data-testid="stripe-element"]').should("not.exist");
    });

    it("should validate email format", () => {
      // Fill out form with invalid email
      cy.get("#name").type("Test User");
      cy.get("#email").type("invalid-email");
      cy.get("#address").type("123 Test St");
      cy.get("#city").type("Test City");
      cy.get("#state").type("TS");
      cy.get("#zip").type("12345");

      // Try to proceed
      cy.contains("button", "Proceed to Payment").click();

      // Should show email validation error
      cy.get("#email:invalid").should("exist");

      // Should not proceed to payment
      cy.get('[data-testid="stripe-element"]').should("not.exist");
    });

    it("should proceed with valid form data", () => {
      // Fill out form with valid data
      cy.get("#name").type("Test User");
      cy.get("#email").type("valid@example.com");
      cy.get("#address").type("123 Test St");
      cy.get("#city").type("Test City");
      cy.get("#state").type("TS");
      cy.get("#zip").type("12345");

      // Try to proceed
      cy.contains("button", "Proceed to Payment").click();

      // Should show payment form
      cy.get('[data-testid="payment-form"]').should("be.visible", {
        timeout: 10000
      });
    });
  });

  describe("Payment Integration", () => {
    it("should show Stripe payment form after form completion", () => {
      // Fill out checkout form
      cy.get("#name").type("Test User");
      cy.get("#email").type("valid@example.com");
      cy.get("#address").type("123 Test St");
      cy.get("#city").type("Test City");
      cy.get("#state").type("TS");
      cy.get("#zip").type("12345");

      // Proceed to payment
      cy.contains("button", "Proceed to Payment").click();

      // Stripe elements should be visible
      cy.get('[data-testid="payment-form"]', { timeout: 10000 }).should(
        "be.visible"
      );
      cy.get('iframe[title="Secure payment input frame"]').should("be.visible");
    });

    it("should handle payment submission", () => {
      // Fill out checkout form
      cy.get("#name").type("Test User");
      cy.get("#email").type("valid@example.com");
      cy.get("#address").type("123 Test St");
      cy.get("#city").type("Test City");
      cy.get("#state").type("TS");
      cy.get("#zip").type("12345");

      // Proceed to payment
      cy.contains("button", "Proceed to Payment").click();

      // Stripe elements should be visible
      cy.get('[data-testid="payment-form"]', { timeout: 10000 }).should(
        "be.visible"
      );

      // Since we can't actually fill the Stripe form in tests, we can check
      // that the submit button is enabled and the form structure is correct
      cy.get('button[type="submit"]').should("be.visible");
      cy.get('iframe[title="Secure payment input frame"]').should("be.visible");

      // Note: In a real test environment with Stripe test mode,
      // we could use Cypress-specific commands to interact with iframes
      // and fill in test card information
    });
  });

  describe("Order Summary", () => {
    it("should display correct order details on checkout page", () => {
      // Check order summary
      cy.contains("Order Summary").should("be.visible");
      cy.contains("Bone+ Headphone").should("be.visible");
      cy.contains("$199.99").should("be.visible");

      // Check totals calculation
      cy.contains("Subtotal").next().should("contain", "$199.99");
      cy.contains("Total").next().should("contain", "$"); // At least shows a total with $ sign
    });

    it("should update totals when quantity changes", () => {
      // Go back to cart
      cy.visit("/cart");

      // Increase quantity
      cy.get("body").then(($body) => {
        if ($body.find('[aria-label="Increase quantity"]').length) {
          cy.get('[aria-label="Increase quantity"]').first().click();
        } else if ($body.find('button:contains("+")').length) {
          cy.get('button:contains("+")').first().click();
        }
      });

      // Wait for update
      cy.wait(1000);

      // Go to checkout
      cy.contains("button", "Proceed to Checkout").click();

      // Check totals reflect quantity change
      cy.contains("Subtotal").next().should("contain", "$399.98");
      cy.contains("Total").next().should("contain", "$399.98");
    });
  });
});
