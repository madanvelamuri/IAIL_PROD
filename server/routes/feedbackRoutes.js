
const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const auth = require("../middleware/auth");

// ==========================================
// GET ALL FEEDBACK
// ==========================================

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        f.id,
        f.user_id,
        f.employee_name,
        f.category,
        f.message,
        f.rating,
        f.status,
        f.created_at
      FROM public.feedback f
      ORDER BY f.created_at DESC
    `);

    return res.json({
      success: true,
      feedback: result.rows,
    });
  } catch (error) {
    console.error("GET FEEDBACK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load feedback.",
    });
  }
});

// ==========================================
// SUBMIT FEEDBACK
// ==========================================

router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, message, rating } = req.body;

    const allowedCategories = [
      "Suggestion",
      "General",
      "Bug Report",
      "Feature Request",
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Please select a valid feedback category.",
      });
    }

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 3000
    ) {
      return res.status(400).json({
        message: "Feedback must contain 1–3000 characters.",
      });
    }

    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const userResult = await pool.query(
      `SELECT name FROM public.users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const employeeName = userResult.rows[0].name;

    const result = await pool.query(
      `INSERT INTO public.feedback
        (user_id, employee_name, category, message, rating)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        employeeName,
        category,
        message.trim(),
        Number(rating),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error("SUBMIT FEEDBACK ERROR:", error);

    return res.status(500).json({
      message: "Unable to submit feedback.",
    });
  }
});

// ==========================================
// UPDATE FEEDBACK STATUS - ADMIN ONLY
// ==========================================

router.patch("/:id/status", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const feedbackId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
    ];

    if (!Number.isInteger(feedbackId) || feedbackId < 1) {
      return res.status(400).json({
        message: "Invalid feedback ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid feedback status.",
      });
    }

    // Verify administrator role from the database.
    const adminResult = await pool.query(
      `SELECT role FROM public.users WHERE id = $1`,
      [userId]
    );

    if (
      adminResult.rows.length === 0 ||
      adminResult.rows[0].role !== "admin"
    ) {
      return res.status(403).json({
        message: "Administrator access required.",
      });
    }

    const result = await pool.query(
      `UPDATE public.feedback
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Feedback not found.",
      });
    }

    return res.json({
      success: true,
      message: "Feedback status updated successfully.",
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE FEEDBACK STATUS ERROR:", error);

    return res.status(500).json({
      message: "Unable to update feedback status.",
    });
  }
});

module.exports = router;
