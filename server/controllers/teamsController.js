const NotificationModel = require('../models/notificationModel');
const axios = require('axios');

// Helper to format raw dates into clean, compact strings
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const generateAndSendTeamsReport = async ({ 
  teamsGroup = 'QC Team', 
  fromDate, 
  toDate, 
  employee, 
  search 
} = {}) => {
  const config = await NotificationModel.getWebhookConfig(teamsGroup);

  if (!config || !config.webhook_url) {
    throw new Error(`No active MS Teams webhook found for group: ${teamsGroup}`);
  }

  const { rows: mistakes } = await NotificationModel.getNotifications({
    teamsGroup: teamsGroup !== 'All Groups' ? teamsGroup : undefined,
    fromDate,
    toDate,
    employee,
    search,
    limit: 20,
    offset: 0
  });

  if (!mistakes || mistakes.length === 0) {
    await axios.post(config.webhook_url, {
      type: "message",
      text: `📊 **Mistake Tracking Report**\n\nNo mistake records found for group: **${teamsGroup}**.`
    });
    return { success: true, message: 'No records to report.' };
  }

  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

  const tableRows = mistakes.map((item) => {
    let screenshotMarkup = '-';
    if (item.screenshot_url) {
      const fullUrl = item.screenshot_url.startsWith('http')
        ? item.screenshot_url
        : `${SERVER_URL}${item.screenshot_url.startsWith('/') ? '' : '/'}${item.screenshot_url}`;
      screenshotMarkup = `[View](${fullUrl})`;
    }

    return {
      type: "TableRow",
      cells: [
        { type: "TableCell", items: [{ type: "TextBlock", text: String(item.claim_id || '-'), wrap: true }] },
        { type: "TableCell", items: [{ type: "TextBlock", text: String(item.employee_name || '-'), wrap: true }] },
        { type: "TableCell", items: [{ type: "TextBlock", text: String(item.mistake_type || '-'), wrap: true }] },
        { type: "TableCell", items: [{ type: "TextBlock", text: String(item.description || '-'), wrap: true }] },
        { type: "TableCell", items: [{ type: "TextBlock", text: formatDate(item.created_date), wrap: true }] },
        { type: "TableCell", items: [{ type: "TextBlock", text: screenshotMarkup, wrap: true }] },
        {
          type: "TableCell",
          items: [{
            type: "TextBlock",
            text: item.repeated_count ? `(${item.repeated_count})` : '-',
            wrap: true
          }]
        }
      ]
    };
  });

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
              text: `📊 **Mistake Tracking Report (${teamsGroup})**`,
              weight: "Bolder",
              size: "Medium"
            },
            {
              type: "Table",
              columns: [
                { width: 3 },
                { width: 3 },
                { width: 3 },
                { width: 4 },
                { width: 3 },
                { width: 2 },
                { width: 2 }
              ],
              rows: [
                {
                  type: "TableRow",
                  isHeader: true,
                  cells: [
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Claim ID**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Employee**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Mistake**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Description**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Date**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Screenshot**", weight: "Bolder" }] },
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Repeat**", weight: "Bolder" }] }
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

// ---------------- EXPORTS ---------------- //

exports.generateAndSendTeamsReport = generateAndSendTeamsReport;

exports.sendReportNotification = async (req, res) => {
  try {
    const { teamsGroup, fromDate, toDate, employee, search } = req.body;
    await generateAndSendTeamsReport({
      teamsGroup: teamsGroup || 'QC Team',
      fromDate,
      toDate,
      employee,
      search
    });
    return res.status(200).json({ success: true, message: 'Report delivered to MS Teams!' });
  } catch (error) {
    console.error('Error sending report:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send report', error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { fromDate, toDate, employee, teamsGroup, status, search, page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows, total } = await NotificationModel.getNotifications({
      fromDate, toDate, employee, teamsGroup, status, search, limit: parsedLimit, offset
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
    if (repeated) facts.push({ name: "Repeated Count:", value: String(repeated) });

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
      if (notificationId) await NotificationModel.updateStatus(notificationId, 'Sent', null);
      return res.status(200).json({ success: true, message: 'Notification sent successfully!' });
    } catch (webhookErr) {
      if (notificationId) await NotificationModel.updateStatus(notificationId, 'Failed', webhookErr.message);
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

exports.syncDashboard = async (req, res) => {
  try {
    const result = await NotificationModel.syncDashboardData();
    return res.json({ success: true, message: `Synced ${result.changes} dashboard entry/entries.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};