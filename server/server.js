
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");

// ==========================================
// DATABASE
// ==========================================

const pool = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const accessRequestRoutes = require("./routes/accessRequestRoutes");
const settingsRoutes = require("./routes/settings");
const feedbackRoutes = require("./routes/feedbackRoutes");
// ==========================================
// CONTROLLERS
// ==========================================

const {
  generateAndSendTeamsReport,
} = require("./controllers/teamsController");

// ==========================================
// DATABASE MODELS
// ==========================================

const NotificationModel = require("./models/notificationModel");

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// PORT
// ==========================================

const PORT = process.env.PORT || 5000;

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://iail-prod.vercel.app",
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/+$/, ""));

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.error("[CORS] Blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/mistakes", mistakeRoutes);
app.use("/api/teams", teamsRoutes);

app.use("/api/creator", creatorRoutes);
app.use("/api/access-requests", accessRequestRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/feedback", feedbackRoutes);
// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IAIL Server Running Successfully",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// CRON JOB
// DAILY MS TEAMS REPORT AT 6:00 PM IST
// ==========================================

cron.schedule(
  "0 18 * * *",
  async () => {
    console.log(
      "[Cron Job] Triggering daily MS Teams report at 6:00 PM IST..."
    );

    try {
      await generateAndSendTeamsReport({
        teamsGroup: "QC Team",
      });

      console.log(
        "[Cron Job] Daily report sent successfully."
      );
    } catch (error) {
      console.error(
        "[Cron Job Error]:",
        error.message
      );
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("[Global Error Handler]:", {
    message: err.message,
    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : undefined,
  });

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed by CORS.",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// ==========================================
// SERVER START & DATABASE INITIALIZATION
// ==========================================

const startServer = async () => {
  try {
    console.log("------------------------------------");
    console.log("[Server] Starting initialization...");
    console.log("------------------------------------");

    // 1. Initialize PostgreSQL
    await pool.startDatabase();

    console.log(
      "[Database] PostgreSQL initialized successfully."
    );

    // 2. Initialize notification tables
    await NotificationModel.initTables();

    console.log(
      "[Database] Notification tables initialized."
    );

    // 3. Synchronize dashboard data
    const syncResult =
      await NotificationModel.syncDashboardData();

    console.log("[Database Sync]", {
      changes: syncResult?.changes || 0,
      updated: syncResult?.updated || 0,
      inserted: syncResult?.inserted || 0,
    });

    // 4. Start Express server only after initialization
    app.listen(PORT, () => {
      console.log("------------------------------------");
      console.log("IAIL Backend Started Successfully");
      console.log(`Port: ${PORT}`);
      console.log("------------------------------------");

      console.log("Authentication API: /api/auth");
      console.log("Mistake API: /api/mistakes");
      console.log("Teams API: /api/teams");
      console.log("Creator API: /api/creator");
      console.log("Access Request API: /api/access-requests");
      console.log("Settings API: /api/settings");

      console.log("------------------------------------");
      console.log("Daily Teams Report: 6:00 PM IST");
      console.log("------------------------------------");
    });

  } catch (error) {
    console.error(
      "[Server Startup Error]:",
      error.message
    );

    process.exit(1);
  }
};

// ==========================================
// PROCESS ERROR HANDLERS
// ==========================================

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]:", error);
  process.exit(1);
});

// ==========================================
// START APPLICATION
// ==========================================

startServer();

// ==========================================
// EXPORT APP
// ==========================================

module.exports = app;
