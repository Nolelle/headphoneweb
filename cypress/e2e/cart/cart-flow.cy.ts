// cypress/e2e/cart/cart-flow.cy.ts
describe("Shopping Cart Flow", () => {
  beforeEach(() => {
    // Start fresh
    cy.clearLocalStorage();
    cy.clearCookies();

    // Visit homepage
    cy.visit("/");
    cy.enterSitePassword(Cypress.env("sitePassword"));

    // Navigate to product section
    cy.get("#headphone").scrollIntoView();
  });

  it("should add product to cart and display correct info", () => {
    // Add product to cart
    cy.contains("button", "Add to Cart").click();

    // Verify success message
    cy.contains("Added to cart").should("be.visible");

    // Open cart dropdown in header
    cy.get("header").find('button[aria-label="Cart"]').click();

    // Click View Cart
    cy.contains("View Cart").click();

    // Verify cart page loaded with correct product
    cy.url().should("include", "/cart");
    cy.contains("Bone+ Headphone").should("be.visible");
    cy.contains("$199.99").should("be.visible");

    // Verify quantity is 1
    cy.contains("1").should("be.visible");
  });

  it("should update cart quantity and recalculate totals", () => {
    // Add product to cart
    cy.contains("button", "Add to Cart").click();

    // Go to cart page
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();

    // Find and click quantity increase button using the actual Plus icon implementation
    cy.get("svg.lucide-plus").parent("button").click({ force: true });

    // Wait for update to complete
    cy.wait(1000);

    // Verify quantity is now 2
    cy.contains("2").should("be.visible");

    // Verify total price updated (2 x $199.99 = $399.98)
    cy.contains("$399.98").should("be.visible");
  });

  it("should remove item from cart", () => {
    // Add product to cart
    cy.contains("button", "Add to Cart").click();

    // Go to cart page
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();

    // Find and click remove button - Using the lucide Trash2 icon implementation
    cy.get("svg.lucide-trash2").parent("button").click({ force: true });

    // Verify cart is empty
    cy.contains("Your cart is empty").should("be.visible");
  });

  it("should persist cart between page reloads", () => {
    // Add product to cart
    cy.contains("button", "Add to Cart").click();

    // Reload the page
    cy.reload();
    cy.enterSitePassword(Cypress.env("sitePassword"));

    // Open cart dropdown
    cy.get("header").find('button[aria-label="Cart"]').click();

    // Verify product still in cart
    cy.contains("View Cart").should("be.visible");

    // Go to cart page to verify completely
    cy.contains("View Cart").click();
    cy.contains("Bone+ Headphone").should("be.visible");
  });

  it("should enforce minimum quantity of 1", () => {
    // Add product to cart
    cy.contains("button", "Add to Cart").click();

    // Go to cart page
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();

    // Try to decrease quantity below 1 using the Minus icon
    cy.get("svg.lucide-minus").parent("button").click({ force: true });

    // Try to click again, which should be disabled
    cy.get("svg.lucide-minus").parent("button").should("be.disabled");

    // Verify quantity is still 1 (can't go lower)
    cy.contains("1").should("be.visible");
  });

  it("should have working checkout button", () => {
    // Add product to cart
    cy.contains("button", "Add to Cart").click();

    // Go to cart page
    cy.get("header").find('button[aria-label="Cart"]').click();
    cy.contains("View Cart").click();

    // Click Proceed to Checkout
    cy.contains("button", "Proceed to Checkout").click({ force: true });

    // Verify redirect to checkout page
    cy.url().should("include", "/checkout");

    // Verify checkout form elements are present based on CheckoutForm.tsx
    cy.get("#name").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#address").should("be.visible");
  });
});
