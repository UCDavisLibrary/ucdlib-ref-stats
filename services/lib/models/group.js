import pgClient from '../pgClient.js';
import config from '../config.js';

class Group {

  /**
   * @description Upsert a group record based on its ID and name.
   * Inserts on first call; updates name on subsequent calls.
   * @param {Object} data - Group data
   * @param {String} data.groupId - Unique group identifier
   * @param {String} data.name - Group name
   * @returns {Object} Object with the group_id on success, or an error object
   */
  async upsert(data) {
    const sql = `
      INSERT INTO ${config.db.tables.groups} (group_id, name)
      VALUES ($1, $2)
      ON CONFLICT (group_id) DO UPDATE SET
        name = EXCLUDED.name
      RETURNING group_id`;
    const r = await pgClient.query(sql, [data.groupId, data.name]);
    if ( r.error ) return r;
    return { res: r.res.rows[0] };
  }

  /**
   * @description Returns a deduplicated list of groups that appear in form entries,
   * optionally filtered by form and/or group. Results are ordered by name.
   * @param {String|String[]|null} form - Form name, ID, or array thereof. Null returns all forms.
   * @param {Number|String|Array|null} group - Group ID(s) to filter by. Strings are coerced to ints. Null returns all groups.
   * @returns {Object} {res: [{group_id, name}]} or {error}
   */
  async getFormGroups(form, group) {
    const where = [];
    const values = [];

    if ( form != null ) {
      const forms = Array.isArray(form) ? form : [form];
      if ( forms.length ) {
        values.push(forms);
        where.push(`fe.form_id IN (SELECT get_form_id(fid) FROM unnest($${values.length}::text[]) AS fid)`);
      }
    }

    if ( group != null ) {
      const groups = (Array.isArray(group) ? group : [group]).map(Number);
      if ( groups.length ) {
        values.push(groups);
        where.push(`fe.group_id = ANY($${values.length}::int[])`);
      }
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT DISTINCT g.group_id, g.name
      FROM ${config.db.tables.formEntry} fe
      JOIN ${config.db.tables.groups} g ON g.group_id = fe.group_id
      ${whereSQL}
      ORDER BY g.name
    `;

    const r = await pgClient.query(sql, values);
    if ( r.error ) return r;
    return { res: r.res.rows };
  }

}

export default new Group();
