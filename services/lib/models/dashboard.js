import pgClient from '../pgClient.js';
import config from '../config.js';

class Dashboard {

  /**
   * @description Query dashboards with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {Number} params.page - Page number
   * @param {Number} params.per_page - Number of results per page
   * @param {String} params.q - Search string to filter dashboards by label
   * @param {String} params.form - Filter by associated form name or ID
   * @param {Boolean} params.active_only - If true, only return non-archived dashboards
   * @returns {Object} Paginated results object or an error object
   */
  async query(params={}) {
    const page = params.page || 1;
    const perPage = params.per_page || 15;
    const offset = (page - 1) * perPage;

    const where = [];
    const values = [];

    if ( params.q ) {
      values.push(`%${params.q}%`);
      where.push(`d.label ILIKE $${values.length}`);
    }

    if ( params.active_only ) {
      values.push(false);
      where.push(`d.is_archived = $${values.length}`);
    }

    if ( params.form ) {
      values.push(params.form);
      where.push(`EXISTS (
        SELECT 1 FROM ${config.db.tables.dashboardToForm} dtf
        JOIN ${config.db.tables.form} f ON f.form_id = dtf.form_id
        WHERE dtf.dashboard_id = d.dashboard_id
          AND (f.name = $${values.length} OR f.form_id = try_cast_uuid($${values.length}))
      )`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT d.*, COUNT(*) OVER() AS total_count
      FROM ${config.db.tables.dashboard} d
      ${whereSQL}
      ORDER BY d.label ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const r = await pgClient.query(sql, [...values, perPage, offset]);
    if ( r.error ) {
      return r;
    }
    const total_count = r.res.rows.length > 0 ? parseInt(r.res.rows[0].total_count) : 0;
    const results = r.res.rows.map(row => {
      delete row.total_count;
      return row;
    });
    return { res: {
      results,
      offset,
      per_page: perPage,
      page,
      max_page: Math.ceil(total_count / perPage),
      total_count
    }};
  }

  /**
   * @description Get a dashboard by ID or name (includes associated forms)
   * @param {String} idOrName - The dashboard ID or name
   * @param {Object} opts - Options object
   * @param {Boolean} opts.errorOnMissing - If true, return an error if the dashboard is not found
   * @returns {Object} {res: dashboard} or {error}
   */
  async get(idOrName, opts={}) {
    const sql = `
      SELECT * FROM ${config.db.views.dashboardFull}
      WHERE dashboard_id = get_dashboard_id($1)
    `;
    const r = await pgClient.query(sql, [idOrName]);
    const missing = r.error?.code === 'P4040';

    if ( missing && opts.errorOnMissing ) {
      return r;
    } else if ( r.error && !missing ) {
      return r;
    }
    return { res: missing ? null : r.res?.rows?.[0] || null };
  }

  /**
   * @description Get a simple list of all dashboards
   * @param {Object} params - Query parameters
   * @param {Boolean} params.active_only - If true, only return non-archived dashboards
   * @returns {Object} {res: [{dashboard_id, name, label, is_archived}]} or {error}
   */
  async getAllDashboards(params={}) {
    const where = [];
    const values = [];

    if ( params.active_only ) {
      values.push(false);
      where.push(`is_archived = $${values.length}`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT dashboard_id, name, label, is_archived
      FROM ${config.db.tables.dashboard}
      ${whereSQL}
      ORDER BY label ASC
    `;
    const r = await pgClient.query(sql, values);
    if ( r.error ) {
      return r;
    }
    return { res: r.res.rows };
  }

  /**
   * @description Create a new dashboard and optionally associate it with forms
   * @param {Object} data - Dashboard data. May include form_ids array for associations.
   * @returns {Object} {res: {dashboard_id, name}} or {error}
   */
  async create(data) {
    const formIds = data.form_ids || [];
    delete data.form_ids;

    const client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForInsert(data);
      const sql = `INSERT INTO ${config.db.tables.dashboard} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING dashboard_id, name;`;
      const result = await client.query(sql, d.values);
      const { dashboard_id, name } = result.rows[0];

      if ( formIds.length ) {
        await this._replaceFormAssociations(client, dashboard_id, formIds);
      }

      await client.query('COMMIT');
      return { res: { dashboard_id, name } };
    } catch (error) {
      await client.query('ROLLBACK');
      return { error };
    } finally {
      client.release();
    }
  }

  /**
   * @description Update fields on an existing dashboard and optionally replace form associations
   * @param {String} idOrName - The dashboard ID or name
   * @param {Object} data - Fields to update. May include form_ids array.
   * @returns {Object} {res: {dashboard_id, name}} or {error}
   */
  async patch(idOrName, data) {
    if ( !idOrName ) {
      if ( data.dashboard_id || data.name ) {
        idOrName = data.dashboard_id || data.name;
      } else {
        return { error: new Error('No dashboard identifier provided for patch operation') };
      }
    }

    const formIds = Object.prototype.hasOwnProperty.call(data, 'form_ids') ? data.form_ids : undefined;
    delete data.form_ids;
    delete data.dashboard_id;
    delete data.name;

    const client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForUpdate(data);
      const sql = `UPDATE ${config.db.tables.dashboard} SET ${d.sql} WHERE dashboard_id = get_dashboard_id($${d.values.length + 1}) RETURNING dashboard_id, name;`;
      const result = await client.query(sql, [...d.values, idOrName]);
      const { dashboard_id, name } = result.rows[0];

      if ( formIds !== undefined ) {
        await this._replaceFormAssociations(client, dashboard_id, formIds);
      }

      await client.query('COMMIT');
      return { res: { dashboard_id, name } };
    } catch (error) {
      await client.query('ROLLBACK');
      return { error };
    } finally {
      client.release();
    }
  }

  /**
   * @description Delete a dashboard by ID or name
   * @param {String} idOrName - The dashboard ID or name
   * @returns {Object} {res: {dashboard_id, name}} or {error}
   */
  async delete(idOrName) {
    const sql = `DELETE FROM ${config.db.tables.dashboard} WHERE dashboard_id = get_dashboard_id($1) RETURNING dashboard_id, name;`;
    const r = await pgClient.query(sql, [idOrName]);
    if ( r.error ) {
      return r;
    }
    return { res: r.res.rows[0] || null };
  }

  /**
   * @description Replace all form associations for a dashboard within an existing transaction
   * @param {Object} client - Active pg client in a transaction
   * @param {String} dashboardId - The dashboard UUID
   * @param {String[]} formIds - Array of form UUIDs to associate
   */
  async _replaceFormAssociations(client, dashboardId, formIds) {
    await client.query(
      `DELETE FROM ${config.db.tables.dashboardToForm} WHERE dashboard_id = $1`,
      [dashboardId]
    );
    for ( const formId of formIds ) {
      await client.query(
        `INSERT INTO ${config.db.tables.dashboardToForm} (dashboard_id, form_id) VALUES ($1, $2)`,
        [dashboardId, formId]
      );
    }
  }

}

export default new Dashboard();
