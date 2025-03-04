import { defineConfig } from "cypress";
import { Pool } from "pg";

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || "myuser",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "headphoneweb",
  password: process.env.DB_PASSWORD || "mypassword",
  port: parseInt(process.env.DB_PORT || "5432")
});

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // Implement database tasks
      on("task", {
        // Task to execute database queries
        async queryDatabase({ query, params = [] }) {
          try {
            const result = await pool.query(query, params);
            return result;
          } catch (error) {
            console.error("Database query error:", error);
            throw error;
          }
        },

        // Task to clear test data if needed
        async clearTestData({ table, condition, params = [] }) {
          try {
            if (!table || !condition) {
              throw new Error("Table and condition are required");
            }
            const query = `DELETE FROM ${table} WHERE ${condition}`;
            const result = await pool.query(query, params);
            return result;
          } catch (error) {
            console.error("Error clearing test data:", error);
            throw error;
          }
        }
      });
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
