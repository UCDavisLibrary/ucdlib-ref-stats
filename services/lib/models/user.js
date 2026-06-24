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

}

export default new User();
