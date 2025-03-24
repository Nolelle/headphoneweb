// db.ts
import pg from "pg";

let pool;

// Check if connection string is provided (common for production environments)
if (process.env.DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
  });
} else {
  // Fall back to individual parameters (development environment)
  pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432", 10)
  });
}

export default pool;
