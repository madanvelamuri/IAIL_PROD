require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const teamsRoutes = require("./routes/teamsRoutes");

// Database Model Import for Initialization
const NotificationModel = require("./models/notificationModel");

const app = express();

// MIDDLEWARE //

// Configured CORS for production domain flexibility
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to allow during staging
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES //

app.use("/api/auth", authRoutes);
app.use("/api/mistakes", mistakeRoutes);
app.use("/api/teams", teamsRoutes);

// HEALTH CHECK ROUTE //

app.get("/", (req, res) => {
  res.json({ message: "IAIL Server Running Successfully 🚀", timestamp: new Date() });
});

// GLOBAL ERROR HANDLER //

app.use((err, req, res, next) => {
  console.error("[Global Error Handler]:", err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// SERVER START & ASYNC INITIALIZATION //

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Initialize DB tables
    await NotificationModel.initTables();
    console.log("[Database] Schema tables initialized successfully.");

    // 2. Sync existing dashboard mistake records to teams_notifications
    const syncResult = await NotificationModel.syncDashboardData();
    if (syncResult && syncResult.changes > 0) {
      console.log(
        `[Database Sync] Successfully synced ${syncResult.changes} dashboard record(s) to Teams Notifications.`
      );
    } else {
      console.log("[Database Sync] No new records to sync.");
    }

    // 3. Start listening for requests
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Server Startup Error]:", error.message);
    process.exit(1);
  }
};

startServer();

// PROCESS ERROR CATCHERS //

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection]:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]:", error);
});