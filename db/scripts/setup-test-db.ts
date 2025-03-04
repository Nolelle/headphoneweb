/**
 * This script sets up a test database for Cypress E2E testing
 * It resets the database and seeds it with test data
 */
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

// Create a database connection
const pool = new Pool({
  user: process.env.DB_USER || "myuser",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "headphoneweb",
  password: process.env.DB_PASSWORD || "mypassword",
  port: parseInt(process.env.DB_PORT || "5432")
});

const setupTestDatabase = async () => {
  console.log("Setting up test database for Cypress...");

  try {
    // Read SQL scripts
    const createTablesSQL = fs.readFileSync(
      path.join(__dirname, "../db/scripts/create_tables.sql"),
      "utf8"
    );

    const seedDBSQL = fs.readFileSync(
      path.join(__dirname, "../db/scripts/seed_db.sql"),
      "utf8"
    );

    // Execute the scripts
    await pool.query(createTablesSQL);
    console.log("Tables created successfully");

    await pool.query(seedDBSQL);
    console.log("Database seeded successfully");

    // Add a specific test message that our Cypress tests will look for
    await pool.query(`
      INSERT INTO contact_message (name, email, message, message_date, status)
      VALUES (
        'Cypress Test User',
        'cypress@example.com',
        'This is a test message created specifically for Cypress E2E testing. Please respond to this message.',
        CURRENT_TIMESTAMP,
        'UNREAD'
      )
    `);
    console.log("Added Cypress test message");

    console.log("Test database setup complete!");
  } catch (error) {
    console.error("Error setting up test database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run the setup
setupTestDatabase();
