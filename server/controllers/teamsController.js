const NotificationModel = require('../models/notificationModel');
const axios = require('axios');

/**
 * Reusable helper function to fetch records, format the Adaptive Card Table,
 * and post it to MS Teams via Webhook.
 */
const generateAndSendTeamsReport = async (teamsGroup = 'QC Team') => {
  // 1. Fetch saved Webhook URL for the group
  const config = await NotificationModel.getWebhookConfig(teamsGroup);

  if (!config || !config.webhook_url) {
    throw new Error(`No active MS Teams webhook found for group: ${teamsGroup}`);
  }

  // 2. Fetch mistake records to populate the table
  const { rows: mistakes } = await NotificationModel.getNotifications({
    teamsGroup: teamsGroup !== 'All Groups' ? teamsGroup : undefined,
    limit: 15,
    offset: 0
  });

  if (!mistakes || mistakes.length === 0) {
    // Send lightweight message if no records are found
    await axios.post(config.webhook_url, {
      type: "message",
      text: `📊 **Mistake Tracking Report**\n\nNo mistake records found for group: **${teamsGroup}**.`
    });
    return { success: true, message: 'No records to report.' };
  }

  // 3. Construct Table rows dynamically
  const tableRows = mistakes.map((item) => ({
    type: "TableRow",
    cells: [
      { type: "TableCell", items: [{ type: "TextBlock", text: String(item.claim_id || '-'), wrap: true }] },
      { type: "TableCell", items: [{ type: "TextBlock", text: String(item.employee_name || '-'), wrap: true }] },
      { type: "TableCell", items: [{ type: "TextBlock", text: String(item.mistake_type || '-'), wrap: true }] },
      { type: "TableCell", items: [{ type: "TextBlock", text: String(item.description || '-'), wrap: true }] },
      { type: "TableCell", items: [{ type: "TextBlock", text: String(item.created_date || '-'), wrap: true }] },
      {
        type: "TableCell",
        items: item.screenshot_url
          ? [{ type: "TextBlock", text: `[View](${item.screenshot_url})`, wrap: true }]
          : [{ type: "TextBlock", text: "-", wrap: true }]
      },
      {
        type: "TableCell",
        items: [{
          type: "TextBlock",
          text: item.repeated_count ? `Repeated (${item.repeated_count})` : '',
          wrap: true
        }]
      }
    ]
  }));

  // 4. Adaptive Card JSON Payload
  const teamsPayload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptivecard.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: "📊 **Mistake Tracking Report**",
              weight: "Bolder",
              size: "Medium"
            },
            {
              type: "Table",
              columns: [
                { width: 2 }, // Claim ID
                { width: 2 }, // Employee Name
                { width: 2 }, // Mistake Type
                { width: 3 }, // Description
                { width: 2 }, // Created Date
                { width: 1 }, // Screenshot
                { width: 2 }  // Repeated
              ],
              rows: [
                {
                  type: "TableRow",
                  isHeader: true,
                  cells: [
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Claim ID**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Employee Name**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Mistake Type**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Description**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Created Date**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Screenshot URL**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Repeated**", weight: "Bolder" }] }
                  ]
                },
                ...tableRows
              ]
            }
          ]
        }
      }
    ]
  };

  await axios.post(config.webhook_url, teamsPayload);
  return { success: true };
};

// Export helper for node-cron (server.js)
exports.generateAndSendTeamsReport = generateAndSendTeamsReport;

// ROUTE: Manual Report Button POST Endpoint
exports.sendReportNotification = async (req, res) => {
  try {
    const { teamsGroup } = req.body;
    await generateAndSendTeamsReport(teamsGroup || 'QC Team');
    return res.status(200).json({ success: true, message: 'Report delivered to MS Teams!' });
  } catch (error) {
    console.error('Error sending report:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send report', error: error.message });
  }
};

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

    const { rows, total } = await NotificationModel.getNotifications({
      fromDate,
      toDate,
      employee,
      teamsGroup,
      status,
      search,
      limit: parsedLimit,
      offset
    });

    return res.json({
      data: rows,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit) || 1
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving notifications', error: error.message });
  }
};

exports.sendNotification = async (req, res) => {
  const { notificationId, claimId, employeeName, mistakeType, description, teamsGroup, repeated } = req.body;

  try {
    const config = await NotificationModel.getWebhookConfig(teamsGroup || 'QC Team');

    if (!config || !config.webhook_url) {
      if (notificationId) {
        await NotificationModel.updateStatus(notificationId, 'Failed', `No active webhook found for ${teamsGroup}`);
      }
      return res.status(400).json({ message: `No active MS Teams webhook found for group: ${teamsGroup}` });
    }

    const facts = [
      { name: "Claim ID:", value: String(claimId) },
      { name: "Employee:", value: String(employeeName) },
      { name: "Mistake Type:", value: String(mistakeType) },
      { name: "Description:", value: description || 'N/A' },
      { name: "Teams Group:", value: String(teamsGroup || 'QC Team') }
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

    try {
      await axios.post(config.webhook_url, teamsPayload);
      if (notificationId) {
        await NotificationModel.updateStatus(notificationId, 'Sent', null);
      }
      return res.status(200).json({ success: true, message: 'Notification sent successfully!' });
    } catch (webhookErr) {
      if (notificationId) {
        await NotificationModel.updateStatus(notificationId, 'Failed', webhookErr.message);
      }
      return res.status(502).json({ message: 'Failed to deliver message to Microsoft Teams', error: webhookErr.message });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

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
    return res.status(200).json({ success: true, message: 'Test message delivered!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Webhook test failed', error: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const rows = await NotificationModel.getAllSettings();
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.saveSettings = async (req, res) => {
  const { groupName, webhookUrl } = req.body;
  if (!groupName || !webhookUrl) return res.status(400).json({ message: 'groupName and webhookUrl are required' });

  try {
    const record = await NotificationModel.saveSettings(groupName, webhookUrl);
    return res.json({ success: true, id: record?.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Explicit Sync endpoint
exports.syncDashboard = async (req, res) => {
  try {
    const result = await NotificationModel.syncDashboardData();
    return res.json({ success: true, message: `Synced ${result.changes} dashboard entry/entries.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};