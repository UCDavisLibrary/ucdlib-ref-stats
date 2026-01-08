import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.get('/', validate(schema.fieldQuery, {reqParts: ['query']}), async (req, res) => {
  try {
    logger.info('Field query validated', {corkTraceId: req.corkTraceId});
    const r = await models.field.query(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Field query successful', {corkTraceId: req.corkTraceId, resultCount: r.res.total_count});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

const transformPayload = (req, res, next) => {
  if ( req.body?.field_type && req.body.field_type !== 'picklist' ) {
    req.body.picklist_id = null;
  }
  next();
}

// create field
router.post('/', json(), transformPayload, validate(schema.fieldCreate, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Field validated', {corkTraceId: req.corkTraceId});
    const r = await models.field.create(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Field created', {corkTraceId: req.corkTraceId, field: r.res});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});


export default router;