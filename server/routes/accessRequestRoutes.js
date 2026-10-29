
const express = require("express");
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

  // Validate requested role
  if (!["user", "admin"].includes(requestedRole)) {
    return res.status(400).json({
      message: "Invalid requested role.",
    });
  }

  try {
    // Insert the access request into PostgreSQL/Supabase.
    const result = await db.query(
      `INSERT INTO public.access_requests
        (name, email, requested_role)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         name,
         email,
         requested_role,
         status,
         created_at`,
      [name, email, requestedRole]
    );

    return res.status(201).json({
      message: "Access request submitted successfully.",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Submit access request failed:", {
      message: error.message,
      code: error.code,
    });

    // Handle database unique-constraint violations.
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An access request with these details already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to submit your request.",
    });
  }
});

module.exports = router;
