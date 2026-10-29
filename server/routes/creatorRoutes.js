
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// All Creator API endpoints require a valid login.
router.use(auth);

// Restrict administrative operations to configured administrator emails.
function requireCreator(req, res, next) {
  const allowedEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const userEmail = String(req.user?.email || "")
    .trim()
    .toLowerCase();

  if (allowedEmails.length === 0) {
    return res.status(503).json({
      message: "ADMIN_EMAILS is not configured.",
    });
  }

  if (!userEmail || !allowedEmails.includes(userEmail)) {
    return res.status(403).json({
      message: "Creator access denied.",
    });
  }

  next();
}

// ======================================================
// MISTAKE TYPE MANAGEMENT
// ======================================================

// GET mistake types — authenticated users.
router.get("/mistake-types", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, description, conditions, created_at
      FROM creator_mistake_types
      ORDER BY name ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Load mistake types:", error.message);

    return res.status(500).json({
      message: "Unable to load mistake types.",
    });
  }
});

// ADD mistake type — admin only.
router.post("/mistake-types", requireCreator, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const description = String(req.body?.description || "").trim();

  const conditions = Array.isArray(req.body?.conditions)
    ? req.body.conditions
        .map((value) => String(value).trim())
        .filter(Boolean)
    : [];

  if (!name || name.length > 150) {
    return res.status(400).json({
      message: "Enter a valid mistake type name.",
    });
  }

  if (description.length > 2000) {
    return res.status(400).json({
      message: "Description is too long.",
    });
  }

  if (
    conditions.length > 30 ||
    conditions.some((value) => value.length > 200)
  ) {
    return res.status(400).json({
      message: "Too many or overly long conditions.",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO creator_mistake_types
        (name, description, conditions)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, conditions, created_at`,
      [name, description, conditions]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This mistake type already exists.",
      });
    }

    console.error("Create mistake type:", error.message);

    return res.status(500).json({
      message: "Unable to create mistake type.",
    });
  }
});

// ======================================================
// EMPLOYEE MANAGEMENT
// ======================================================

// GET employees — authenticated users.
router.get("/employees", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, created_at
      FROM creator_employees
      ORDER BY name ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Load employees:", error.message);

    return res.status(500).json({
      message: "Unable to load employees.",
    });
  }
});

// ADD employee — admin only.
router.post("/employees", requireCreator, async (req, res) => {
  const name = String(req.body?.name || "").trim();

  if (!name || name.length > 120) {
    return res.status(400).json({
      message: "Enter a valid employee name.",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO creator_employees (name)
       VALUES ($1)
       RETURNING id, name, created_at`,
      [name]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Employee already exists.",
      });
    }

    console.error("Create employee:", error.message);

    return res.status(500).json({
      message: "Unable to add employee.",
    });
  }
});

// ======================================================
// USER ACCOUNT MANAGEMENT
// ======================================================

// GET all user accounts — admin only.
// Never return password hashes.
router.get("/users", requireCreator, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, role, created_at
      FROM public.users
      ORDER BY created_at DESC NULLS LAST, id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Load user accounts:", {
      message: error.message,
      code: error.code,
    });

    return res.status(500).json({
      message: "Unable to load user accounts.",
    });
  }
});

// CREATE account — admin only.
// Existing database schema uses "password", not "password_hash".
router.post("/users", requireCreator, async (req, res) => {
  const name = String(req.body?.name || "").trim();

  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  const password =
    typeof req.body?.password === "string"
      ? req.body.password
      : "";

  const role = String(req.body?.role || "user")
    .trim()
    .toLowerCase();

  if (!name || name.length > 100) {
    return res.status(400).json({
      message: "Enter a valid name (maximum 100 characters).",
    });
  }

  if (
    !email ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({
      message: "Enter a valid email address.",
    });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      message: "Password must contain between 8 and 72 characters.",
    });
  }

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({
      message: "Role must be either user or admin.",
    });
  }

  try {
    // Check for an existing email.
    const existingUser = await db.query(
      `SELECT id
       FROM public.users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(password, 12);

    // Match the existing public.users schema.
    const result = await db.query(
      `INSERT INTO public.users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );

    return res.status(201).json({
      message: "User account created successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Keep detailed diagnostics in server logs only.
    console.error("Create user account failed:", {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
    });

    return res.status(500).json({
      message: "Unable to create user account.",
    });
  }
});

module.exports = router;
