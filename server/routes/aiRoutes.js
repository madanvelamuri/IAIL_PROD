
const express = require("express");
const router = express.Router();

// Import AI controller
const aiController = require("../controllers/aiController");

// Generate AI description based on selected mistake type
router.post(
  "/generate-description",
  aiController.generateDescription
);

// Export router
module.exports = router;