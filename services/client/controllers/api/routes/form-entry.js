import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema, formatErrorResponse } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.post('/:idOrName', json(), validate(schema.formIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  try {
    let form = await models.form.get(req.params.idOrName);
    if ( form.error ){
      throw form.error;
    }
    form = form.res;

    const entrySchema = schema.formEntry?.[form.name]?.[req.body?.original_form_entry_id ? 'update' : 'create'];
    if ( !entrySchema ) {
      throw new Error(`No form entry schema found for form: ${form.name}`);
    }

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

export default router;