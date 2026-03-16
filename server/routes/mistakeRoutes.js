const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const supabase = require("../config/supabase");

// =======================
// MULTER CONFIG (MEMORY STORAGE FOR SUPABASE)
// =======================

const upload = multer({
  storage: multer.memoryStorage(),
});

// =======================
// CREATE MISTAKE
// =======================

router.post(
  "/",
  authMiddleware,
  upload.single("screenshot"),
  async (req, res) => {

    const { claim_id, employee_name, mistake_type, description } = req.body;

    if (!claim_id || !employee_name || !mistake_type || !description) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    let screenshot_url = null;

    try {

      // =======================
      // UPLOAD SCREENSHOT TO SUPABASE
      // =======================

      if (req.file) {

        const fileName = `${Date.now()}-${req.file.originalname}`;

        const { error } = await supabase.storage
          .from("screenshots")
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (error) {
          console.error("SUPABASE UPLOAD ERROR:", error);
          return res.status(500).json({
            message: "Screenshot upload failed",
          });
        }

        screenshot_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/screenshots/${fileName}`;
      }

      // =======================
      // INSERT INTO DATABASE
      // =======================

      await db.query(
        `INSERT INTO mistakes 
         (claim_id, employee_name, mistake_type, description, screenshot_url) 
         VALUES ($1, $2, $3, $4, $5)`,
        [claim_id, employee_name, mistake_type, description, screenshot_url]
      );

      return res.status(201).json({
        message: "Mistake added successfully",
      });

    } catch (err) {

      console.error("INSERT ERROR:", err.message);

      return res.status(500).json({
        message: "Insert failed",
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

    console.error("FETCH ERROR:", err);

    return res.status(500).json({
      message: "Fetch failed",
    });

  }

});

// =======================
// DELETE MISTAKE
// =======================

router.delete("/:id", authMiddleware, async (req, res) => {

  const { id } = req.params;

  try {

    await db.query(
      "DELETE FROM mistakes WHERE id = $1",
      [id]
    );

    return res.json({
      message: "Deleted successfully",
    });

  } catch (err) {

    console.error("DELETE ERROR:", err);

    return res.status(500).json({
      message: "Delete failed",
    });

  }

});

module.exports = router;