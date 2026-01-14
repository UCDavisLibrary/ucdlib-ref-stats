import pgClient from '../pgClient.js';
import config from '../config.js';

class Assignment {

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

  async create(fieldId, formId){
    let client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const sql = `INSERT INTO ${config.db.tables.assignment} (form_field_id, form_id) VALUES (get_form_field_id($1), get_form_id($2)) RETURNING form_field_id, form_id, form_field_assignment_id;`;
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