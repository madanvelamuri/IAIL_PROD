const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');

// Define API Endpoints
router.get('/notifications', teamsController.getNotifications);
router.post('/send', teamsController.sendNotification);
router.post('/test', teamsController.sendTestNotification);
router.get('/settings', teamsController.getSettings);
router.post('/settings', teamsController.saveSettings);

module.exports = router;