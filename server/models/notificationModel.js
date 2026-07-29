const db = require('../config/db');

const NotificationModel = {
  // Initialize PostgreSQL tables
  initTables: async () => {
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS teams_notifications (
        id SERIAL PRIMARY KEY,
        claim_id VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        mistake_type VARCHAR(255) NOT NULL,
        description TEXT,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        teams_group VARCHAR(255) DEFAULT 'QC Team',
        status VARCHAR(50) CHECK (status IN ('Sent', 'Failed', 'Pending')) DEFAULT 'Pending',
        sent_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT
      );
    `;

    const createConfigTable = `
      CREATE TABLE IF NOT EXISTS teams_configs (
        id SERIAL PRIMARY KEY,
        group_name VARCHAR(255) UNIQUE NOT NULL,
        webhook_url TEXT NOT NULL,
        is_active INT DEFAULT 1
      );
    `;

    try {
      await db.query(createLogsTable);
      await db.query(createConfigTable);
    } catch (err) {
      console.error('[NotificationModel] Table init error:', err.message);
    }
  },

  getNotifications: async ({ fromDate, toDate, employee, teamsGroup, status, search, limit, offset }) => {
    let baseQuery = `FROM teams_notifications WHERE 1=1`;
    const params = [];

    if (fromDate) {
      params.push(fromDate);
      baseQuery += ` AND created_date::date >= $${params.length}`;
    }
    if (toDate) {
      params.push(toDate);
      baseQuery += ` AND created_date::date <= $${params.length}`;
    }
    if (employee && employee !== 'All Employees') {
      params.push(`%${employee}%`);
      baseQuery += ` AND employee_name ILIKE $${params.length}`;
    }
    if (teamsGroup && teamsGroup !== 'All Groups') {
      params.push(teamsGroup);
      baseQuery += ` AND teams_group = $${params.length}`;
    }
    if (status && status !== 'All') {
      params.push(status);
      baseQuery += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      baseQuery += ` AND (claim_id ILIKE $${idx} OR employee_name ILIKE $${idx} OR mistake_type ILIKE $${idx} OR description ILIKE $${idx})`;
    }

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Clone params to avoid mutating array during pagination query construction
    const queryParams = [...params, limit, offset];
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_date DESC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    const { rows } = await db.query(dataQuery, queryParams);

    return { rows, total };
  },

  getWebhookConfig: async (teamsGroup) => {
    const res = await db.query(
      `SELECT webhook_url FROM teams_configs WHERE group_name = $1 AND is_active = 1`,
      [teamsGroup]
    );
    return res.rows[0];
  },

  updateStatus: async (id, status, errorMessage = null) => {
    const now = new Date();
    return await db.query(
      `UPDATE teams_notifications SET status = $1, sent_at = $2, error_message = $3 WHERE id = $4`,
      [status, now, errorMessage, id]
    );
  },

  getAllSettings: async () => {
    const res = await db.query(`SELECT * FROM teams_configs ORDER BY group_name ASC`);
    return res.rows;
  },

  saveSettings: async (groupName, webhookUrl) => {
    const res = await db.query(
      `INSERT INTO teams_configs (group_name, webhook_url, is_active) 
       VALUES ($1, $2, 1)
       ON CONFLICT (group_name) DO UPDATE SET webhook_url = EXCLUDED.webhook_url, is_active = 1
       RETURNING id`,
      [groupName, webhookUrl]
    );
    return res.rows[0];
  },

  // Sync existing mistakes table into teams_notifications safely
  syncDashboardData: async () => {
    try {
      // 1. Inspect existing columns in the 'mistakes' table dynamically
      const columnCheckSql = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'mistakes';
      `;
      const colResult = await db.query(columnCheckSql);
      const existingCols = colResult.rows.map((r) => r.column_name.toLowerCase());

      // Determine date expression fallback
      let dateExpression = 'CURRENT_TIMESTAMP';
      if (existingCols.includes('created_date')) {
        dateExpression = 'COALESCE(m.created_date, CURRENT_TIMESTAMP)';
      } else if (existingCols.includes('created_at')) {
        dateExpression = 'COALESCE(m.created_at, CURRENT_TIMESTAMP)';
      } else if (existingCols.includes('date')) {
        dateExpression = 'COALESCE(m.date, CURRENT_TIMESTAMP)';
      }

      // Determine group expression fallback
      let groupExpression = `'QC Team'`;
      if (existingCols.includes('teams_group')) {
        groupExpression = `COALESCE(m.teams_group, 'QC Team')`;
      } else if (existingCols.includes('group_name')) {
        groupExpression = `COALESCE(m.group_name, 'QC Team')`;
      }

      // 2. Execute safe sync query
      const syncSql = `
        INSERT INTO teams_notifications (claim_id, employee_name, mistake_type, description, created_date, teams_group, status)
        SELECT 
          m.claim_id,
          m.employee_name,
          m.mistake_type,
          ${existingCols.includes('description') ? 'm.description' : "''"},
          ${dateExpression},
          ${groupExpression},
          'Pending'
        FROM mistakes m
        WHERE NOT EXISTS (
          SELECT 1 FROM teams_notifications tn 
          WHERE tn.claim_id::text = m.claim_id::text 
            AND tn.employee_name = m.employee_name 
            AND tn.mistake_type = m.mistake_type
        );
      `;

      const res = await db.query(syncSql);
      return { changes: res.rowCount || 0 };
    } catch (err) {
      console.error('[NotificationModel] Sync Error:', err.message);
      return { changes: 0 };
    }
  }
};

module.exports = NotificationModel;