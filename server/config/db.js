const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Configure PostgreSQL pool with secure timeouts and SSL support
const pool = new Pool({
  connectionString,
  ssl: isProduction || connectionString.includes("render.com") || connectionString.includes("supabase.co") || connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test PostgreSQL connection safely.
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    console.log("Connected to PostgreSQL database successfully.");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// CREATE USERS TABLE
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
`;

// CREATE MISTAKES TABLE
const createMistakesTable = `
CREATE TABLE IF NOT EXISTS mistakes (
  id SERIAL PRIMARY KEY,
  claim_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  mistake_type TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Initialize application tables.
const initializeDatabase = async () => {
  try {
    await pool.query(createUsersTable);
    await pool.query(createMistakesTable);
    console.log("Database tables verified and ready.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    throw error;
  }
};

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

// Execute startup checks.
testConnection();
initializeDatabase().catch(() => {
  console.error("Database initialization requires attention.");
});

module.exports = pool;