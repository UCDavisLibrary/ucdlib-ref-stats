import pgClient from '../pgClient.js';
import config from '../config.js';

class User {

  /**
   * @description Upsert a user record based on their OIDC token data.
   * Inserts on first login; updates name, email, and last_login on subsequent logins.
   * @param {Object} data - User data from the access token
   * @param {String} data.userId - Unique user identifier (preferred_username / Kerberos ID)
   * @param {String} data.firstName - User's first name
   * @param {String} data.lastName - User's last name
   * @param {String} data.email - User's email address
   * @returns {Object} Object with the user_id on success, or an error object
   */
  async upsert(data) {
    const sql = `
      INSERT INTO ${config.db.tables.users} (user_id, first_name, last_name, email, last_login)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name  = EXCLUDED.last_name,
        email      = EXCLUDED.email,
        last_login = NOW()
      RETURNING user_id`;
    const r = await pgClient.query(sql, [data.userId, data.firstName, data.lastName, data.email]);
    if ( r.error ) return r;
    return { res: r.res.rows[0] };
  }

  /**
   * @description Returns a deduplicated list of users who have submitted form entries,
   * optionally filtered by form and/or group. Results are ordered by last_name, first_name.
   * @param {String|String[]|null} form - Form name, ID, or array thereof. Null returns all forms.
   * @param {Number|String|Array|null} group - Group ID(s) to filter by. Strings are coerced to ints. Null returns all groups.
   * @returns {Object} {res: [{user_id, first_name, last_name}]} or {error}
   */
  async getFormSubmitters(form, group) {
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
      SELECT DISTINCT u.user_id, u.first_name, u.last_name
      FROM ${config.db.tables.formEntry} fe
      JOIN ${config.db.tables.users} u ON u.user_id = fe.submitted_by
      ${whereSQL}
      ORDER BY u.last_name, u.first_name
    `;

    const r = await pgClient.query(sql, values);
    if ( r.error ) return r;
    return { res: r.res.rows };
  }

}

export default new User();
