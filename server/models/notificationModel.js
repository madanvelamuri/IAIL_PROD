const db = require('../config/db');

// SQLite table setup / database helper for MS Teams Notification logs & Webhook configs
const NotificationModel = {
  // Initialize tables if using SQLite / relational DB directly
  initTables: () => {
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS teams_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        mistake_type TEXT NOT NULL,
        description TEXT,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        teams_group TEXT NOT NULL,
        status TEXT CHECK(status IN ('Sent', 'Failed', 'Pending')) DEFAULT 'Pending',
        sent_at DATETIME,
        error_message TEXT
      );
    `;

    const createConfigTable = `
      CREATE TABLE IF NOT EXISTS teams_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT UNIQUE NOT NULL,
        webhook_url TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
      );
    `;

    db.run(createLogsTable);
    db.run(createConfigTable);
  }
};

module.exports = NotificationModel;