import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';

const router = Router();

router.post('/', json(), validate(schema.assignment, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Assignment validated', req.context.logSignal, { assignment: req.payload });
    let r;
    if ( req.payload.action === 'assign' ) {
      r = await models.assignment.create(req.payload.form_field_id, req.payload.form_id);
    } else if ( req.payload.action === 'unassign' ) {
      r = await models.assignment.delete(req.payload.form_field_id, req.payload.form_id);
    } else if ( req.payload.action === 'archive' ) {
      r = await models.assignment.patch(req.payload.form_field_id, req.payload.form_id, { is_archived: true });
    } else if ( req.payload.action === 'unarchive' ) {
      r = await models.assignment.patch(req.payload.form_field_id, req.payload.form_id, { is_archived: false });
    } 
    if (r.error) {
      throw r.error;
    }
    logger.info('Assignment processed', req.context.logSignal, { assignment: r.res });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;

