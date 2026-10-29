
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// ======================================================
// POSTGRESQL CONNECTION POOL
// ======================================================

const useSSL =
  isProduction ||
  /render\.com|supabase\.co|neon\.tech/i.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// ======================================================
// USERS TABLE
// ======================================================

const createUsersTable = `
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

// ======================================================
// MISTAKES TABLE
// ======================================================

const createMistakesTable = `
CREATE TABLE IF NOT EXISTS public.mistakes (
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

// ======================================================
// DATABASE INITIALIZATION
// ======================================================

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(createUsersTable);

    // Add columns for existing users tables without replacing data.
    await client.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
    `);

    await client.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ
      NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await client.query(createMistakesTable);

    // Existing users remain users by default.
    // Promote administrators explicitly after verifying their identities.

    await client.query("COMMIT");

    console.log("Database tables verified and ready.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database initialization failed:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// CONNECTION HEALTH CHECK
// ======================================================

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function startDatabase() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL database successfully.");

    await initializeDatabase();
  } catch (error) {
    console.error("Database startup check failed:", error.message);
    // Keep the process behavior controlled by the application entry point.
    // The app should not serve requests until initialization has succeeded.
    process.exitCode = 1;
  }
}

startDatabase();

module.exports = pool;
