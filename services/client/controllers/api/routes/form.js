import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.get('/', validate(schema.formQuery, {reqParts: ['query']}), async (req, res) => {
  try {
    logger.info('Form query validated', req.context.logSignal);
    const r = await models.form.query(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Form query successful',  req.context.logSignal, {resultCount: r.res.total_count});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/:idOrName', async (req, res) => {
  try {
    const r = await models.form.get(req.params.idOrName, { errorOnMissing: true });
    if (r.error) {
      throw r.error;
    }
    logger.info('Form get successful', req.context.logSignal, { formId: r.res.form_id});
    if ( !req.query.include_items ) {
      delete r.res.items;
    }
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

// create form
router.post('/', json(), validate(schema.formCreate, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Form validated', req.context.logSignal);
    const r = await models.form.create(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Form created', req.context.logSignal, { form: r.res});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.patch('/', json(), validate(schema.formUpdate, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Form update validated', req.context.logSignal, {formId: req.payload.form_id});
    const r = await models.form.patch(req.payload.form_id, req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Form update successful', req.context.logSignal, {form: r.res});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.delete('/:idOrName', validate(schema.formIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  try {
    logger.info('Form delete validated', req.context.logSignal, {formIdOrName: req.params.idOrName});
    const r = await models.form.delete(req.params.idOrName);
    if (r.error) {
      throw r.error;
    }
    logger.info('Form delete successful', req.context.logSignal, {form: r.res});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});


export default router;