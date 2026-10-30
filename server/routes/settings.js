const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================

router.get("/profile", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, email, mobile, role
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    return res.json({
      user: result.rows[0],
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Unable to load profile.",
    });
  }
});

// ==========================================
// UPDATE CURRENT USER PROFILE
// ==========================================

router.put("/profile", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { name, email, mobile } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMobile = mobile?.trim() || null;

    // Check whether email belongs to another user
    const existingEmail = await pool.query(
      `SELECT id
       FROM public.users
       WHERE LOWER(email) = LOWER($1)
       AND id != $2`,
      [cleanEmail, userId]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        message: "This email address is already registered.",
      });
    }

    // Check whether mobile belongs to another user
    if (cleanMobile) {
      const existingMobile = await pool.query(
        `SELECT id
         FROM public.users
         WHERE mobile = $1
         AND id != $2`,
        [cleanMobile, userId]
      );

      if (existingMobile.rows.length > 0) {
        return res.status(409).json({
          message: "This mobile number is already registered.",
        });
      }
    }

    // Update only the authenticated user
    const result = await pool.query(
      `UPDATE public.users
       SET name = $1,
           email = $2,
           mobile = $3
       WHERE id = $4
       RETURNING id, name, email, mobile, role`,
      [cleanName, cleanEmail, cleanMobile, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: result.rows[0],
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email or mobile number already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
});

module.exports = router;