// cypress/e2e/products.cy.ts

// Define an interface for the product data
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

describe("Product Display", () => {
  beforeEach(() => {
    // Load fixture data
    cy.fixture("products.json").then((products: Product[]) => {
      cy.intercept("GET", "/api/products*", {
        statusCode: 200,
        body: products
      }).as("getProducts");
    });

    cy.visit("/products");

    // Handle site password if needed
    cy.enterSitePassword(Cypress.env("sitePassword"));

    cy.wait("@getProducts");
  });

  it("should display product information accurately", () => {
    // Test case #29: Product Information Display Accuracy
    cy.get('[data-cy="product-card"]')
      .first()
      .within(() => {
        cy.get('[data-cy="product-name"]').should("be.visible");
        cy.get('[data-cy="product-price"]').should("be.visible");
        cy.get('[data-cy="product-image"]').should("be.visible");
      });
  });

  it("should navigate to product detail page", () => {
    cy.get('[data-cy="product-card"]').first().click();
    cy.url().should("include", "/products/");
    cy.get('[data-cy="product-detail"]').should("be.visible");
  });

  it("should display product details accurately", () => {
    cy.get('[data-cy="product-card"]').first().click();
    cy.get('[data-cy="product-title"]').should("be.visible");
    cy.get('[data-cy="product-description"]').should("be.visible");
    cy.get('[data-cy="product-price"]').should("be.visible");
    cy.get('[data-cy="add-to-cart"]').should("be.visible");
  });

  it("should add product to cart", () => {
    cy.get('[data-cy="product-card"]').first().click();
    cy.get('[data-cy="add-to-cart"]').click();
    cy.get('[data-cy="cart-count"]').should("contain", "1");
  });
});
