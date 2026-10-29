
const NotificationModel = require("../models/notificationModel");
const axios = require("axios");

// Format dates as DD-MM-YYYY.
const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}-${month}-${date.getFullYear()}`;
};

// Convert a stored screenshot path to a public Supabase URL.
const buildSupabaseScreenshotUrl = (rawUrl) => {
  if (
    !rawUrl ||
    ["null", "undefined"].includes(String(rawUrl).trim().toLowerCase())
  ) {
    return null;
  }

  const value = String(rawUrl).trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const baseUrl = (
    process.env.SUPABASE_URL ||
    "https://rzfmcziqenovgvhxgbau.supabase.co"
  ).replace(/\/+$/, "");

  const cleanedPath = value
    .replace(/^[\\/]+/, "")
    .replace(/^screenshots[\\/]+/i, "")
    .replace(/^public[\\/]+/i, "");

  const encodedPath = `public/${cleanedPath
    .split(/[\\/]+/)
    .map((part) => encodeURIComponent(part))
    .join("/")}`;

  return `${baseUrl}/storage/v1/object/public/screenshots/${encodedPath}`;
};

// Generate a report and send it to the configured Teams webhook.
const generateAndSendTeamsReport = async ({
  teamsGroup = "QC Team",
  fromDate,
  toDate,
  employee,
  search,
} = {}) => {
  const config = await NotificationModel.getWebhookConfig(teamsGroup);

  if (!config?.webhook_url) {
    throw new Error(
      `No active MS Teams webhook found for group: ${teamsGroup}`
    );
  }

  const { rows: mistakes } = await NotificationModel.getNotifications({
    teamsGroup: teamsGroup !== "All Groups" ? teamsGroup : undefined,
    fromDate,
    toDate,
    employee,
    search,
    limit: 50,
    offset: 0,
  });

  if (!mistakes?.length) {
    await axios.post(config.webhook_url, {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      summary: `Mistake Tracking Report - ${teamsGroup}`,
      text: `**Mistake Tracking Report (${teamsGroup})**\n\nNo mistake records found.`,
    });

    return {
      success: true,
      message: "No records to report.",
    };
  }

  const repeatedMistakeMap = {};

  mistakes.forEach((item) => {
    const employeeName =
      item.employee_name || item.employeename || item.employee || "Unknown";
    const mistakeType =
      item.mistake_type || item.mistaketype || "General";
    const key = `${employeeName}_${mistakeType}`;

    repeatedMistakeMap[key] = (repeatedMistakeMap[key] || 0) + 1;
  });

  let markdownTable =
    "| Claim ID | Employee Name | Mistake Type | Description | Created Date | Screenshot URL | Repeated |\n";
  markdownTable +=
    "| :--- | :--- | :--- | :--- | :---: | :---: | :---: |\n";

  mistakes.forEach((item) => {
    const claimId = item.claim_id || item.claimid || "-";
    const employeeName =
      item.employee_name || item.employeename || item.employee || "-";
    const mistakeType = item.mistake_type || item.mistaketype || "-";

    const description = String(item.description || item.desc || "-")
      .replace(/\|/g, "-")
      .replace(/\r?\n/g, " ");

    const createdDate = formatDate(
      item.created_date || item.createdat || item.created_at
    );

    const screenshotUrl = buildSupabaseScreenshotUrl(
      item.screenshot_url ||
        item.screenshoturl ||
        item.screenshot ||
        item.image_url ||
        item.file_path ||
        item.filepath
    );

    const screenshotMarkup = screenshotUrl
      ? `[View](${screenshotUrl})`
      : "-";

    const key = `${employeeName}_${mistakeType}`;
    const repeatCount =
      repeatedMistakeMap[key] ||
      Number.parseInt(item.repeated_count || item.repeat_count || 0, 10);

    const repeatedMarkup =
      repeatCount > 1 ? `Repeated (${repeatCount})` : "-";

    markdownTable +=
      `| ${claimId} | ${employeeName} | ${mistakeType} | ${description} | ${createdDate} | ${screenshotMarkup} | ${repeatedMarkup} |\n`;
  });

  await axios.post(config.webhook_url, {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: `Mistake Tracking Report (${teamsGroup})`,
    sections: [
      {
        activityTitle: `**Mistake Tracking Report (${teamsGroup})**`,
        text: markdownTable,
        markdown: true,
      },
    ],
  });

  return { success: true };
};

exports.generateAndSendTeamsReport = generateAndSendTeamsReport;

// Send a report to Teams.
exports.sendReportNotification = async (req, res) => {
  try {
    const { teamsGroup, fromDate, toDate, employee, search } = req.body;

    await generateAndSendTeamsReport({
      teamsGroup: teamsGroup || "QC Team",
      fromDate,
      toDate,
      employee,
      search,
    });

    return res.status(200).json({
      success: true,
      message: "Report delivered to MS Teams!",
    });
  } catch (error) {
    console.error("[Teams Report Error]:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send report.",
    });
  }
};

// Get Teams notification rows with filtering and pagination.
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
      limit = 10,
    } = req.query;

    const parsedLimit = Math.min(
      Math.max(Number.parseInt(limit, 10) || 10, 1),
      100
    );
    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows, total } = await NotificationModel.getNotifications({
      fromDate,
      toDate,
      employee,
      teamsGroup,
      status,
      search,
      limit: parsedLimit,
      offset,
    });

    return res.json({
      data: rows,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    });
  } catch (error) {
    console.error("[Get Teams Notifications Error]:", error.message);

    return res.status(500).json({
      message: "Error retrieving notifications.",
    });
  }
};

// Send one notification to Teams.
exports.sendNotification = async (req, res) => {
  const {
    notificationId,
    claimId,
    employeeName,
    mistakeType,
    description,
    teamsGroup,
    repeated,
  } = req.body;

  try {
    const group = teamsGroup || "QC Team";
    const config = await NotificationModel.getWebhookConfig(group);

    if (!config?.webhook_url) {
      if (notificationId) {
        await NotificationModel.updateStatus(
          notificationId,
          "Failed",
          `No active webhook found for ${group}`
        );
      }

      return res.status(400).json({
        message: `No active MS Teams webhook found for group: ${group}`,
      });
    }

    const facts = [
      { name: "Claim ID:", value: String(claimId || "-") },
      { name: "Employee:", value: String(employeeName || "-") },
      { name: "Mistake Type:", value: String(mistakeType || "-") },
      { name: "Description:", value: String(description || "N/A") },
      { name: "Teams Group:", value: group },
    ];

    if (repeated) {
      facts.push({
        name: "Repeated Count:",
        value: String(repeated),
      });
    }

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "0076D7",
      summary: `Mistake Notification: Claim ${claimId || "-"}`,
      sections: [
        {
          activityTitle: "Mistake Flagged for Review",
          facts,
          markdown: true,
        },
      ],
    };

    try {
      await axios.post(config.webhook_url, payload);

      if (notificationId) {
        await NotificationModel.updateStatus(notificationId, "Sent");
      }

      return res.status(200).json({
        success: true,
        message: "Notification sent successfully!",
      });
    } catch (webhookError) {
      if (notificationId) {
        await NotificationModel.updateStatus(
          notificationId,
          "Failed",
          webhookError.message
        );
      }

      return res.status(502).json({
        message: "Failed to deliver message to Microsoft Teams.",
      });
    }
  } catch (error) {
    console.error("[Send Teams Notification Error]:", error.message);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// Send a test message to a supplied webhook.
exports.sendTestNotification = async (req, res) => {
  const { webhookUrl } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({
      message: "Webhook URL is required.",
    });
  }

  try {
    await axios.post(webhookUrl, {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "28A745",
      summary: "IAIL Teams Connection Test",
      sections: [
        {
          activityTitle: "Connection Test Successful!",
          text: "Your Microsoft Teams webhook is configured and working.",
          markdown: true,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Test message delivered!",
    });
  } catch (error) {
    console.error("[Teams Test Error]:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook test failed.",
    });
  }
};

// Get saved Teams webhook settings.
exports.getSettings = async (req, res) => {
  try {
    const rows = await NotificationModel.getAllSettings();
    return res.json(rows);
  } catch (error) {
    console.error("[Get Teams Settings Error]:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve Teams settings.",
    });
  }
};

// Save Teams webhook settings.
exports.saveSettings = async (req, res) => {
  const { groupName, webhookUrl } = req.body;

  if (!groupName?.trim() || !webhookUrl?.trim()) {
    return res.status(400).json({
      message: "groupName and webhookUrl are required.",
    });
  }

  try {
    const record = await NotificationModel.saveSettings(
      groupName.trim(),
      webhookUrl.trim()
    );

    return res.json({
      success: true,
      id: record?.id,
    });
  } catch (error) {
    console.error("[Save Teams Settings Error]:", error.message);

    return res.status(500).json({
      message: "Unable to save Teams settings.",
    });
  }
};

// Synchronize source mistakes and return update/insert counts.
exports.syncDashboard = async (req, res) => {
  try {
    const result = await NotificationModel.syncDashboardData();

    return res.status(200).json({
      success: true,
      message: "Teams notification synchronization completed.",
      changes: result?.changes || 0,
      updated: result?.updated || 0,
      inserted: result?.inserted || 0,
    });
  } catch (error) {
    console.error("[Teams Sync Error]:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to synchronize dashboard records.",
    });
  }
};

// Delete a notification when explicitly requested.
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await NotificationModel.deleteNotification(id);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("[Delete Teams Notification Error]:", error.message);

    const notFound = error.message === "Notification not found.";

    return res.status(notFound ? 404 : 500).json({
      success: false,
      message: notFound
        ? error.message
        : "Failed to delete notification.",
    });
  }
};
