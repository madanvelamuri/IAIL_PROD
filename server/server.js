
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
const creatorRoutes = require("./routes/creatorRoutes");

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
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://iail-prod.vercel.app",
]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files if local storage is used.
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

// One Creator router for mistake types, employees, and user accounts.
app.use("/api/creator", creatorRoutes);

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

      console.log("[Cron Job] Daily report sent successfully.");
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
// SERVER START & ASYNC INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("[Server] Starting initialization...");

    await NotificationModel.initTables();
    console.log("[Database] Notification tables initialized.");

    const syncResult =
      await NotificationModel.syncDashboardData();

    console.log("[Database Sync]", {
      changes: syncResult?.changes || 0,
      updated: syncResult?.updated || 0,
      inserted: syncResult?.inserted || 0,
    });

    app.listen(PORT, () => {
      console.log("------------------------------------");
      console.log("IAIL Backend Started Successfully");
      console.log(`Port: ${PORT}`);
      console.log("Authentication API: /api/auth");
      console.log("Mistake API: /api/mistakes");
      console.log("Teams API: /api/teams");
      console.log("Creator API: /api/creator");
      console.log("Daily Teams Report: 6:00 PM IST");
      console.log("------------------------------------");
    });
  } catch (error) {
    console.error("[Server Startup Error]:", error.message);
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

startServer();

module.exports = app;
