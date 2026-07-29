const db = require('../config/db');

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

const NotificationModel = {
  // Initialize SQLite tables
  initTables: () => {
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS teams_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        mistake_type TEXT NOT NULL,
        description TEXT,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        teams_group TEXT DEFAULT 'QC Team',
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
  },

  getNotifications: async ({ fromDate, toDate, employee, teamsGroup, status, search, limit, offset }) => {
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

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await dbGet(countQuery, params);
    const total = countResult ? countResult.total : 0;

    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_date DESC LIMIT ? OFFSET ?`;
    const rows = await dbAll(dataQuery, [...params, limit, offset]);

    return { rows, total };
  },

  getWebhookConfig: async (teamsGroup) => {
    return await dbGet(
      `SELECT webhook_url FROM teams_configs WHERE group_name = ? AND is_active = 1`, 
      [teamsGroup]
    );
  },

  updateStatus: async (id, status, errorMessage = null) => {
    const now = new Date().toISOString();
    return await dbRun(
      `UPDATE teams_notifications SET status = ?, sent_at = ?, error_message = ? WHERE id = ?`,
      [status, now, errorMessage, id]
    );
  },

  getAllSettings: async () => {
    return await dbAll(`SELECT * FROM teams_configs`);
  },

  saveSettings: async (groupName, webhookUrl) => {
    return await dbRun(
      `INSERT INTO teams_configs (group_name, webhook_url) VALUES (?, ?) 
       ON CONFLICT(group_name) DO UPDATE SET webhook_url = excluded.webhook_url`,
      [groupName, webhookUrl]
    );
  },

  // Sync existing mistakes table into teams_notifications
  syncDashboardData: async () => {
    const syncSql = `
      INSERT INTO teams_notifications (claim_id, employee_name, mistake_type, description, created_date, teams_group, status)
      SELECT 
        m.claim_id,
        m.employee_name,
        m.mistake_type,
        m.description,
        COALESCE(m.created_date, CURRENT_TIMESTAMP),
        COALESCE(m.teams_group, 'QC Team'),
        'Pending'
      FROM mistakes m
      WHERE NOT EXISTS (
        SELECT 1 FROM teams_notifications tn 
        WHERE tn.claim_id = m.claim_id 
          AND tn.employee_name = m.employee_name 
          AND tn.mistake_type = m.mistake_type
      );
    `;
    return await dbRun(syncSql);
  }
};

module.exports = NotificationModel;