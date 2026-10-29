
const db = require("../config/db");

const NotificationModel = {
  // Initialize tables without deleting existing records.
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
    } catch (error) {
      console.error(
        "[NotificationModel] Initialization failed:",
        error.message
      );
      throw error;
    }
  },

  // Get notifications with filters and pagination.
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

    const total = Number.parseInt(
      countResult.rows[0]?.total || "0",
      10
    );

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

  // Get an active Teams webhook.
  getWebhookConfig: async (teamsGroup) => {
    const result = await db.query(
      `
        SELECT webhook_url
        FROM teams_configs
        WHERE group_name = $1
          AND is_active = 1
      `,
      [teamsGroup]
    );

    return result.rows[0];
  },

  // Update notification status after a send attempt.
  updateStatus: async (id, status, errorMessage = null) => {
    if (!["Sent", "Failed", "Pending"].includes(status)) {
      throw new Error("Invalid notification status.");
    }

    return db.query(
      `
        UPDATE teams_notifications
        SET
          status = $1,
          sent_at = CASE
            WHEN $1 = 'Sent' THEN CURRENT_TIMESTAMP
            ELSE NULL
          END,
          error_message = $3
        WHERE id = $2
      `,
      [status, id, errorMessage]
    );
  },

  // Get all saved Teams settings.
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
        INSERT INTO teams_configs (
          group_name,
          webhook_url,
          is_active
        )
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

  // Synchronize public.mistakes with teams_notifications.
  syncDashboardData: async () => {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Inspect available source columns.
      const columnResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'mistakes'
      `);

      const columns = new Set(
        columnResult.rows.map((row) => row.column_name.toLowerCase())
      );

      const requiredColumns = [
        "claim_id",
        "employee_name",
        "mistake_type",
      ];

      for (const column of requiredColumns) {
        if (!columns.has(column)) {
          throw new Error(
            `The public.mistakes table is missing '${column}'.`
          );
        }
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

      // Use condition_status to split old combined type names.
      // If the condition is missing, retain the original name rather
      // than guessing whether it should be Missing or Incorrect.
      const typeExpression = columns.has("condition_status")
        ? `
          CASE
            WHEN LOWER(TRIM(COALESCE(m.condition_status, '')))
                   IN ('missing', 'not added', 'not added / missing')
              AND LOWER(TRIM(m.mistake_type))
                   ~ '(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect)$'
            THEN REGEXP_REPLACE(
              TRIM(m.mistake_type),
              '[[:space:]]+(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect)$',
              ' NOT ADDED',
              'i'
            )

            WHEN LOWER(TRIM(COALESCE(m.condition_status, '')))
                   = 'incorrect'
              AND LOWER(TRIM(m.mistake_type))
                   ~ '(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect)$'
            THEN REGEXP_REPLACE(
              TRIM(m.mistake_type),
              '[[:space:]]+(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect)$',
              ' INCORRECT',
              'i'
            )

            ELSE TRIM(m.mistake_type)
          END
        `
        : "TRIM(m.mistake_type)";

      /*
       * First, update exact claim/employee/type matches.
       * Do not modify status, sent_at, or error_message.
       */
      const exactUpdateResult = await client.query(`
        WITH source_rows AS (
          SELECT
            m.claim_id::text AS claim_id,
            m.employee_name,
            ${typeExpression} AS display_type,
            ${descriptionExpression} AS source_description,
            ${screenshotExpression} AS source_screenshot
          FROM public.mistakes m
        )
        UPDATE teams_notifications tn
        SET
          mistake_type = s.display_type,
          description = s.source_description,
          screenshot_url = COALESCE(
            s.source_screenshot,
            tn.screenshot_url
          )
        FROM source_rows s
        WHERE tn.claim_id::text = s.claim_id
          AND LOWER(TRIM(tn.employee_name)) =
              LOWER(TRIM(s.employee_name))
          AND LOWER(TRIM(tn.mistake_type)) =
              LOWER(TRIM(s.display_type))
          AND (
            COALESCE(tn.description, '') <>
              COALESCE(s.source_description, '')
            OR (
              s.source_screenshot IS NOT NULL
              AND COALESCE(tn.screenshot_url, '') <>
                  COALESCE(s.source_screenshot, '')
            )
          )
      `);

      /*
       * Migrate a legacy combined name only when exactly one source
       * row matches its claim, employee, and base mistake name.
       *
       * If both Missing and Incorrect exist for the same claim and
       * employee, the old combined notification is ambiguous. It is
       * intentionally not assigned to either condition.
       */
      const legacyUpdateResult = await client.query(`
        WITH source_rows AS (
          SELECT
            m.claim_id::text AS claim_id,
            m.employee_name,
            ${typeExpression} AS display_type,
            ${descriptionExpression} AS source_description,
            ${screenshotExpression} AS source_screenshot,
            REGEXP_REPLACE(
              LOWER(TRIM(m.mistake_type)),
              '[[:space:]]+(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect|incorrect|not[[:space:]]+added)$',
              '',
              'i'
            ) AS base_type,
            COUNT(*) OVER (
              PARTITION BY
                m.claim_id::text,
                LOWER(TRIM(m.employee_name)),
                REGEXP_REPLACE(
                  LOWER(TRIM(m.mistake_type)),
                  '[[:space:]]+(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect|incorrect|not[[:space:]]+added)$',
                  '',
                  'i'
                )
            ) AS source_count
          FROM public.mistakes m
        )
        UPDATE teams_notifications tn
        SET
          mistake_type = s.display_type,
          description = s.source_description,
          screenshot_url = COALESCE(
            s.source_screenshot,
            tn.screenshot_url
          )
        FROM source_rows s
        WHERE tn.claim_id::text = s.claim_id
          AND LOWER(TRIM(tn.employee_name)) =
              LOWER(TRIM(s.employee_name))
          AND s.source_count = 1
          AND LOWER(TRIM(tn.mistake_type)) ~
              '(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect)$'
          AND REGEXP_REPLACE(
                LOWER(TRIM(tn.mistake_type)),
                '[[:space:]]+(incorrect[[:space:]]+or[[:space:]]+not[[:space:]]+added|not[[:space:]]+added[[:space:]]+or[[:space:]]+incorrect)$',
                '',
                'i'
              ) = s.base_type
      `);

      // Insert source rows whose condition-specific type is not present.
      // This does not delete or overwrite existing notification status.
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
          ${typeExpression},
          ${descriptionExpression},
          ${screenshotExpression},
          ${dateExpression},
          ${groupExpression},
          'Pending'
        FROM public.mistakes m
        WHERE NOT EXISTS (
          SELECT 1
          FROM teams_notifications tn
          WHERE tn.claim_id::text = m.claim_id::text
            AND LOWER(TRIM(tn.employee_name)) =
                LOWER(TRIM(m.employee_name))
            AND LOWER(TRIM(tn.mistake_type)) =
                LOWER(TRIM(${typeExpression}))
        )
      `);

      await client.query("COMMIT");

      const updated =
        (exactUpdateResult.rowCount || 0) +
        (legacyUpdateResult.rowCount || 0);

      const inserted = insertResult.rowCount || 0;

      console.log("[NotificationModel] Sync completed:", {
        updated,
        inserted,
      });

      return {
        changes: updated + inserted,
        updated,
        inserted,
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "[NotificationModel] Rollback failed:",
          rollbackError.message
        );
      }

      console.error(
        "[NotificationModel] Synchronization failed:",
        error.message
      );

      throw error;
    } finally {
      client.release();
    }
  },

  // Delete a notification only when explicitly requested.
  deleteNotification: async (id) => {
    const result = await db.query(
      `
        DELETE FROM teams_notifications
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      throw new Error("Notification not found.");
    }

    return result.rows[0];
  },
};

module.exports = NotificationModel;
