const NotificationModel = require('../models/notificationModel');
const axios = require('axios');

// Helper to format dates into exact DD-MM-YYYY format matching your spreadsheet/dashboard
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Helper to build valid, clickable public Supabase Storage URLs
 * Aligns with the 'public' subfolder requirement in Supabase Storage RLS.
 */
const buildSupabaseScreenshotUrl = (rawUrl) => {
  if (!rawUrl || String(rawUrl).trim() === '' || rawUrl === 'null') {
    return null;
  }

  let fullUrl = String(rawUrl).trim();

  // 1. If it's already a full valid HTTP/HTTPS URL, return it directly
  if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
    return fullUrl;
  }

  const SUPABASE_BASE_URL = process.env.SUPABASE_URL || 'https://rzfmcziqenovgvhxgbau.supabase.co';
  const BUCKET_NAME = 'screenshots';

  // 2. Clean leading slashes, backslashes, or bucket prefixes if stored in DB string
  let cleanedPath = fullUrl
    .replace(/^\\+/, '')
    .replace(/^\/+/, '')
    .replace(/^screenshots\//i, '');

  // 3. Ensure path includes the 'public/' subfolder required by Supabase RLS
  if (!cleanedPath.toLowerCase().startsWith('public/')) {
    cleanedPath = `public/${cleanedPath}`;
  }

  // 4. Encode filename segments to safely handle spaces and special characters
  const pathParts = cleanedPath.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');

  return `${SUPABASE_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodedPath}`;
};

/**
 * Reusable helper function to fetch records, format the Markdown Table,
 * and post it to MS Teams via Webhook.
 */
const generateAndSendTeamsReport = async ({ 
  teamsGroup = 'QC Team', 
  fromDate, 
  toDate, 
  employee, 
  search 
} = {}) => {
  // 1. Fetch saved Webhook URL for the group
  const config = await NotificationModel.getWebhookConfig(teamsGroup);

  if (!config || !config.webhook_url) {
    throw new Error(`No active MS Teams webhook found for group: ${teamsGroup}`);
  }

  // 2. Fetch mistake records from DB
  const { rows: mistakes } = await NotificationModel.getNotifications({
    teamsGroup: teamsGroup !== 'All Groups' ? teamsGroup : undefined,
    fromDate,
    toDate,
    employee,
    search,
    limit: 50,
    offset: 0
  });

  if (!mistakes || mistakes.length === 0) {
    await axios.post(config.webhook_url, {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "summary": `Mistake Tracking Report - ${teamsGroup}`,
      "text": `📊 **Mistake Tracking Report (${teamsGroup})**\n\nNo mistake records found.`
    });
    return { success: true, message: 'No records to report.' };
  }

  // 3. Pre-calculate repeated mistake frequencies (Matches Dashboard Logic)
  const repeatedMistakeMap = {};
  mistakes.forEach((m) => {
    const emp = m.employee_name || m.employeename || m.employee || 'Unknown';
    const type = m.mistake_type || m.mistaketype || 'General';
    const key = `${emp}_${type}`;
    repeatedMistakeMap[key] = (repeatedMistakeMap[key] || 0) + 1;
  });

  // 4. Build Markdown Table Header using &nbsp; to prevent multiline column title wrapping
  let markdownTable = `| Claim ID | Employee Name | Mistake Type | Description | Created&nbsp;Date | Screenshot&nbsp;URL | Repeated |\n`;
  markdownTable += `| :--- | :--- | :--- | :--- | :---: | :---: | :---: |\n`;

  // 5. Build Table Rows
  mistakes.forEach((item) => {
    const claimId = item.claim_id || item.claimid || '-';
    const empName = item.employee_name || item.employeename || item.employee || '-';
    const mistake = item.mistake_type || item.mistaketype || '-';
    
    // Replace pipe characters in description to keep Markdown table formatting intact
    let rawDesc = item.description || '-';
    const desc = rawDesc.replace(/\|/g, '-');

    const createdDate = formatDate(item.created_date || item.createdat || item.created_at);

    // Screenshot URL Resolution for Supabase Storage
    const rawUrl = item.screenshot_url || item.screenshot || item.image_url || item.file_path;
    const resolvedUrl = buildSupabaseScreenshotUrl(rawUrl);
    
    // Format markdown hyperlinked URL as [View](URL)
    const screenshotMarkup = resolvedUrl ? `[View](${resolvedUrl})` : '-';

    // Repeated Calculation (Matches React Dashboard 'Repeated (X)')
    const key = `${empName}_${mistake}`;
    const repeatCount = repeatedMistakeMap[key] || parseInt(item.repeated_count || item.repeat_count || 0, 10);
    
    let repeatedMarkup = '-';
    if (repeatCount > 1) {
      repeatedMarkup = `Repeated (${repeatCount})`;
    }

    markdownTable += `| ${claimId} | ${empName} | ${mistake} | ${desc} | ${createdDate} | ${screenshotMarkup} | ${repeatedMarkup} |\n`;
  });

  // 6. MS Teams MessageCard Payload
  const teamsPayload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": `Mistake Tracking Report (${teamsGroup})`,
    "sections": [
      {
        "activityTitle": `📊 **Mistake Tracking Report (${teamsGroup})**`,
        "text": markdownTable,
        "markdown": true
      }
    ]
  };

  await axios.post(config.webhook_url, teamsPayload);
  return { success: true };
};

// ---------------- EXPORTS ---------------- //

exports.generateAndSendTeamsReport = generateAndSendTeamsReport;

// Endpoint for manual trigger via UI "Send Report" button
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