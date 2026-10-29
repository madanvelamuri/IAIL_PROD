
const express = require("express");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// All Creator API endpoints require a valid login.
router.use(auth);

// Restrict write operations to configured administrators.
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

// GET MISTAKE TYPES — available to authenticated users
router.get("/mistake-types", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, description, conditions, created_at
       FROM creator_mistake_types
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Load mistake types:", error.message);
    res.status(500).json({
      message: "Unable to load mistake types.",
    });
  }
});

// ADD MISTAKE TYPE — admin only
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This mistake type already exists.",
      });
    }

    console.error("Create mistake type:", error.message);
    res.status(500).json({
      message: "Unable to create mistake type.",
    });
  }
});

// GET EMPLOYEES — available to authenticated users
router.get("/employees", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, created_at
       FROM creator_employees
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Load employees:", error.message);
    res.status(500).json({
      message: "Unable to load employees.",
    });
  }
});

// ADD EMPLOYEE — admin only
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Employee already exists.",
      });
    }

    console.error("Create employee:", error.message);
    res.status(500).json({
      message: "Unable to add employee.",
    });
  }
});

module.exports = router;
