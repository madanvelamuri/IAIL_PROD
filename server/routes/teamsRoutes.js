const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');
const authMiddleware = require('../middleware/auth');

// Protect all teams routes with authentication
router.use(authMiddleware);

router.get('/notifications', teamsController.getNotifications);
router.post('/send', teamsController.sendNotification);
router.post('/send-report', teamsController.sendReportNotification); // 👈 New route for manual report button
router.post('/test', teamsController.sendTestNotification);
router.get('/settings', teamsController.getSettings);
router.post('/settings', teamsController.saveSettings);
router.post('/sync-dashboard', teamsController.syncDashboard);

module.exports = router;