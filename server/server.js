
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const aiRoutes = require("./routes/aiRoutes");

// CONTROLLERS
const {
  generateAndSendTeamsReport,
} = require("./controllers/teamsController");

// DATABASE MODEL
const NotificationModel = require("./models/notificationModel");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// Configured CORS for production domain flexibility
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Retained from your existing staging configuration
      return callback(null, true);
    },
    credentials: true,
  })
);

// Parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
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

// AI Description Generator
// POST /api/ai/generate-description
app.use("/api/ai", aiRoutes);

// ==========================================
// HEALTH CHECK ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "IAIL Server Running Successfully 🚀",
    timestamp: new Date(),
  });
});

// ==========================================
// CRON JOB: AUTOMATED REPORT AT 6:00 PM IST
// ==========================================

cron.schedule(
  "0 18 * * *",
  async () => {
    console.log(
      "⏰ [Cron Job] Triggering daily MS Teams report at 6:00 PM IST..."
    );

    try {
      await generateAndSendTeamsReport("QC Team");

      console.log(
        "✅ [Cron Job] Daily report sent successfully to MS Teams!"
      );
    } catch (error) {
      console.error("[Cron Job Error]:", error.message);
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
  console.error("[Global Error Handler]:", err.stack);

  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

// ==========================================
// SERVER START & ASYNC INITIALIZATION
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Initialize database tables
    await NotificationModel.initTables();

    console.log(
      "[Database] Schema tables initialized successfully."
    );

    // 2. Sync existing dashboard mistake records
    // to Teams notifications
    const syncResult =
      await NotificationModel.syncDashboardData();

    if (syncResult && syncResult.changes > 0) {
      console.log(
        `[Database Sync] Successfully synced ${syncResult.changes} dashboard record(s) to Teams Notifications.`
      );
    } else {
      console.log(
        "[Database Sync] No new records to sync."
      );
    }

    // 3. Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        "🤖 AI Description API: /api/ai/generate-description"
      );
    });
  } catch (error) {
    console.error(
      "[Server Startup Error]:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

// ==========================================
// PROCESS ERROR HANDLERS
// ==========================================

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection]:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]:", error);
});