import pgClient from '../pgClient.js';
import config from '../config.js';

import models from '#models';

class FormEntry {

  async create(formNameOrId, data){
    let fields = await models.field.query({form: formNameOrId , perPage: 1000});
    if ( fields.error ) {
      return fields;
    }
    fields = fields.res.results;
    if ( fields.length === 0 ) {
      return { error: new Error('No fields found for form entry creation') };
    }
    const form = fields[0].forms.find(f => f.form_id === formNameOrId || f.name === formNameOrId);
    const formId = form.form_id;

    let client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const d = pgClient.prepareObjectForInsert({ form_id: formId});
      const sql = `INSERT INTO ${config.db.tables.formEntry} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING form_entry_id;`;
      let result = await client.query(sql, d.values);
      const formEntryId = result.rows[0].form_entry_id;

      for ( const [fieldName, fieldValue] of Object.entries(data) ) {
        const field = fields.find(f => f.name === fieldName);
        if ( !field ) continue;

        let picklist_item_id = null;
        if ( field.picklist_id && fieldValue && !Array.isArray(fieldValue) ) {
          const sql = `SELECT pi.picklist_item_id FROM ${config.db.tables.picklistItem} pi
            WHERE pi.picklist_id = $1 AND pi.value = $2 LIMIT 1;`;
          const r = await client.query(sql, [field.picklist_id, fieldValue]);
          if ( r.rows.length > 0 ) {
            picklist_item_id = r.rows[0].picklist_item_id;
          } else {
            throw new Error(`Invalid picklist value for field ${field.name}: ${fieldValue}`);
          }
        }


        const fieldData = pgClient.prepareObjectForInsert({
          form_entry_id: formEntryId,
          form_field_id: field.form_field_id,
          value: String(fieldValue),
          value_json: JSON.stringify(fieldValue),
          picklist_item_id
        });
        const fieldSql = `INSERT INTO ${config.db.tables.formEntryFieldValue} (${fieldData.keysString}) VALUES (${fieldData.placeholdersString});`;
        await client.query(fieldSql, fieldData.values);
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
}

export default new FormEntry();