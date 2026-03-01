require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");

const app = express();

// ============================
// MIDDLEWARE
// ============================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================
// ROUTES
// ============================

app.use("/api/auth", authRoutes);
app.use("/api/mistakes", mistakeRoutes);

// ============================
// HEALTH CHECK ROUTE
// ============================

app.get("/", (req, res) => {
  res.json({ message: "IAIL Server Running Successfully 🚀" });
});

// ============================
// GLOBAL ERROR HANDLER
// ============================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// ============================
// SERVER START
// ============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});