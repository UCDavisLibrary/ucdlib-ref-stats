import pgClient from '../pgClient.js';
import config from '../config.js';

class Picklist {

  /**
   * @description Get a picklist by ID or name
   * @param {String} idOrName - The picklist ID or name
   * @param {Object} opts - Options object
   * @param {Boolean} opts.errorOnMissing - If true, return an error if the picklist is not found. Otherwise {res} will be null.
   * @returns 
   */
  async get(idOrName, opts={}){
    const sql = `
      SELECT * FROM ${config.db.tables.picklist}
      WHERE picklist_id = get_picklist_id($1)
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

  async create(data){
    const client = await pgClient.pool.connect();
    try {
      const d = pgClient.prepareObjectForInsert(data);
      const sql = `INSERT INTO ${config.db.tables.picklist} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING picklist_id`;
      let result = await client.query(sql, d.values);
      let picklist_id = result.rows[0].picklist_id;

      await client.query('COMMIT');
      return { res: { picklist_id } };
    } catch (error) {
        await client.query('ROLLBACK');
        return { error };
    } finally {
      client.release();
    }
  }
}

export default new Picklist();