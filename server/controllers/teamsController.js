const db = require('../config/db');
const axios = require('axios');

// Fetch paginated & filtered notification logs
exports.getNotifications = async (req, res) => {
  try {
    const { 
      fromDate, 
      toDate, 
      employee, 
      teamsGroup, 
      status, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;

    let query = `SELECT * FROM teams_notifications WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM teams_notifications WHERE 1=1`;
    const params = [];
    const countParams = [];

    if (fromDate) {
      query += ` AND DATE(created_date) >= DATE(?)`;
      countQuery += ` AND DATE(created_date) >= DATE(?)`;
      params.push(fromDate);
      countParams.push(fromDate);
    }

    if (toDate) {
      query += ` AND DATE(created_date) <= DATE(?)`;
      countQuery += ` AND DATE(created_date) <= DATE(?)`;
      params.push(toDate);
      countParams.push(toDate);
    }

    if (employee && employee !== 'All Employees') {
      query += ` AND employee_name = ?`;
      countQuery += ` AND employee_name = ?`;
      params.push(employee);
      countParams.push(employee);
    }

    if (teamsGroup && teamsGroup !== 'All Groups') {
      query += ` AND teams_group = ?`;
      countQuery += ` AND teams_group = ?`;
      params.push(teamsGroup);
      countParams.push(teamsGroup);
    }

    if (status && status !== 'All') {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      query += ` AND (claim_id LIKE ? OR employee_name LIKE ? OR mistake_type LIKE ? OR description LIKE ?)`;
      countQuery += ` AND (claim_id LIKE ? OR employee_name LIKE ? OR mistake_type LIKE ? OR description LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
      countParams.push(term, term, term, term);
    }

    const offset = (page - 1) * limit;
    query += ` ORDER BY created_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          data: rows,
          total: countResult.total,
          page: parseInt(page),
          totalPages: Math.ceil(countResult.total / limit)
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving notifications', error: error.message });
  }
};

// Send / Resend notification to Webhook
exports.sendNotification = async (req, res) => {
  const { notificationId, claimId, employeeName, mistakeType, description, teamsGroup } = req.body;

  try {
    // 1. Get webhook URL for group
    db.get(`SELECT webhook_url FROM teams_configs WHERE group_name = ? AND is_active = 1`, [teamsGroup], async (err, config) => {
      if (err || !config) {
        return res.status(400).json({ message: `No active MS Teams webhook found for group: ${teamsGroup}` });
      }

      // 2. Format Adaptive Card / Payload for MS Teams
      const teamsPayload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": `Mistake Notification: Claim ${claimId}`,
        "sections": [{
          "activityTitle": "⚠️ Mistake Flagged for Review",
          "facts": [
            { "name": "Claim ID:", "value": claimId },
            { "name": "Employee:", "value": employeeName },
            { "name": "Mistake Type:", "value": mistakeType },
            { "name": "Description:", "value": description || 'N/A' },
            { "name": "Teams Group:", "value": teamsGroup }
          ],
          "markdown": true
        }]
      };

      // 3. Post to Webhook
      try {
        await axios.post(config.webhook_url, teamsPayload);

        const now = new Date().toISOString();
        if (notificationId) {
          db.run(`UPDATE teams_notifications SET status = 'Sent', sent_at = ? WHERE id = ?`, [now, notificationId]);
        }

        return res.status(200).json({ success: true, message: 'Notification sent successfully!' });
      } catch (webhookErr) {
        if (notificationId) {
          db.run(`UPDATE teams_notifications SET status = 'Failed', error_message = ? WHERE id = ?`, [webhookErr.message, notificationId]);
        }
        return res.status(502).json({ message: 'Failed to deliver message to Microsoft Teams', error: webhookErr.message });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Test Webhook configuration
exports.sendTestNotification = async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ message: 'Webhook URL is required' });

  try {
    await axios.post(webhookUrl, {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "28A745",
      "summary": "IAIL Teams Connection Test",
      "sections": [{
        "activityTitle": "🔔 Connection Test Successful!",
        "text": "Your Microsoft Teams webhook is correctly configured and working.",
        "markdown": true
      }]
    });
    res.status(200).json({ success: true, message: 'Test message delivered!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Webhook test failed', error: error.message });
  }
};

// Manage Webhook settings
exports.getSettings = (req, res) => {
  db.all(`SELECT * FROM teams_configs`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.saveSettings = (req, res) => {
  const { groupName, webhookUrl } = req.body;
  db.run(
    `INSERT INTO teams_configs (group_name, webhook_url) VALUES (?, ?) 
     ON CONFLICT(group_name) DO UPDATE SET webhook_url = excluded.webhook_url`,
    [groupName, webhookUrl],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
};