import pgClient from '../pgClient.js';

/**
 * @description Model for accessing the cache table
 */
class Cache {

  /**
   * @description Set a cache value
   * @param {String} type - Arbitrary cache category type, e.g. 'accessToken'
   * @param {String} query - Identifier for cache value of a category, e.g. 'user:1234'
   * @param {*} data - Data to cache - must be JSON serializable
   * @param {Number} lru - If set, cache will be limited to this number of entries and oldest entries will be deleted
   * @returns {Object} {res, error}
   */
  async set(type, query, data, lru){
    const client = await pgClient.pool.connect();
    const out = pgClient.output();
    let sql;
    try {
      await client.query('BEGIN');

      // get currect cache values
      sql = `
        SELECT * FROM cache
        WHERE type = $1 AND query = $2
        ORDER BY created DESC
      `;
      const getRes = await client.query(sql, [type, query]);

      // existing value found, update
      if ( !lru && getRes.rowCount > 0 ) {
        sql = `
          UPDATE cache
          SET data = $1, created = NOW()
          WHERE type = $2 AND query = $3
        `;
        await client.query(sql, [data, type, query]);

      // no existing value, insert new
      } else if( !lru && !getRes.rowCount ) {
        await this._insert(client, type, query, data);

      // lru set and cache is full, delete oldest and insert new
      } else if ( lru && getRes.rowCount >= lru ) {
        const createdThreshold = getRes.rows[lru - 1].created;
        createdThreshold.setSeconds(createdThreshold.getSeconds() + 1);
        sql = `
          DELETE FROM cache
          WHERE type = $1 AND created <= $2
        `;
        await client.query(sql, [type, createdThreshold]);
        await this._insert(client, type, query, data);

      // lru set and cache is not full, insert new
      } else {
        await this._insert(client, type, query, data);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      out.error = error;
    } finally {
      client.release();
    }

    return out;
  }

  /**
   * @description Insert a new cache value
   * @param {*} client - Postgres client
   * @param {String} type - Arbitrary cache category type, e.g. 'accessToken'
   * @param {String} query - Identifier for cache value of a category, e.g. 'user:1234'
   * @param {*} data - Data to cache - must be JSON serializable
   * @returns
   */
  async _insert(client, type, query, data){
    const text = `
      INSERT INTO cache (type, query, data)
      VALUES ($1, $2, $3)
    `;
    return await client.query(text, [type, query, data]);
  }

  /**
   * @description Get a cached value
   * @param {String} type - Arbitrary cache category type, e.g. 'accessToken'
   * @param {String} query - Identifier for cache value of a category, e.g. 'user:1234'
   * @param {String} expiration - Postgres interval string, e.g. '1 hour'
   * @returns
   */
  async get(type, query, expiration){
    let text = `
      SELECT * FROM cache
      WHERE type = $1 AND query = $2
    `;
    const params = [type, query];
    if ( expiration ) {
      text += ` AND created > NOW() - INTERVAL '${expiration}'`;
    }
    text += ` ORDER BY created DESC`;
    return await pgClient.query(text, params);
  }

  /**
   * @description Delete a cached value
   * @param {String} type - Arbitrary cache category type, e.g. 'accessToken'
   * @param {String} query - Identifier for cache value of a category, e.g. 'user:1234'
   * @returns
   */
  async delete(type, query){
    let text = `
      DELETE FROM cache
      WHERE type = $1 AND query = $2
    `;
    return await pgClient.query(text, [type, query]);
  }
}

export default new Cache();
