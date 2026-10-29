
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// All Creator API endpoints require a valid login.
router.use(auth);

// ======================================================
// ADMIN AUTHORIZATION — DATABASE ROLE BASED
// ======================================================

async function requireCreator(req, res, next) {
  const userId = Number(req.user?.id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({
      message: "Invalid user ID. Please log in again.",
      code: "USER_ID_MISSING",
    });
  }

  try {
    // Always check the CURRENT role in the database.
    // Do not trust an admin role stored in the JWT.
    const result = await db.query(
      `SELECT id, role
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User account not found. Please log in again.",
        code: "USER_NOT_FOUND",
      });
    }

    const user = result.rows[0];

    if (String(user.role || "").trim().toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Creator access denied. Admin role required.",
        code: "ADMIN_REQUIRED",
      });
    }

    req.creator = user;
    return next();
  } catch (error) {
    console.error("Creator authorization error:", error.message);

    return res.status(500).json({
      message: "Unable to verify administrator permissions.",
      code: "ROLE_CHECK_FAILED",
    });
  }
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
// PENDING ACCESS REQUESTS
// ======================================================

// GET pending requests — admin only.
// Never return password_hash to the browser.
router.get("/access-requests", requireCreator, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        email,
        requested_role,
        status,
        created_at
      FROM public.access_requests
      WHERE status = 'pending'
      ORDER BY created_at ASC, id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Load pending access requests:", {
      message: error.message,
      code: error.code,
    });

    return res.status(500).json({
      message: "Unable to load pending access requests.",
    });
  }
});

// ======================================================
// CREATE USER FROM ACCESS REQUEST
// ======================================================

// POST /api/creator/access-requests/:id/create-account
router.post(
  "/access-requests/:id/create-account",
  requireCreator,
  async (req, res) => {
    const requestId = String(req.params.id || "").trim();

    const role = String(req.body?.role || "")
      .trim()
      .toLowerCase();

    if (!/^\d+$/.test(requestId) || requestId === "0") {
      return res.status(400).json({
        message: "Invalid access request ID.",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be either user or admin.",
      });
    }

    const reviewerEmail = String(req.user?.email || "")
      .trim()
      .toLowerCase();

    let client;
    let transactionStarted = false;

    try {
      client = await db.connect();

      await client.query("BEGIN");
      transactionStarted = true;

      const requestResult = await client.query(
        `SELECT
           id,
           name,
           email,
           requested_role,
           password_hash,
           status
         FROM public.access_requests
         WHERE id = $1
         FOR UPDATE`,
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(404).json({
          message: "Access request not found.",
        });
      }

      const accessRequest = requestResult.rows[0];

      if (
        String(accessRequest.status || "").toLowerCase() !== "pending"
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(409).json({
          message: "This access request has already been processed.",
        });
      }

      const name = String(accessRequest.name || "").trim();

      const email = String(accessRequest.email || "")
        .trim()
        .toLowerCase();

      const passwordHash = accessRequest.password_hash;

      if (
        !name ||
        name.length > 100 ||
        !email ||
        email.length > 255 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          message: "The access request contains invalid account details.",
        });
      }

      // Only accept an existing bcrypt password hash.
      if (
        typeof passwordHash !== "string" ||
        !/^\$2[aby]\$/.test(passwordHash)
      ) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(409).json({
          message:
            "This request has no valid stored password hash. Ask the user to submit a new access request.",
        });
      }

      const existingUser = await client.query(
        `SELECT id
         FROM public.users
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(409).json({
          message: "An account with this email already exists.",
        });
      }

      // The password is already hashed. Do not hash it again.
      const createdUser = await client.query(
        `INSERT INTO public.users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
        [name, email, passwordHash, role]
      );

      const updatedRequest = await client.query(
        `UPDATE public.access_requests
         SET status = 'approved',
             reviewed_at = CURRENT_TIMESTAMP,
             reviewed_by = $2
         WHERE id = $1
           AND status = 'pending'
         RETURNING id, status, reviewed_at, reviewed_by`,
        [requestId, reviewerEmail]
      );

      if (updatedRequest.rows.length !== 1) {
        throw new Error("Could not mark the access request as approved.");
      }

      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(201).json({
        message: "Account created and access request approved.",
        user: createdUser.rows[0],
        request: updatedRequest.rows[0],
      });
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Access request rollback failed:",
            rollbackError.message
          );
        }
      }

      if (error.code === "23505") {
        return res.status(409).json({
          message: "An account with this email already exists.",
        });
      }

      console.error("Create account from access request failed:", {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        table: error.table,
      });

      return res.status(500).json({
        message: "Unable to create an account from this access request.",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// ======================================================
// USER ACCOUNT MANAGEMENT
// ======================================================

// GET all users — admin only.
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

// CREATE user directly — admin only.
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

    const passwordHash = await bcrypt.hash(password, 12);

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

    console.error("Create user account failed:", {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
    });

    return res.status(500).json({
      message: "Unable to create user account.",
    });
  }
});

module.exports = router;
