import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents() {
      // implement node event listeners here when needed
    },
    // Increase timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    // Customize the viewport for testing
    viewportWidth: 1280,
    viewportHeight: 720,
    // Fail tests if console logs errors
    experimentalRunAllSpecs: true
  },
  // Add env variables that might be needed for testing
  env: {
    adminUsername: "admin",
    adminPassword: "admin123",
    sitePassword: "mypassword" // Add site password from .env.local
  }
});
