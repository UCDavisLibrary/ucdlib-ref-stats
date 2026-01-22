import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.post('/:idOrName', json(), validate(schema.formIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  try {

    res.status(200).json({ message: 'Form entry created' });
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;