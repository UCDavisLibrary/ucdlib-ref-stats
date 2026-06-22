import pgClient from '../pgClient.js';
import config from '../config.js';

class Field {

  /**
   * @description Query form fields with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {Number} params.page - Page number
   * @param {Number} params.per_page - Number of results per page
   * @param {String} params.q - Search string to filter fields by label
   * @param {Boolean} params.active_only - If true, exclude archived fields
   * @param {Boolean} params.archived_only - If true, return only archived fields
   * @param {String} params.form - Filter to fields assigned to this form ID or name
   * @param {String} params['-form'] - Filter to fields NOT assigned to this form ID or name
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

    if ( params.active_only ) {
      values.push(false);
      where.push(`is_archived = $${values.length}`);
    } else if ( params.archived_only ) {
      values.push(true);
      where.push(`is_archived = $${values.length}`);
    }

    if ( params.form ){
      values.push(params.form);
      where.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(fff.forms) AS form_obj WHERE form_obj->>'form_id' = $${values.length} OR form_obj->>'name' = $${values.length})`);
    }

    if ( params['-form'] ){
      values.push(params['-form']);
      where.push(`NOT EXISTS (SELECT 1 FROM jsonb_array_elements(fff.forms) AS form_obj WHERE form_obj->>'form_id' = $${values.length} OR form_obj->>'name' = $${values.length})`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT *, COUNT(*) OVER() as total_count FROM ${config.db.views.fieldFull} fff
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
      SELECT * FROM ${config.db.views.fieldFull}
      WHERE form_field_id = get_form_field_id($1)
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
   * @description Create a new form field
   * @param {Object} data - Field data to insert
   * @returns {Object} The new field's form_field_id and name, or an error object
   */
  async create(data){
    let client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForInsert(data);
      const sql = `INSERT INTO ${config.db.tables.field} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING form_field_id, name;`;
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
   * @description Update fields on an existing form field
   * @param {String} idOrName - The field ID or name; may be omitted if present in data
   * @param {Object} data - Fields to update (form_field_id and name are stripped before update)
   * @returns {Object} The updated field's form_field_id and name, or an error object
   */
  async patch(idOrName, data){
    if ( !idOrName ) {
      if ( data.form_field_id || data.name ) {
        idOrName = data.form_field_id || data.name;
      } else {
        return { error: new Error('No form field identifier provided for patch operation') };
      }
    }
    const client = await pgClient.pool.connect();
    delete data.form_field_id;
    delete data.name;
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForUpdate(data);
      const sql = `UPDATE ${config.db.tables.field} SET ${d.sql} WHERE form_field_id = get_form_field_id($${d.values.length + 1}) RETURNING form_field_id, name;`;
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
   * @description Delete a form field by ID or name
   * @param {String} idOrName - The field ID or name
   * @returns {Object} The deleted field's form_field_id and name, or an error object
   */
  async delete(idOrName){
    const sql = `DELETE FROM ${config.db.tables.field} WHERE form_field_id = get_form_field_id($1) RETURNING form_field_id, name;`;
    const r = await pgClient.query(sql, [idOrName]);
    if ( r.error ) {
      return r;
    }
    return { res: r.res.rows[0] || null };
  }

  /**
   * @description Check whether all given picklist values exist for a field's associated picklist
   * @param {String} fieldIdOrName - The field ID or name
   * @param {String|String[]} picklistItemValues - One or more picklist item values to check
   * @returns {Object} {res: true} if all values exist, {res: false} if any are missing, or an error object
   */
  async picklistItemsExist(fieldIdOrName, picklistItemValues = []) {
  if (typeof picklistItemValues === 'string') {
    picklistItemValues = [picklistItemValues];
  }

  if (!picklistItemValues.length) {
    return { res: false }; 
  }

  const sql = `
    SELECT COUNT(DISTINCT pi.value) AS match_count
    FROM ${config.db.tables.picklistItem} pi
    JOIN ${config.db.tables.field} f ON f.picklist_id = pi.picklist_id
    WHERE f.form_field_id = get_form_field_id($1)
    AND pi.value = ANY($2::text[]);
  `;

  const r = await pgClient.query(sql, [fieldIdOrName, picklistItemValues]);

  if (r.error) {
    return r;
  }

  const matchCount = Number(r.res.rows[0]?.match_count || 0);

  return { res: matchCount === picklistItemValues.length };
}


}

export default new Field();