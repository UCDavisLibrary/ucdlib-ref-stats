import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema, formatErrorResponse, buildDynamicFormEntrySchema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';
import protect from '../utils/protect.js';

const router = Router();

router.get('/', validate(schema.formEntry.query, {reqParts: ['query']}), async (req, res) => {
  
  try {
    logger.info('Form entry query validated', req.context.logSignal);

    const token = req.auth.token;
    const userData = await models.libraryIam.getUserById(token.id);
    if ( userData.error ) {
      logger.error('Unable to get user data from Library IAM. Cannot test group access.', req.context.logSignal, { error: userData.error });
    }
    const headOfGroupIds = (userData.res?.groups || []).filter(g => g.isHead).map(g => g.id);

    if ( req.payload.submitted_by ){
      req.payload.submitted_by = req.payload.submitted_by.split(',').map(s => s.trim()).filter(s => s);
    }
    if ( req.payload.group_id ){
      req.payload.group_id = req.payload.group_id.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
    }

    // restrict query based on user access
    if ( req.payload.mine ) {
      req.payload.submitted_by = token.id;
    } else if ( token.hasManagerAccess ) {
      // no filter - manager access can see all entries
    } else if ( headOfGroupIds.length > 0 ) {
      const allGroupIds = await models.libraryIam.addChildGroupIds(headOfGroupIds);
      if ( !req.payload.group_id ){
        req.payload.group_id = allGroupIds;
      } else {
        for ( const groupId of req.payload.group_id ){
          if ( !allGroupIds.includes(groupId) ){
            return res.status(403).json({ message: 'You do not have permission to query this group.' });
          }
        }
      }
    } else {
      req.payload.submitted_by = token.id;
    }

    if ( req.payload.form ) {
      req.payload.form = req.payload.form.split(',').map(f => f.trim());
    }

    // extract field filters from passthrough query params
    const filterableFields = await models.field.getFilters(req.payload.form || null);
    if ( filterableFields.error ) throw filterableFields.error;

    const fieldFilters = [];
    for ( const f of filterableFields.res ) {
      const entry = { field_name: f.name, field_type: f.field_type };

      if ( ['date','datetime'].includes(f.field_type) ) {
        entry.after  = req.payload[`${f.name}_after`]  || null;
        entry.before = req.payload[`${f.name}_before`] || null;
        delete req.payload[`${f.name}_after`];
        delete req.payload[`${f.name}_before`];
        if ( entry.after || entry.before ) fieldFilters.push(entry);
      } else if ( ['select','radio','typeahead','checkbox-multiple'].includes(f.field_type) ) {
        const raw = req.payload[f.name];
        delete req.payload[f.name];
        if ( raw ) {
          entry.values = String(raw).split(',').map(v => v.trim()).filter(Boolean);
          if ( entry.values.length ) fieldFilters.push(entry);
        }
      }
    }
    if ( fieldFilters.length ) req.payload.field_filters = fieldFilters;

    const r = await models.formEntry.query(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Form entry query successful',  req.context.logSignal, {resultCount: r.res.total_count});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/filters', validate(schema.formEntry.filter, {reqParts: ['query']}), async (req, res) => {

  try {
    logger.info('Form entry filter validated', req.context.logSignal);

    const token = req.auth.token;
    const userData = await models.libraryIam.getUserById(token.id);
    if ( userData.error ) {
      logger.error('Unable to get user data from Library IAM. Cannot test group access.', req.context.logSignal, { error: userData.error });
    }
    const headOfGroupIds = (userData.res?.groups || []).filter(g => g.isHead).map(g => g.id);
    const allGroupIds = await models.libraryIam.addChildGroupIds(headOfGroupIds);


    if ( req.payload.form ) {
      req.payload.form = req.payload.form.split(',').map(f => f.trim()).filter(f => f);
    }

    const out = {
      submitted_by: { label: 'Submitted By', options: [], multiple: true, type: 'select' },
      group_id: { label: 'Group', options: [], multiple: true, type: 'select' },
      form: { label: 'Form', options: [], multiple: true, type: 'select' },
      submitted_after: { label: 'Submitted After', type: 'date' },
      submitted_before: { label: 'Submitted Before', type: 'date' }
    };

    // advanced access filters
    if ( allGroupIds.length || token.hasManagerAccess ) {
      const submitters = await models.user.getFormSubmitters(req.payload.form, allGroupIds);
      if ( submitters.error ) throw submitters.error;
      out.submitted_by.options = submitters.res.map(u => ({ value: u.user_id, label: `${u.first_name} ${u.last_name}`.trim() || u.user_id }));

      const groups = await models.group.getFormGroups(req.payload.form, allGroupIds);
      if ( groups.error ) throw groups.error;
      out.group_id.options = groups.res.map(g => ({ value: g.group_id, label: g.name }));
    }

    // populate form filter options if requested
    if ( req.payload.form_filter ){
      const formOptions = await models.form.getAllForms();
      if ( formOptions.error ) throw formOptions.error;
      out.form.options = formOptions.res.map(f => ({ value: f.name, label: f.label, id: f.form_id }));
    }

    // populate form field filters for the requested form(s)
    const filterableFields = await models.field.getFilters(req.payload.form);
    if ( filterableFields.error ) throw filterableFields.error;
    for ( const f of filterableFields.res ) {
      const minOrder = Math.min(...f.filter_forms.map(ff => ff.filterOrder));
      const base = {
        isField: true,
        field_name: f.name,
        label: f.label,
        sort_order: minOrder,
        sort_order_secondary: 0,
        filter_forms: f.filter_forms
      };

      if ( ['date','datetime'].includes(f.field_type) ) {
        out[`${f.name}_after`]  = { ...base, type: 'date', label: `${f.label} After`  };
        out[`${f.name}_before`] = { ...base, type: 'date', label: `${f.label} Before`, sort_order_secondary: 1 };
      } else {
        const items = await models.picklist.getPicklistItems(f.picklist_id);
        if ( items.error ) throw items.error;
        out[f.name] = {
          ...base,
          type: 'select',
          multiple: true,
          options: items.res.map(i => ({ value: i.value, label: i.label || i.value }))
        };
      }
    }

    res.status(200).json(out);

  } catch (e) {
    return handleError(res, req, e);
  }
})

router.post('/:idOrName', json(), validate(schema.formIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  try {
    const token = req.auth.token;
    let form = await models.form.get(req.params.idOrName);
    if ( form.error ){
      throw form.error;
    }
    form = form.res;

    if ( !token.hasManagerAccess && !token.forms.includes(form.name) ){
      return res.status(403).json({ message: 'You do not have permission to submit this form.' });
    }

    if ( form.is_archived ){
      return res.status(403).json({ message: 'This form is archived and cannot be submitted.' });
    }

    const isUpdate = !!req.body?.original_form_entry_id;
    let existingEntry;
    if ( isUpdate ){
      existingEntry = await models.formEntry.get(req.body.original_form_entry_id, req.params.idOrName);
      if ( existingEntry.error ){
        throw existingEntry.error;
      }
      existingEntry = existingEntry.res;
      if ( existingEntry.past_edit_window ){
        return res.status(403).json({ message: 'The edit window for this submission has passed. It cannot be updated.' });
      }
      if ( existingEntry.submitted_by !== token.id && !token.hasAdminAccess ){
        return res.status(403).json({ message: 'You do not have permission to update this form entry.' });
      }
    }

    // fetch user IAM data upfront (cached) — needed for group-conditional field filtering and group_id assignment
    let userGroupIds = [];
    let userDepartmentGroupId = null;
    const userData = await models.libraryIam.getUserById(token.id);
    if ( userData.error ) {
      logger.error('Unable to get user data from Library IAM', req.context.logSignal, { error: userData.error });
    } else {
      userGroupIds = (userData.res?.groups || []).map(g => g.id);
      userDepartmentGroupId = userData.res?.groups?.find(g => g.partOfOrg)?.id || null;
    }

    // build schema for field based on form definition and any hard-coded definitions
    const baseSchema = schema.formEntry?.[form.name]?.create || null;
    const fieldsResult = await models.field.query({ form: form.form_id, perPage: 1000 });
    if ( fieldsResult.error ) throw fieldsResult.error;
    const entrySchema = buildDynamicFormEntrySchema(fieldsResult.res.results, { isUpdate, baseSchema, formId: form.form_id, formName: form.name, userGroupIds });

    const validated = await entrySchema.safeParseAsync({...req.body, _formId: form.form_id});
    if ( !validated.success ) {
      return res.status(422).json(formatErrorResponse(validated.error));
    }
    logger.info('Form entry validated', req.context.logSignal, { formId: form.form_id});
    delete validated.data._formId;

    const d = { ...validated.data };
    if ( isUpdate ){
      existingEntry.submitted_by = existingEntry.submitted_by;
      existingEntry.group_id = existingEntry.group_id;
      existingEntry.impersonated_by = existingEntry.submitted_by !== token.id ? token.id : null;
    } else {
      d.submitted_by = token.id;
      d.group_id = userDepartmentGroupId;
    }

    const r = await models.formEntry.create(form.form_id, d);
    if ( r.error ) {
      throw r.error;
    }

    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/:idOrName/:entryId', async (req, res) => {
  try {
    const r = await models.formEntry.get(req.params.entryId, req.params.idOrName);
    if (r.error) {
      throw r.error;
    }
    if ( !r.res ) {
      return res.status(404).json({ message: 'Form entry not found' });
    }
    logger.info('Form entry get successful', req.context.logSignal, { formId: r.res.form_id, formEntryId: r.res.form_entry_id });
    if ( r.res.submitted_by !== req.auth.token.id && !req.auth.token.hasAdminAccess ){
      return res.status(403).json({ message: 'You do not have permission to view this form entry.' });
    }
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.delete('/:entryId', async (req, res) => {
  try {
    const entry = await models.formEntry.get(req.params.entryId);
    if ( entry.error ) throw entry.error;
    if ( !entry.res ) return res.status(404).json({ message: 'Form entry not found' });
    if ( !entry.res.is_latest_version ) return res.status(409).json({ message: 'Only the latest version of a submission can be deleted' });

    if ( entry.res.submitted_by !== req.auth.token.id && !req.auth.token.hasAdminAccess ){
      return res.status(403).json({ message: 'You do not have permission to delete this form entry.' });
    }

    if ( entry.res.past_edit_window ) {
      return res.status(403).json({ message: 'The edit window for this submission has passed. It cannot be deleted.' });
    }
    const deleteAll = req.query.all === 'true';
    const r = await models.formEntry.deleteLatest(req.params.entryId, { deleteAll });
    if ( r.error ) throw r.error;
    logger.info('Form entry deleted', req.context.logSignal, { formEntryId: req.params.entryId, deleteAll });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;