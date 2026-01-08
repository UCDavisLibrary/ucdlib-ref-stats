import pgClient from '../pgClient.js';
import config from '../config.js';

class Picklist {

  async query(params={}){
    const page = params.page || 1;
    const perPage = params.per_page || 15;
    const offset = (page - 1) * perPage;
    
    const where = [];
    const values = [];

    if ( params.active_only ) {
      values.push(false);
      where.push(`is_archived = $${values.length}`);
    } else if ( params.archived_only ) {
      values.push(true);
      where.push(`is_archived = $${values.length}`);
    }

    if ( params.q ) {
      values.push(`%${params.q}%`);
      where.push(`label ILIKE $${values.length}`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT *, COUNT(*) OVER() as total_count FROM ${config.db.tables.picklist}
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
   * @description Get a picklist by ID or name
   * @param {String} idOrName - The picklist ID or name
   * @param {Object} opts - Options object
   * @param {Boolean} opts.errorOnMissing - If true, return an error if the picklist is not found. Otherwise {res} will be null.
   * @returns 
   */
  async get(idOrName, opts={}){
    const sql = `
      SELECT * FROM ${config.db.views.picklistWithItems}
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
      await client.query('BEGIN');
      const items = data.items;
      delete data.items;

      const d = pgClient.prepareObjectForInsert(data);
      const sql = `INSERT INTO ${config.db.tables.picklist} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING picklist_id, name;`;
      let result = await client.query(sql, d.values);
      const picklistId = result.rows[0].picklist_id;

      if ( items?.length ) {
        for ( let i = 0; i < items.length; i++ ) {
          const item = items[i];
          const itemData = {
            ...item,
            picklist_id: picklistId,
            sort_order: item.sort_order || i
          };
          const itemD = pgClient.prepareObjectForInsert(itemData);
          const itemSql = `INSERT INTO ${config.db.tables.picklistItem} (${itemD.keysString}) VALUES (${itemD.placeholdersString});`;
          await client.query(itemSql, itemD.values);
        }
      }

      await client.query('COMMIT');
      return { res: result.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        return { error };
    } finally {
      client.release();
    }
  }

  async patch(idOrName, data){
    const client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');
      const items = Array.isArray(data.items) ? data.items : [];
      delete data.items;

      const d = pgClient.prepareObjectForUpdate(data);
      const sql = `UPDATE ${config.db.tables.picklist} SET ${d.sql} WHERE picklist_id = get_picklist_id($${d.values.length + 1}) RETURNING picklist_id, name;`;
      let result = await client.query(sql, [...d.values, idOrName]);
      const picklistId = result.rows[0].picklist_id;

      for ( const item of items ) {
        if ( item.picklist_item_id ) {
          // existing item
          const itemData = { ...item };
          delete itemData.picklist_item_id;
          const itemD = pgClient.prepareObjectForUpdate(itemData, { preserveArrays: true });
          const itemSql = `UPDATE ${config.db.tables.picklistItem} SET ${itemD.sql} WHERE picklist_item_id = $${itemD.values.length + 1};`;
          await client.query(itemSql, [...itemD.values, item.picklist_item_id]);
        } else {
          // new item
          const itemData = {
            ...item,
            picklist_id: picklistId
          };
          const itemD = pgClient.prepareObjectForInsert(itemData);
          const itemSql = `INSERT INTO ${config.db.tables.picklistItem} (${itemD.keysString}) VALUES (${itemD.placeholdersString});`;
          await client.query(itemSql, itemD.values);
        }
      }

      await client.query('COMMIT');
      return { res: result.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        return { error };
    } finally {
      client.release();
    }
  }

  async delete(idOrName){
    const sql = `DELETE FROM ${config.db.tables.picklist} WHERE picklist_id = get_picklist_id($1) RETURNING picklist_id, name;`;
    const r = await pgClient.query(sql, [idOrName]);
    if ( r.error ) {
      return r;
    }
    return { res: r.res.rows[0] || null };
  }
}

export default new Picklist();