
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const router = express.Router();

// ==========================================
// SUBMIT USER ACCESS REQUEST
// POST /api/access-requests
// ==========================================
router.post("/", async (req, res) => {
  const name = String(req.body?.name || "").trim();

  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  const password =
    typeof req.body?.password === "string"
      ? req.body.password
      : "";

  const requestedRole = String(
    req.body?.requestedRole || "user"
  )
    .trim()
    .toLowerCase();

  // Validate name
  if (!name || name.length > 100) {
    return res.status(400).json({
      message: "Enter a valid name.",
    });
  }

  // Validate email
  if (
    !email ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({
      message: "Enter a valid email address.",
    });
  }

  // Validate password
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      message: "Password must contain between 8 and 72 characters.",
    });
  }

  // Validate requested role
  if (!["user", "admin"].includes(requestedRole)) {
    return res.status(400).json({
      message: "Invalid requested role.",
    });
  }

  try {
    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO public.access_requests
        (name, email, requested_role, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         name,
         email,
         requested_role,
         status,
         created_at`,
      [name, email, requestedRole, passwordHash]
    );

    // Never return the password or its hash.
    return res.status(201).json({
      message: "Access request submitted successfully.",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Submit access request failed:", {
      message: error.message,
      code: error.code,
    });

    if (error.code === "23505") {
      return res.status(409).json({
        message: "An access request with these details already exists.",
      });
    }

    // PostgreSQL undefined-column error.
    if (error.code === "42703") {
      return res.status(500).json({
        message: "Access request database schema needs updating.",
      });
    }

    return res.status(500).json({
      message: "Unable to submit your request.",
    });
  }
});

module.exports = router;
