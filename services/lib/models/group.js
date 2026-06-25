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

}

export default new Group();
