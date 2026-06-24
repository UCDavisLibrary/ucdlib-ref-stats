import pgClient from '../pgClient.js';
import config from '../config.js';

import models from '#models';
import logger from '#lib/logger.js';

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
    this.setPastEditWindow(results);
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

      const d = pgClient.prepareObjectForInsert({ 
        form_id: formId, 
        original_form_entry_id: data.original_form_entry_id || null,
        submitted_by: data.submitted_by || null,
        impersonated_by: data.impersonated_by || null
      });
      delete data.original_form_entry_id;
      delete data.submitted_by;
      delete data.impersonated_by;
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
    this.setPastEditWindow(r.res?.rows);
    return { res: missing ? null : r.res?.rows?.[0] || null };
  }

  /**
   * @description Delete the latest version of a form entry. If opts.deleteAll is true, all versions
   * in the version chain are removed. Otherwise only the specified entry is deleted and the
   * previous version is promoted to is_latest_version = TRUE.
   * @param {String} entryId - The form_entry_id to delete (must be the latest version)
   * @param {Object} opts - Options object
   * @param {Boolean} opts.deleteAll - If true, delete all versions in the chain
   * @returns {Object} Object with form_entry_id and new_latest_id (null when deleteAll), or an error object
   */
  async deleteLatest(entryId, opts={}) {
    const client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');
      let newLatestId = null;
      if ( opts.deleteAll ) {
        const sql = `
          DELETE FROM ${config.db.tables.formEntry}
          WHERE COALESCE(original_form_entry_id, form_entry_id) = (
            SELECT COALESCE(original_form_entry_id, form_entry_id)
            FROM ${config.db.tables.formEntry} WHERE form_entry_id = $1
          )`;
        await client.query(sql, [entryId]);
      } else {
        const sql = `
          WITH deleted AS (
            DELETE FROM ${config.db.tables.formEntry}
            WHERE form_entry_id = $1 RETURNING COALESCE(original_form_entry_id, form_entry_id) AS root_id
          ),
          prev AS (
            SELECT fe.form_entry_id FROM ${config.db.tables.formEntry} fe, deleted
            WHERE COALESCE(fe.original_form_entry_id, fe.form_entry_id) = deleted.root_id
              AND fe.form_entry_id != $1
            ORDER BY fe.created_at DESC LIMIT 1
          )
          UPDATE ${config.db.tables.formEntry} SET is_latest_version = TRUE
          FROM prev WHERE ${config.db.tables.formEntry}.form_entry_id = prev.form_entry_id
          RETURNING ${config.db.tables.formEntry}.form_entry_id AS new_latest_id`;
        const r = await client.query(sql, [entryId]);
        newLatestId = r.rows?.[0]?.new_latest_id || null;
      }
      await client.query('COMMIT');
      return { res: { form_entry_id: entryId, new_latest_id: newLatestId } };
    } catch (error) {
      await client.query('ROLLBACK');
      return { error };
    } finally {
      client.release();
    }
  }

  /**
   * @description Sets the `past_edit_window` property on each form entry result based on the form's edit interval settings and the entry's created_at timestamp.
   * @param {Array} results - An array of form entry results or a single form entry result object.
   * @returns {void}
   */
  setPastEditWindow(results){
    if ( !results ) return;
    if ( !Array.isArray(results) ) {
      results = [results];
    }
    for ( const r of results ) {
      if ( r.edit_interval_unit === 'never') {
        r.past_edit_window = true;
        continue;
      }
      if ( r.edit_interval_unit === 'always'){
        r.past_edit_window = false;
        continue;
      }
      
      try {
        const submitted = Temporal.Instant.fromEpochMilliseconds(new Date(r.created_at).getTime());
        const cutoff = Temporal.Now.zonedDateTimeISO('UTC').subtract({
          [r.edit_interval_unit]: r.edit_interval_amount
        }).toInstant();
        r.past_edit_window = Temporal.Instant.compare(submitted, cutoff) < 0;


      } catch (e) {
        r.past_edit_window = true;
        logger.error('Error occurred while setting past edit window', { 
          error: e, 
          formEntryId: r.form_entry_id, 
          formName: r.form_name,
          createdAt: r.created_at,
          edit_interval_amount: r.edit_interval_amount, 
          edit_interval_unit: r.edit_interval_unit });

      }
    }
  }
}

export default new FormEntry();