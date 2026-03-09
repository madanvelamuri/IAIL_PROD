const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

//  ENSURE UPLOADS FOLDER EXISTS //

const uploadPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// MULTER CONFIG // 

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

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

    const screenshot = req.file ? req.file.filename : null;

    try {

      await db.query(
        `INSERT INTO mistakes 
         (claim_id, employee_name, mistake_type, description, screenshot) 
         VALUES ($1, $2, $3, $4, $5)`,
        [claim_id, employee_name, mistake_type, description, screenshot]
      );

      return res.status(201).json({
        message: "Mistake added successfully",
      });

    } catch (err) {
      console.error("INSERT ERROR:", err);
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

    // Add screenshot_url field for frontend preview
    const data = result.rows.map((row) => ({
      ...row,
      screenshot_url: row.screenshot
        ? `/uploads/${row.screenshot}`
        : null
    }));

    return res.json(data);

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
