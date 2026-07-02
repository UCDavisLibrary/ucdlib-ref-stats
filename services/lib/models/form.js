import pgClient from '../pgClient.js';
import config from '../config.js';

class Form {

  /**
   * @description Query forms with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {Number} params.page - Page number
   * @param {Number} params.per_page - Number of results per page
   * @param {String} params.q - Search string to filter forms by label
   * @returns {Object} Paginated results object or an error object
   */
  async query(params={}){
    const page = params.page || 1;
    const perPage = params.per_page || 15;
    const offset = (page - 1) * perPage;
    
    const where = [];
    const values = [];

    if ( params.q ) {
      values.push(`%${params.q}%`);
      where.push(`label ILIKE $${values.length}`);
    }

    if ( params.name ) {
      let name = (Array.isArray(params.name) ? params.name : params.name.split(','))
        .map(n => n.trim())
        .filter(n => n.length > 0)
        .map(n => n.toLowerCase());
      if ( name.length ) {
        values.push(name);
        where.push(`LOWER(name) = ANY($${values.length})`);
      }
    }

    if ( params.active_only ) {
      values.push(false);
      where.push(`is_archived = $${values.length}`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT *, COUNT(*) OVER() as total_count FROM ${config.db.tables.form} f
      ${whereSQL}
      ORDER BY label ASC
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
   * @description Get a form field by ID or name
   * @param {String} idOrName - The form field ID or name
   * @param {Object} opts - Options object
   * @param {Boolean} opts.errorOnMissing - If true, return an error if the form field is not found. Otherwise {res} will be null.
   * @returns 
   */
  async get(idOrName, opts={}){
    const sql = `
      SELECT * FROM ${config.db.tables.form}
      WHERE form_id = get_form_id($1)
      `;
    const r = await pgClient.query(sql, [idOrName]);
    const missing = r.error?.code === 'P4040';

    if ( missing && opts.errorOnMissing ){
      return r;
    } else if ( r.error && !missing ) {
      return r;
    }
    return { res: missing ? null : r.res?.rows?.[0] || null };
  }

  /**
   * @description Get a simple list of all forms
   * @param {Object} params - Query parameters
   * @param {Boolean} params.active_only - If true, only return forms that are not archived
   * @returns {Object} {res: [{form_id, name, label, is_archived}]} or {error}
   */
  async getAllForms(params={}){
    const where = [];
    const values = [];

    if ( params.active_only ) {
      values.push(false);
      where.push(`is_archived = $${values.length}`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
    SELECT form_id, name, label, is_archived
    FROM ${config.db.tables.form}
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
   * @description Create a new form
   * @param {Object} data - Form data to insert
   * @returns {Object} The new form's form_id and name, or an error object
   */
  async create(data){
    let client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForInsert(data);
      const sql = `INSERT INTO ${config.db.tables.form} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING form_id, name;`;
      let result = await client.query(sql, d.values);

      await client.query('COMMIT');
      return { res: result.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        return { error };
    } finally {
      client.release();
    }
  }

  /**
   * @description Update fields on an existing form
   * @param {String} idOrName - The form ID or name; may be omitted if present in data
   * @param {Object} data - Fields to update (form_id and name are stripped before update)
   * @returns {Object} The updated form's form_id and name, or an error object
   */
  async patch(idOrName, data){
    if ( !idOrName ) {
      if ( data.form_id || data.name ) {
        idOrName = data.form_id || data.name;
      } else {
        return { error: new Error('No form identifier provided for patch operation') };
      }
    }
    const client = await pgClient.pool.connect();
    delete data.form_id;
    delete data.name;
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForUpdate(data);
      const sql = `UPDATE ${config.db.tables.form} SET ${d.sql} WHERE form_id = get_form_id($${d.values.length + 1}) RETURNING form_id, name;`;
      let result = await client.query(sql, [...d.values, idOrName]);

      await client.query('COMMIT');
      return { res: result.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        return { error };
    } finally {
      client.release();
    }
  }

  /**
   * @description Delete a form by ID or name
   * @param {String} idOrName - The form ID or name
   * @returns {Object} The deleted form's form_id and name, or an error object
   */
  async delete(idOrName){
    const sql = `DELETE FROM ${config.db.tables.form} WHERE form_id = get_form_id($1) RETURNING form_id, name;`;
    const r = await pgClient.query(sql, [idOrName]);
    if ( r.error ) {
      return r;
    }
    return { res: r.res.rows[0] || null };
  }

}

export default new Form();