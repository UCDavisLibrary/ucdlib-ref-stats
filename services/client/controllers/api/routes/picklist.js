import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '../../../../lib/models/index.js';
import logger from '../../../../lib/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Picklist API Root' });
});

// create picklist
router.post('/', json(), validate(schema.picklistCreate, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Picklist validated', {corkTraceId: req.corkTraceId});
    const r = await models.picklist.create(req.payload);
    if (r.error) {
      throw r.error;
    }
    logger.info('Picklist created', {corkTraceId: req.corkTraceId, picklistId: r.res.picklist_id});
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;