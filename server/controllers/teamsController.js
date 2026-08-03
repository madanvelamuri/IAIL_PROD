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

  // Base URL to ensure absolute links for screenshots
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

  // Construct table rows with optimized width and formatted dates
  const tableRows = mistakes.map((item) => {
    // Ensure screenshot URL is absolute
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

  // Adaptive Card JSON Payload with updated column width proportions
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
                { width: 3 }, // Claim ID
                { width: 3 }, // Employee Name
                { width: 3 }, // Mistake Type
                { width: 4 }, // Description
                { width: 3 }, // Created Date (Formatted)
                { width: 2 }, // Screenshot
                { width: 2 }  // Repeated Count
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
                    { type: "TableCell", items: [{ type: "TextBlock", text: "**Repeat**", weight: "Bolder" }] } // ✅ Fixed
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