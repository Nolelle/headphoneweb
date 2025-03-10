// cypress/e2e/auth/authentication-flow.cy.ts
describe("Authentication Flows", () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe("Site Password Protection", () => {
    it("should redirect to password page when accessing protected routes", () => {
      // Try to access home page directly
      cy.visit("/", { failOnStatusCode: false });

      // Should be redirected to enter-password page
      cy.url().should("include", "/enter-password");
      cy.get('input[type="password"]').should("be.visible");
      cy.contains("Enter Password").should("be.visible");
    });

    it("should accept correct site password and grant access", () => {
      cy.visit("/enter-password");

      // Enter correct password
      cy.get('input[type="password"]').type(Cypress.env("sitePassword"));
      cy.contains("button", "Enter Site").click();

      // Should redirect to home page
      cy.url().should("not.include", "/enter-password");

      // Should see home page content
      cy.contains("Elevate Your").should("be.visible");
    });

    it("should reject incorrect site password", () => {
      cy.visit("/enter-password");

      // Enter incorrect password
      cy.get('input[type="password"]').type("wrongpassword");
      cy.contains("button", "Enter Site").click();

      // Should remain on password page with error
      cy.url().should("include", "/enter-password");
      cy.contains("Invalid password").should("be.visible");
    });

    it("should maintain site password auth across page reloads", () => {
      // First authenticate
      cy.visit("/enter-password");
      cy.get('input[type="password"]').type(Cypress.env("sitePassword"));
      cy.contains("button", "Enter Site").click();

      // Reload the page
      cy.reload();

      // Should still be authenticated
      cy.contains("Elevate Your").should("be.visible");
      cy.url().should("not.include", "/enter-password");
    });
  });

  describe("Admin Authentication", () => {
    it("should require login for admin routes", () => {
      // Try to access admin dashboard directly
      cy.visit("/admin/dashboard", { failOnStatusCode: false });

      // Handle site password
      cy.enterSitePassword(Cypress.env("sitePassword"));

      // Should redirect to login
      cy.url().should("include", "/admin/login");
      cy.get("#username").should("be.visible");
    });

    it("should authenticate admin with valid credentials", () => {
      // Navigate to admin login
      cy.visit("/admin/login");
      cy.enterSitePassword(Cypress.env("sitePassword"));

      // Enter admin credentials
      cy.get("#username").type("admin");
      cy.get("#password").type("admin123");
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard
      cy.url().should("include", "/admin/dashboard");
      cy.contains("Admin Dashboard").should("be.visible");
    });

    it("should reject invalid admin credentials", () => {
      // Navigate to admin login
      cy.visit("/admin/login");
      cy.enterSitePassword(Cypress.env("sitePassword"));

      // Enter invalid credentials
      cy.get("#username").type("admin");
      cy.get("#password").type("wrongpassword");
      cy.get('button[type="submit"]').click();

      // Should show error and stay on login page
      cy.contains("Invalid credentials").should("be.visible");
      cy.url().should("include", "/admin/login");
    });

    it("should allow admin logout", () => {
      // First login
      cy.adminLogin("admin", "admin123");

      // Find and click logout
      cy.contains("Logout").click();

      // Should redirect to login
      cy.url().should("include", "/admin/login");

      // Try to access admin dashboard again
      cy.visit("/admin/dashboard", { failOnStatusCode: false });
      cy.enterSitePassword(Cypress.env("sitePassword"));

      // Should require login again
      cy.url().should("include", "/admin/login");
    });

    it("should maintain admin session across page navigation", () => {
      // Login
      cy.adminLogin("admin", "admin123");

      // Reload page
      cy.reload();

      // Should still be logged in
      cy.url().should("include", "/admin/dashboard");
      cy.contains("Admin Dashboard").should("be.visible");
    });
  });
});
