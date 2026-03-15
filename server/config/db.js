// config/db.js
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.message);
  } else {
    console.log("Connected to PostgreSQL database.");
  }
  release();
});

// ============================
// CREATE USERS TABLE
// ============================

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
`;

// ============================
// CREATE MISTAKES TABLE
// ============================

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

const initializeDatabase = async () => {
  try {
    await pool.query(createUsersTable);
    await pool.query(createMistakesTable);
    console.log("Tables created or already exist.");
  } catch (error) {
    console.error("Error creating tables:", error.message);
  }
};

initializeDatabase();

module.exports = pool;