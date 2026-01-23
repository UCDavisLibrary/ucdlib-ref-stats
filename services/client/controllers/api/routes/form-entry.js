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

    const entrySchema = schema.formEntry?.[form.name]?.create;
    if ( !entrySchema ) {
      throw new Error(`No form entry schema found for form: ${form.name}`);
    }

    const validated = await entrySchema.safeParseAsync({...req.body, _formId: form.form_id});
    if ( !validated.success ) {
      return res.status(422).json(formatErrorResponse(validated.error));
    }
    logger.info('Form entry validated', req.context.logSignal, { formId: form.form_id});
    delete validated.data._formId;

    const r = await models.formEntry.create(form.form_id, validated.data);
    if ( r.error ) {
      throw r.error;
    }

    res.status(200).json({ message: 'Form entry created' });
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;