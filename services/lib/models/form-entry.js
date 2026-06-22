import pgClient from '../pgClient.js';
import config from '../config.js';

import models from '#models';

class FormEntry {

  /**
   * @description Query form entries with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {Number} params.page - Page number
   * @param {Number} params.per_page - Number of results per page
   * @param {Boolean} params.is_latest_version - If true, only return the latest version of each entry
   * @param {String|String[]} params.form - Filter by form ID or name
   * @param {String} params.orderByField - Field name to order by; prefix with '-' for DESC or '+' for ASC
   * @returns {Object} Paginated results object or an error object
   */
  async query(params={}){
    const page = params.page || 1;
    const perPage = params.per_page || 15;
    const offset = (page - 1) * perPage;

    let orderByField;
    if ( params.orderByField ) {
      orderByField = params.orderByField;
      if ( orderByField.startsWith('-')){
        orderByField = `'${orderByField.slice(1)}' DESC`;
      } else if ( orderByField.startsWith('+') ) {
        orderByField = `'${orderByField.slice(1)}' ASC`;
      } else {
        orderByField = `'${orderByField}' ASC`;
      }
    }
    
    const where = [];
    const values = [];

    if ( params.is_latest_version ) {
      values.push(true);
      where.push(`is_latest_version = $${values.length}`);
    } 

    if ( params.form ){
      values.push(params.form);
      where.push(`form_id IN (SELECT get_form_id(fid) FROM unnest($${values.length}::text[]) AS fid)`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT *, COUNT(*) OVER() as total_count FROM ${config.db.views.formEntryFull} fe
      ${whereSQL}
      ${ orderByField ? 
        `ORDER BY fields->>${orderByField} NULLS LAST` : 
        `ORDER BY created_at DESC NULLS LAST`}
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
   * @description Create a new form entry and its associated field values
   * @param {String} formNameOrId - The form ID or name the entry belongs to
   * @param {Object} data - Key/value pairs of field names to field values
   * @param {String} [data.original_form_entry_id] - ID of the original entry if this is a revision
   * @returns {Object} The new entry's form_entry_id, or an error object
   */
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

      const d = pgClient.prepareObjectForInsert({ form_id: formId, original_form_entry_id: data.original_form_entry_id || null });
      delete data.original_form_entry_id;
      const sql = `INSERT INTO ${config.db.tables.formEntry} (${d.keysString}) VALUES (${d.placeholdersString}) RETURNING form_entry_id;`;
      const result = await client.query(sql, d.values);
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

  /**
   * @description Get a form entry by ID, optionally scoped to a specific form
   * @param {String} formEntryId - The form entry UUID
   * @param {String} [formNameOrId] - Optional form ID or name to scope the lookup
   * @param {Object} opts - Options object
   * @param {Boolean} opts.errorOnMissing - If true, return an error if the entry is not found. Otherwise {res} will be null.
   * @returns {Object} The form entry row or null, or an error object
   */
  async get(formEntryId, formNameOrId = null, opts={}){
    const params = [formEntryId];
    const sql = `
      SELECT * FROM ${config.db.views.formEntryFull} fe
      WHERE fe.form_entry_id = try_cast_uuid($1)
      ${ formNameOrId ? `AND fe.form_id = get_form_id($2)` : '' }
      `;
    if ( formNameOrId ) {
      params.push(formNameOrId);
    }
    const r = await pgClient.query(sql, params);
    const missing = r.error?.code === 'P4040';

    if ( missing && opts.errorOnMissing ){
      return r;
    } else if ( r.error && !missing ) {
      return r;
    }
    return { res: missing ? null : r.res?.rows?.[0] || null };
  }
}

export default new FormEntry();