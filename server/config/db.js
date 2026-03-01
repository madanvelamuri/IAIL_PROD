// config/db.js
console.log("DATABASE_URL:", process.env.DATABASE_URL);
const { Pool } = require("pg");

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
  screenshot TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Run table creation
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