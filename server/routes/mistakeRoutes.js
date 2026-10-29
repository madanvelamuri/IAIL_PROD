
const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const supabase = require("../config/supabase");

// =======================
// MULTER CONFIG
// MEMORY STORAGE FOR SUPABASE
// =======================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// =======================
// CREATE MISTAKE
// =======================
router.post(
  "/",
  authMiddleware,
  upload.single("screenshot"),
  async (req, res) => {
    let {
      claim_id,
      employee_name,
      mistake_type,
      description,
      condition_status,
      is_verification,
    } = req.body;

    // Normalize input
    claim_id = String(claim_id || "").trim();
    employee_name = String(employee_name || "").trim();
    mistake_type = String(mistake_type || "").trim();
    description = String(description || "").trim();
    condition_status = String(condition_status || "").trim();

    // =======================
    // VALIDATE CLAIM ID
    // =======================
    if (claim_id.includes("E+")) {
      return res.status(400).json({
        message:
          "Invalid Claim ID format (scientific notation detected). Please fix the Excel data.",
      });
    }

    if (!claim_id || !employee_name || !mistake_type || !description) {
      return res.status(400).json({
        message: "All required fields must be filled.",
      });
    }

    // Verification claims require a screenshot
    if (
      String(is_verification).toLowerCase() === "true" &&
      !req.file
    ) {
      return res.status(400).json({
        message: "A screenshot is mandatory for Verification Claims.",
      });
    }

    let screenshot_url = null;

    try {
      // =======================
      // UPLOAD SCREENSHOT TO SUPABASE
      // =======================
      if (req.file) {
        const sanitizedOriginalName = req.file.originalname.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        );

        const fileName = `${Date.now()}-${sanitizedOriginalName}`;
        const filePath = `public/${fileName}`;

        const { error } = await supabase.storage
          .from("screenshots")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error("SUPABASE UPLOAD ERROR:", error.message);

          return res.status(500).json({
            message: "Screenshot upload failed.",
          });
        }

        const supabaseBaseUrl = (
          process.env.SUPABASE_URL ||
          "https://rzfmcziqenovgvhxgbau.supabase.co"
        ).replace(/\/$/, "");

        screenshot_url =
          `${supabaseBaseUrl}/storage/v1/object/public/` +
          `screenshots/${filePath}`;
      }

      // =======================
      // INSERT INTO DATABASE
      // condition_status is stored separately.
      // Existing records are not modified.
      // =======================
      const result = await db.query(
        `INSERT INTO mistakes
          (
            claim_id,
            employee_name,
            mistake_type,
            description,
            screenshot_url,
            condition_status
          )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          claim_id,
          employee_name,
          mistake_type,
          description,
          screenshot_url,
          condition_status || null,
        ]
      );

      return res.status(201).json({
        message: "Mistake added successfully.",
        mistake: result.rows[0],
      });
    } catch (err) {
      console.error("INSERT ERROR:", err.message);

      return res.status(500).json({
        message: "Insert failed due to server error.",
      });
    }
  }
);

// =======================
// GET ALL MISTAKES
// =======================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM mistakes ORDER BY id DESC"
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("FETCH ERROR:", err.message);

    return res.status(500).json({
      message: "Fetch failed.",
    });
  }
});

// =======================
// DELETE MISTAKE
// =======================
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      message: "Invalid mistake ID.",
    });
  }

  try {
    const deleteResult = await db.query(
      "DELETE FROM mistakes WHERE id = $1 RETURNING id",
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({
        message: "Mistake record not found.",
      });
    }

    return res.json({
      message: "Deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err.message);

    return res.status(500).json({
      message: "Delete failed.",
    });
  }
});

module.exports = router;
