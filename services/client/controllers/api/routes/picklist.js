import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.get('/', validate(schema.picklistQuery, {reqParts: ['query']}), async (req, res) => {
  try {
    logger.info('Picklist query validated', req.context.logSignal);
    const r = await models.picklist.query(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Picklist query successful', req.context.logSignal, {resultCount: r.res.total_count});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/:idOrName', async (req, res) => {
  try {
    const r = await models.picklist.get(req.params.idOrName, { errorOnMissing: true });
    if (r.error) {
      throw r.error;
    }
    logger.info('Picklist get successful', req.context.logSignal, { picklistId: r.res.picklist_id});
    if ( !req.query.include_items ) {
      delete r.res.items;
    }
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.patch('/:idOrName', json(), validate(schema.picklistIdOrNameSchema, {reqParts: ['params']}), validate(schema.picklistUpdate, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Picklist update validated', req.context.logSignal, {picklistIdOrName: req.params.idOrName});
    const r = await models.picklist.patch(req.params.idOrName, req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Picklist update successful', req.context.logSignal, {picklistId: r.res.picklist_id});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.delete('/:idOrName', validate(schema.picklistIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  try {
    logger.info('Picklist delete validated', req.context.logSignal, {picklistIdOrName: req.params.idOrName});
    const r = await models.picklist.delete(req.params.idOrName);
    if (r.error) {
      throw r.error;
    }
    logger.info('Picklist delete successful', req.context.logSignal, {picklist: r.res});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

// create picklist
router.post('/', json(), validate(schema.picklistCreate, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Picklist validated', {corkTraceId: req.corkTraceId});
    const r = await models.picklist.create(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Picklist created', req.context.logSignal, {picklistId: r.res.picklist_id});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;