import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema, formatErrorResponse, buildDynamicFormEntrySchema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.get('/', validate(schema.formEntry.query, {reqParts: ['query']}), async (req, res) => {
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
  try {
    let form = await models.form.get(req.params.idOrName);
    if ( form.error ){
      throw form.error;
    }
    form = form.res;

    const isUpdate = !!req.body?.original_form_entry_id;
    const baseSchema = schema.formEntry?.[form.name]?.create || null;

    const fieldsResult = await models.field.query({ form: form.form_id, perPage: 1000 });
    if ( fieldsResult.error ) throw fieldsResult.error;

    const entrySchema = buildDynamicFormEntrySchema(fieldsResult.res.results, { isUpdate, baseSchema, formId: form.form_id });

    const validated = await entrySchema.safeParseAsync({...req.body, _formId: form.form_id});
    if ( !validated.success ) {
      return res.status(422).json(formatErrorResponse(validated.error));
    }
    logger.info('Form entry validated', req.context.logSignal, { formId: form.form_id});
    delete validated.data._formId;

    // todo: if new versioning is added, check if same user as og
    const r = await models.formEntry.create(form.form_id, validated.data);
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
    const r = await models.formEntry.get(req.params.entryId, req.params.idOrName, { errorOnMissing: true });
    if (r.error) {
      throw r.error;
    }
    if ( !r.res ) {
      return res.status(404).json({ message: 'Form entry not found' });
    }
    logger.info('Form entry get successful', req.context.logSignal, { formId: r.res.form_id, formEntryId: r.res.form_entry_id });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.delete('/:entryId', async (req, res) => {
  try {
    const entry = await models.formEntry.get(req.params.entryId);
    if ( !entry.res ) return res.status(404).json({ message: 'Form entry not found' });
    if ( !entry.res.is_latest_version ) return res.status(409).json({ message: 'Only the latest version of a submission can be deleted' });
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