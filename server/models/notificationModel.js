
const db = require("../config/db");

const NotificationModel = {
  // ==========================================
  // INITIALIZE TABLES AND SAFE MIGRATIONS
  // ==========================================
  initTables: async () => {
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS teams_notifications (
        id SERIAL PRIMARY KEY,
        claim_id VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        mistake_type VARCHAR(255) NOT NULL,
        description TEXT,
        screenshot_url TEXT,
        condition_status VARCHAR(100),
        created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        teams_group VARCHAR(255) DEFAULT 'QC Team',
        status VARCHAR(50)
          CHECK (status IN ('Sent', 'Failed', 'Pending'))
          DEFAULT 'Pending',
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

      // Safe migrations for existing tables.
      await db.query(`
        ALTER TABLE public.teams_notifications
        ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
      `);

      await db.query(`
        ALTER TABLE public.teams_notifications
        ADD COLUMN IF NOT EXISTS condition_status VARCHAR(100);
      `);

      console.log(
        "[NotificationModel] Tables and migrations initialized."
      );
    } catch (err) {
      console.error(
        "[NotificationModel] Table initialization error:",
        err.message
      );

      throw err;
    }
  },

  // ==========================================
  // GET NOTIFICATIONS
  // Includes condition_status in SELECT *
  // ==========================================
  getNotifications: async ({
    fromDate,
    toDate,
    employee,
    teamsGroup,
    status,
    search,
    limit,
    offset,
  }) => {
    let baseQuery = "FROM teams_notifications WHERE 1=1";
    const params = [];

    if (fromDate) {
      params.push(fromDate);
      baseQuery += ` AND created_date::date >= $${params.length}`;
    }

    if (toDate) {
      params.push(toDate);
      baseQuery += ` AND created_date::date <= $${params.length}`;
    }

    if (employee && employee !== "All Employees") {
      params.push(`%${employee}%`);
      baseQuery += ` AND employee_name ILIKE $${params.length}`;
    }

    if (teamsGroup && teamsGroup !== "All Groups") {
      params.push(teamsGroup);
      baseQuery += ` AND teams_group = $${params.length}`;
    }

    if (status && status !== "All") {
      params.push(status);
      baseQuery += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;

      baseQuery += `
        AND (
          claim_id ILIKE $${idx}
          OR employee_name ILIKE $${idx}
          OR mistake_type ILIKE $${idx}
          OR description ILIKE $${idx}
          OR COALESCE(condition_status, '') ILIKE $${idx}
        )
      `;
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      ${baseQuery}
    `;

    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
    const safeOffset = Math.max(0, Number(offset) || 0);

    const queryParams = [...params, safeLimit, safeOffset];

    const dataQuery = `
      SELECT *
      ${baseQuery}
      ORDER BY created_date DESC
      LIMIT $${queryParams.length - 1}
      OFFSET $${queryParams.length}
    `;

    const { rows } = await db.query(dataQuery, queryParams);

    return { rows, total };
  },

  // ==========================================
  // GET ACTIVE TEAMS WEBHOOK CONFIG
  // ==========================================
  getWebhookConfig: async (teamsGroup) => {
    const result = await db.query(
      `SELECT webhook_url
       FROM teams_configs
       WHERE group_name = $1 AND is_active = 1`,
      [teamsGroup]
    );

    return result.rows[0];
  },

  // ==========================================
  // UPDATE NOTIFICATION STATUS
  // ==========================================
  updateStatus: async (id, status, errorMessage = null) => {
    const now = new Date();

    return db.query(
      `UPDATE teams_notifications
       SET status = $1,
           sent_at = $2,
           error_message = $3
       WHERE id = $4`,
      [status, now, errorMessage, id]
    );
  },

  // ==========================================
  // GET TEAMS SETTINGS
  // ==========================================
  getAllSettings: async () => {
    const result = await db.query(
      `SELECT *
       FROM teams_configs
       ORDER BY group_name ASC`
    );

    return result.rows;
  },

  // ==========================================
  // SAVE TEAMS SETTINGS
  // ==========================================
  saveSettings: async (groupName, webhookUrl) => {
    const result = await db.query(
      `INSERT INTO teams_configs
         (group_name, webhook_url, is_active)
       VALUES ($1, $2, 1)
       ON CONFLICT (group_name)
       DO UPDATE SET
         webhook_url = EXCLUDED.webhook_url,
         is_active = 1
       RETURNING id`,
      [groupName, webhookUrl]
    );

    return result.rows[0];
  },

  // ==========================================
  // SYNC MISTAKES INTO TEAMS NOTIFICATIONS
  // Preserves condition_status and existing statuses.
  // Does not delete existing records.
  // ==========================================
  syncDashboardData: async () => {
    try {
      // 1. Inspect the actual columns in public.mistakes.
      const columnCheckSql = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'mistakes';
      `;

      const colResult = await db.query(columnCheckSql);

      const existingCols = new Set(
        colResult.rows.map((row) => row.column_name.toLowerCase())
      );

      if (
        !existingCols.has("claim_id") ||
        !existingCols.has("employee_name") ||
        !existingCols.has("mistake_type")
      ) {
        throw new Error(
          "The mistakes table is missing a required column."
        );
      }

      // 2. Select safe fallback expressions based on the schema.
      const dateExpression = existingCols.has("created_date")
        ? "COALESCE(m.created_date, CURRENT_TIMESTAMP)"
        : existingCols.has("created_at")
        ? "COALESCE(m.created_at, CURRENT_TIMESTAMP)"
        : existingCols.has("date")
        ? "COALESCE(m.date, CURRENT_TIMESTAMP)"
        : "CURRENT_TIMESTAMP";

      const groupExpression = existingCols.has("teams_group")
        ? "COALESCE(m.teams_group, 'QC Team')"
        : existingCols.has("group_name")
        ? "COALESCE(m.group_name, 'QC Team')"
        : "'QC Team'";

      const screenshotExpression = existingCols.has("screenshot_url")
        ? "m.screenshot_url"
        : existingCols.has("screenshot")
        ? "m.screenshot"
        : existingCols.has("file_path")
        ? "m.file_path"
        : "NULL";

      const descriptionExpression = existingCols.has("description")
        ? "m.description"
        : "''";

      const conditionExpression = existingCols.has("condition_status")
        ? "NULLIF(BTRIM(m.condition_status), '')"
        : "NULL";

      // 3. Backfill conditions into matching existing notifications.
      // Only fills missing condition values; preserves status and sent_at.
      if (existingCols.has("condition_status")) {
        await db.query(`
          UPDATE public.teams_notifications AS tn
          SET condition_status = source.condition_status
          FROM public.mistakes AS source
          WHERE source.claim_id::text = tn.claim_id::text
            AND source.employee_name = tn.employee_name
            AND source.mistake_type = tn.mistake_type
            AND NULLIF(BTRIM(source.condition_status), '') IS NOT NULL
            AND (
              tn.condition_status IS NULL
              OR BTRIM(tn.condition_status) = ''
            );
        `);
      }

      // 4. Insert new records, including condition_status.
      // A matching notification with the same condition is not duplicated.
      const syncSql = `
        INSERT INTO public.teams_notifications (
          claim_id,
          employee_name,
          mistake_type,
          description,
          screenshot_url,
          condition_status,
          created_date,
          teams_group,
          status
        )
        SELECT
          m.claim_id::text,
          m.employee_name,
          m.mistake_type,
          ${descriptionExpression},
          ${screenshotExpression},
          ${conditionExpression},
          ${dateExpression},
          ${groupExpression},
          'Pending'
        FROM public.mistakes AS m
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.teams_notifications AS tn
          WHERE tn.claim_id::text = m.claim_id::text
            AND tn.employee_name = m.employee_name
            AND tn.mistake_type = m.mistake_type
            AND tn.condition_status IS NOT DISTINCT FROM
                ${conditionExpression}
        );
      `;

      const result = await db.query(syncSql);

      const changes = result.rowCount || 0;

      console.log(
        `[NotificationModel] Sync completed. Inserted ${changes} new notification(s).`
      );

      return { changes };
    } catch (err) {
      console.error(
        "[NotificationModel] Sync error:",
        err.message
      );

      throw err;
    }
  },
};

module.exports = NotificationModel;
