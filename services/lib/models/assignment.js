import pgClient from '../pgClient.js';
import config from '../config.js';

class Assignment {

  /**
   * @description Get a field-to-form assignment
   * @param {String} fieldId - The form field ID or name
   * @param {String} formId - The form ID or name
   * @param {Object} opts - Options object
   * @param {Boolean} opts.errorOnMissing - If true, return an error if the assignment is not found. Otherwise {res} will be null.
   * @returns {Object} The assignment row or null, or an error object
   */
  async get(fieldId, formId, opts = {}) {
    const sql = `SELECT * FROM ${config.db.tables.assignment}
      WHERE form_field_id = get_form_field_id($1)
      AND form_id = get_form_id($2)
      `;
    const r = await pgClient.query(sql, [fieldId, formId]);
    const missing = r.error?.code === 'P4040';

    if ( missing && opts.errorOnMissing ){
      return r;
    } else if ( r.error && !missing ) {
      return r;
    }
    return { res: missing ? null : r.res?.rows?.[0] || null };
  }

  /**
   * @description Assign a field to a form, appending it at the end of the sort order
   * @param {String} fieldId - The form field ID or name
   * @param {String} formId - The form ID or name
   * @returns {Object} The new assignment's form_field_id, form_id, and form_field_assignment_id, or an error object
   */
  async create(fieldId, formId){
    let client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const sql = `
        INSERT INTO ${config.db.tables.assignment} (form_field_id, form_id, sort_order)
        VALUES (
          get_form_field_id($1),
          get_form_id($2),
          (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM ${config.db.tables.assignment} WHERE form_id = get_form_id($2))
        )
        RETURNING form_field_id, form_id, form_field_assignment_id;`;
      let result = await client.query(sql, [fieldId, formId]);

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
   * @description Update an existing field-to-form assignment
   * @param {String} fieldId - The form field ID or name
   * @param {String} formId - The form ID or name
   * @param {Object} data - Fields to update on the assignment (e.g. sort_order)
   * @returns {Object} The updated assignment's form_field_id, form_id, and form_field_assignment_id, or an error object
   */
  async patch(fieldId, formId, data){
    const client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForUpdate(data);
      const sql = `UPDATE ${config.db.tables.assignment} SET ${d.sql} WHERE form_field_id = get_form_field_id($${d.values.length + 1}) AND form_id = get_form_id($${d.values.length + 2}) RETURNING form_field_id, form_id, form_field_assignment_id;`;
      let result = await client.query(sql, [...d.values, fieldId, formId]);

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
   * @description Checks that all given group IDs exist in the groups table.
   * @param {Array} groupIds - Array of integer group IDs to validate
   * @returns {Object} {res: true} if all exist, {res: false} if any are missing, or {error}
   */
  async groupsExist(groupIds) {
    if (!groupIds?.length) return { res: true };
    const sql = `SELECT COUNT(*)::int AS count FROM groups WHERE group_id = ANY($1::int[])`;
    const r = await pgClient.query(sql, [groupIds]);
    if (r.error) return r;
    return { res: r.res.rows[0].count === groupIds.length };
  }

  /**
   * @description Remove a field from a form
   * @param {String} fieldId - The form field ID or name
   * @param {String} formId - The form ID or name
   * @returns {Object} The deleted assignment's form_field_id, form_id, and form_field_assignment_id, or an error object
   */
  async delete(fieldId, formId){
    const sql = `DELETE FROM ${config.db.tables.assignment}
      WHERE form_field_id = get_form_field_id($1)
      AND form_id = get_form_id($2)
      RETURNING form_field_id, form_id, form_field_assignment_id;`;
    const r = await pgClient.query(sql, [fieldId, formId]);
    if ( r.error ) {
      return r;
    }
    return { res: r.res?.rows?.[0] || null };
  }
}

export default new Assignment();