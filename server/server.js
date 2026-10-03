
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ==========================================
// CONTROLLERS
// ==========================================

const {
  generateAndSendTeamsReport,
} = require("./controllers/teamsController");

// ==========================================
// DATABASE MODEL
// ==========================================

const NotificationModel = require("./models/notificationModel");

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Retained from your existing staging configuration.
      // Restrict this before production if public access is not intended.
      return callback(null, true);
    },
    credentials: true,
  })
);

// Parse JSON requests
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// API ROUTES
// ==========================================

// Authentication
app.use("/api/auth", authRoutes);

// QC Mistake Management
app.use("/api/mistakes", mistakeRoutes);

// MS Teams Notifications
app.use("/api/teams", teamsRoutes);

// Gemini AI Description Generator
// POST /api/ai/generate-description
app.use("/api/ai", aiRoutes);

// ==========================================
// HEALTH CHECK ROUTES
// ==========================================

// Main server health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IAIL Server Running Successfully",
    timestamp: new Date().toISOString(),
  });
});

// AI route availability check
app.get("/api/ai/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gemini AI Description API route is available.",
    configured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// ==========================================
// CRON JOB
// AUTOMATED MS TEAMS REPORT AT 6:00 PM IST
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

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// ==========================================
// SERVER START & ASYNC INITIALIZATION
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("[Server] Starting initialization...");

    // 1. Initialize database tables
    await NotificationModel.initTables();

    console.log(
      "[Database] Schema tables initialized successfully."
    );

    // 2. Synchronize dashboard records
    // with Teams notifications
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

    // 3. Verify Gemini configuration without exposing the key
    console.log(
      `[Gemini] API key configured: ${
        Boolean(process.env.GEMINI_API_KEY)
      }`
    );

    console.log(
      `[Gemini] Model configured: ${
        process.env.GEMINI_MODEL || "gemini-3.8-flash"
      }`
    );

    // 4. Start Express server
    app.listen(PORT, () => {
      console.log("------------------------------------");
      console.log("🚀 IAIL Backend Started Successfully");
      console.log(`🌐 Port: ${PORT}`);
      console.log("🔐 Authentication API: /api/auth");
      console.log("📋 Mistake API: /api/mistakes");
      console.log("📢 Teams API: /api/teams");
      console.log(
        "🤖 Gemini AI API: /api/ai/generate-description"
      );
      console.log("🤖 Gemini Health: /api/ai/health");
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
  console.error(
    "[Unhandled Rejection]:",
    reason
  );
});

process.on("uncaughtException", (error) => {
  console.error(
    "[Uncaught Exception]:",
    error
  );

  process.exit(1);
});

// Start server
startServer();