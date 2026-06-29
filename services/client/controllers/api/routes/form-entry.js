import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema, formatErrorResponse, buildDynamicFormEntrySchema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';
import protect from '../utils/protect.js';

const router = Router();

router.get('/', validate(schema.formEntry.query, {reqParts: ['query']}), async (req, res) => {
  // todo - filter to current user if not admin. do i make an admin role for each form, and then ensure all that matches the 'form' query param?
    try {
      logger.info('Form entry query validated', req.context.logSignal);
      if ( req.payload.form ) {
        req.payload.form = req.payload.form.split(',').map(f => f.trim());
      }
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

router.post('/:idOrName', json(), validate(schema.formIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  // todo - verify user has access to submit form
  try {
    const token = req.auth.token;
    let form = await models.form.get(req.params.idOrName);
    if ( form.error ){
      throw form.error;
    }
    form = form.res;

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