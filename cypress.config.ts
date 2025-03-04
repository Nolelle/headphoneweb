import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Customize the viewport for testing
    viewportWidth: 1280,
    viewportHeight: 720,
    // Fail faster if commands time out
    defaultCommandTimeout: 5000,
    // Fail tests if console logs errors
    experimentalRunAllSpecs: true
  },
  // Add env variables that might be needed for testing
  env: {
    // Add environment-specific variables here
    adminUsername: "admin",
    adminPassword: "admin123"
  }
});
