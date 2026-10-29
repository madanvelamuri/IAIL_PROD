
const db = require("../config/db");

const NotificationModel = {
  // Initialize PostgreSQL tables without deleting existing records.
  initTables: async () => {
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS teams_notifications (
        id SERIAL PRIMARY KEY,
        claim_id VARCHAR(255) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        mistake_type VARCHAR(255) NOT NULL,
        description TEXT,
        screenshot_url TEXT,
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

      await db.query(`
        ALTER TABLE teams_notifications
        ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
      `);

      console.log("[NotificationModel] Tables initialized.");
    } catch (err) {
      console.error(
        "[NotificationModel] Table initialization failed:",
        err.message
      );
      throw err;
    }
  },

  // Get notifications with filtering and pagination.
  getNotifications: async ({
    fromDate,
    toDate,
    employee,
    teamsGroup,
    status,
    search,
    limit = 10,
    offset = 0,
  }) => {
    let baseQuery = " FROM teams_notifications WHERE 1=1";
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
      const index = params.length;

      baseQuery += `
        AND (
          claim_id ILIKE $${index}
          OR employee_name ILIKE $${index}
          OR mistake_type ILIKE $${index}
          OR description ILIKE $${index}
        )
      `;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total ${baseQuery}`,
      params
    );

    const total = Number.parseInt(countResult.rows[0]?.total || "0", 10);

    const queryParams = [...params, limit, offset];

    const dataQuery = `
      SELECT *
      ${baseQuery}
      ORDER BY created_date DESC, id DESC
      LIMIT $${queryParams.length - 1}
      OFFSET $${queryParams.length}
    `;

    const dataResult = await db.query(dataQuery, queryParams);

    return {
      rows: dataResult.rows,
      total,
    };
  },

  // Retrieve the active webhook for a Teams group.
  getWebhookConfig: async (teamsGroup) => {
    const result = await db.query(
      `
        SELECT webhook_url
        FROM teams_configs
        WHERE group_name = $1 AND is_active = 1
      `,
      [teamsGroup]
    );

    return result.rows[0];
  },

  // Update notification status after sending or failing.
  updateStatus: async (id, status, errorMessage = null) => {
    if (!["Sent", "Failed", "Pending"].includes(status)) {
      throw new Error("Invalid notification status.");
    }

    const sentAt = status === "Sent" ? new Date() : null;

    return db.query(
      `
        UPDATE teams_notifications
        SET status = $1,
            sent_at = $2,
            error_message = $3
        WHERE id = $4
      `,
      [status, sentAt, errorMessage, id]
    );
  },

  // Retrieve saved Teams settings.
  getAllSettings: async () => {
    const result = await db.query(`
      SELECT id, group_name, webhook_url, is_active
      FROM teams_configs
      ORDER BY group_name ASC
    `);

    return result.rows;
  },

  // Save or update a Teams webhook.
  saveSettings: async (groupName, webhookUrl) => {
    const result = await db.query(
      `
        INSERT INTO teams_configs (group_name, webhook_url, is_active)
        VALUES ($1, $2, 1)
        ON CONFLICT (group_name)
        DO UPDATE SET
          webhook_url = EXCLUDED.webhook_url,
          is_active = 1
        RETURNING id
      `,
      [groupName, webhookUrl]
    );

    return result.rows[0];
  },

  // Synchronize mistakes into Teams notifications.
  // Existing records are updated without resetting status or sent_at.
  syncDashboardData: async () => {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const columnResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'mistakes'
      `);

      const columns = new Set(
        columnResult.rows.map((row) => row.column_name.toLowerCase())
      );

      if (
        !columns.has("claim_id") ||
        !columns.has("employee_name") ||
        !columns.has("mistake_type")
      ) {
        throw new Error(
          "The mistakes table is missing a required synchronization column."
        );
      }

      const descriptionExpression = columns.has("description")
        ? "m.description"
        : "NULL";

      const screenshotExpression = columns.has("screenshot_url")
        ? "m.screenshot_url"
        : columns.has("screenshot")
          ? "m.screenshot"
          : columns.has("file_path")
            ? "m.file_path"
            : "NULL";

      const dateExpression = columns.has("created_date")
        ? "COALESCE(m.created_date, CURRENT_TIMESTAMP)"
        : columns.has("created_at")
          ? "COALESCE(m.created_at, CURRENT_TIMESTAMP)"
          : columns.has("date")
            ? "COALESCE(m.date, CURRENT_TIMESTAMP)"
            : "CURRENT_TIMESTAMP";

      const groupExpression = columns.has("teams_group")
        ? "COALESCE(m.teams_group, 'QC Team')"
        : columns.has("group_name")
          ? "COALESCE(m.group_name, 'QC Team')"
          : "'QC Team'";

      // Update descriptions for existing notification rows.
      // Status, sent_at, and error_message are intentionally preserved.
      const updateResult = await client.query(`
        UPDATE teams_notifications AS tn
        SET
          description = ${descriptionExpression},
          screenshot_url = COALESCE(
            ${screenshotExpression},
            tn.screenshot_url
          )
        FROM mistakes AS m
        WHERE tn.claim_id::text = m.claim_id::text
          AND LOWER(TRIM(tn.employee_name)) =
              LOWER(TRIM(m.employee_name))
          AND LOWER(TRIM(tn.mistake_type)) =
              LOWER(TRIM(m.mistake_type))
          AND (
            COALESCE(tn.description, '') <>
              COALESCE(${descriptionExpression}, '')
            OR (
              ${screenshotExpression} IS NOT NULL
              AND COALESCE(tn.screenshot_url, '') <>
                  COALESCE(${screenshotExpression}, '')
            )
          )
      `);

      // Insert source mistakes that do not yet have a matching
      // notification row. Existing rows are not duplicated.
      const insertResult = await client.query(`
        INSERT INTO teams_notifications (
          claim_id,
          employee_name,
          mistake_type,
          description,
          screenshot_url,
          created_date,
          teams_group,
          status
        )
        SELECT
          m.claim_id,
          m.employee_name,
          m.mistake_type,
          ${descriptionExpression},
          ${screenshotExpression},
          ${dateExpression},
          ${groupExpression},
          'Pending'
        FROM mistakes AS m
        WHERE NOT EXISTS (
          SELECT 1
          FROM teams_notifications AS tn
          WHERE tn.claim_id::text = m.claim_id::text
            AND LOWER(TRIM(tn.employee_name)) =
                LOWER(TRIM(m.employee_name))
            AND LOWER(TRIM(tn.mistake_type)) =
                LOWER(TRIM(m.mistake_type))
        )
      `);

      await client.query("COMMIT");

      const updated = updateResult.rowCount || 0;
      const inserted = insertResult.rowCount || 0;

      return {
        changes: updated + inserted,
        updated,
        inserted,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[NotificationModel] Sync error:", err.message);
      throw err;
    } finally {
      client.release();
    }
  },

  // Delete a notification row when explicitly requested by the user.
  deleteNotification: async (id) => {
    const result = await db.query(
      "DELETE FROM teams_notifications WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error("Notification not found.");
    }

    return result.rows[0];
  },
};

module.exports = NotificationModel;
