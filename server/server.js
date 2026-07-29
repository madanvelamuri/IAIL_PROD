require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const teamsRoutes = require("./routes/teamsRoutes"); // Added Teams routes module

// Database Model Import for Initialization
const NotificationModel = require("./models/notificationModel");

const app = express();

// DATABASE & SCHEMA INITIALIZATION //
// Initializes teams_notifications & teams_configs tables if they don't exist
NotificationModel.initTables();

// Automatically syncs existing dashboard mistake records to teams_notifications table on startup
NotificationModel.syncDashboardData()
  .then((result) => {
    if (result && result.changes > 0) {
      console.log(`[Database Sync] Successfully synced ${result.changes} dashboard record(s) to Teams Notifications.`);
    }
  })
  .catch((err) => {
    console.error("[Database Sync Error] Failed to sync dashboard records:", err.message);
  });

// MIDDLEWARE //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES //

app.use("/api/auth", authRoutes);
app.use("/api/mistakes", mistakeRoutes);
app.use("/api/teams", teamsRoutes); // Added Teams API route group

// HEALTH CHECK ROUTE // 

app.get("/", (req, res) => {
  res.json({ message: "IAIL Server Running Successfully 🚀" });
});

// GLOBAL ERROR HANDLER //

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// SERVER START //

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});