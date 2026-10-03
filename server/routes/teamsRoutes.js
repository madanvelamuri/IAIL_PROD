const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');
const authMiddleware = require('../middleware/auth');

// ==========================================
// AUTHENTICATION PROTECTION
// ==========================================
router.use(authMiddleware);

// ==========================================
// TEAMS NOTIFICATION & REPORT ROUTES
// ==========================================

// Fetch paginated notification logs with filters
router.get('/notifications', teamsController.getNotifications);

// Send an individual mistake notification to Teams
router.post('/send', teamsController.sendNotification);

// Trigger manual markdown table report broadcast
router.post('/send-report', teamsController.sendReportNotification);

// Test webhook connection validity
router.post('/test', teamsController.sendTestNotification);

// ==========================================
// TEAMS CONFIGURATION & SYNC ROUTES
// ==========================================

// Retrieve webhook group settings
router.get('/settings', teamsController.getSettings);

// Save or update webhook group configurations
router.post('/settings', teamsController.saveSettings);

// Sync core mistake records into notification logs
router.post('/sync-dashboard', teamsController.syncDashboard);

module.exports = router;