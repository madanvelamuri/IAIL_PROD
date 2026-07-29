const db = require('../config/db');
const axios = require('axios');

// Helper to promisify SQLite query execution
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    err ? reject(err) : resolve(this);
  });
});

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

    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

    let baseQuery = `FROM teams_notifications WHERE 1=1`;
    const params = [];

    if (fromDate) {
      baseQuery += ` AND DATE(created_date) >= DATE(?)`;
      params.push(fromDate);
    }

    if (toDate) {
      baseQuery += ` AND DATE(created_date) <= DATE(?)`;
      params.push(toDate);
    }

    if (employee && employee !== 'All Employees') {
      baseQuery += ` AND employee_name = ?`;
      params.push(employee);
    }

    if (teamsGroup && teamsGroup !== 'All Groups') {
      baseQuery += ` AND teams_group = ?`;
      params.push(teamsGroup);
    }

    if (status && status !== 'All') {
      baseQuery += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      baseQuery += ` AND (claim_id LIKE ? OR employee_name LIKE ? OR mistake_type LIKE ? OR description LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    // Execute count query
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await dbGet(countQuery, params);
    const total = countResult ? countResult.total : 0;

    // Execute data retrieval query
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_date DESC LIMIT ? OFFSET ?`;
    const rows = await dbAll(dataQuery, [...params, parsedLimit, offset]);

    return res.json({
      data: rows,
      total: total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error retrieving notifications', 
      error: error.message 
    });
  }
};

// Send / Resend notification to Webhook
exports.sendNotification = async (req, res) => {
  const { 
    notificationId, 
    claimId, 
    employeeName, 
    mistakeType, 
    description, 
    teamsGroup, 
    repeated 
  } = req.body;

  try {
    // 1. Get webhook URL for specified group
    const config = await dbGet(
      `SELECT webhook_url FROM teams_configs WHERE group_name = ? AND is_active = 1`, 
      [teamsGroup]
    );

    if (!config || !config.webhook_url) {
      return res.status(400).json({ 
        message: `No active MS Teams webhook found for group: ${teamsGroup}` 
      });
    }

    // 2. Format Adaptive Card / Payload for MS Teams
    const facts = [
      { name: "Claim ID:", value: String(claimId) },
      { name: "Employee:", value: String(employeeName) },
      { name: "Mistake Type:", value: String(mistakeType) },
      { name: "Description:", value: description || 'N/A' },
      { name: "Teams Group:", value: String(teamsGroup) }
    ];

    if (repeated) {
      facts.push({ name: "Repeated Count:", value: String(repeated) });
    }

    const teamsPayload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": `Mistake Notification: Claim ${claimId}`,
      "sections": [{
        "activityTitle": "⚠️ Mistake Flagged for Review",
        "facts": facts,
        "markdown": true
      }]
    };

    // 3. Post to Webhook & update notification record state
    const now = new Date().toISOString();
    try {
      await axios.post(config.webhook_url, teamsPayload);

      if (notificationId) {
        await dbRun(
          `UPDATE teams_notifications SET status = 'Sent', sent_at = ?, error_message = NULL WHERE id = ?`, 
          [now, notificationId]
        );
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Notification sent successfully!' 
      });
    } catch (webhookErr) {
      if (notificationId) {
        await dbRun(
          `UPDATE teams_notifications SET status = 'Failed', error_message = ? WHERE id = ?`, 
          [webhookErr.message, notificationId]
        );
      }

      return res.status(502).json({ 
        message: 'Failed to deliver message to Microsoft Teams', 
        error: webhookErr.message 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Test Webhook configuration
exports.sendTestNotification = async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ message: 'Webhook URL is required' });
  }

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

    return res.status(200).json({ success: true, message: 'Test message delivered!' });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Webhook test failed', 
      error: error.message 
    });
  }
};

// Manage Webhook settings
exports.getSettings = async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM teams_configs`);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.saveSettings = async (req, res) => {
  const { groupName, webhookUrl } = req.body;
  
  if (!groupName || !webhookUrl) {
    return res.status(400).json({ message: 'groupName and webhookUrl are required' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO teams_configs (group_name, webhook_url) VALUES (?, ?) 
       ON CONFLICT(group_name) DO UPDATE SET webhook_url = excluded.webhook_url`,
      [groupName, webhookUrl]
    );
    return res.json({ success: true, id: result.lastID });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};