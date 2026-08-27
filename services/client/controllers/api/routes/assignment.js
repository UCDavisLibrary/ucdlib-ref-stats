import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';
import protect from '../utils/protect.js';
import { AuthorizationError } from '#lib/errors.js';

const router = Router();

router.get('/groups', async (req, res) => {
  try {
    if ( req.query['clear-cache'] && req.auth?.token?.hasAdminAccess ) {
      const cc = await models.libraryIam.clearAllGroupCache();
      if ( cc.error ) throw cc.error;
    }
    const r = await models.libraryIam.getAllGroups();
    if (r.error) throw r.error;
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.post('/', json(), validate(schema.assignment, {reqParts: ['body']}), async (req, res) => {
  try {
    logger.info('Assignment validated', req.context.logSignal, { assignment: req.payload });

    let r;
    if ( req.payload.action === 'unassign' ) {
      if ( !req.auth?.token?.hasAdminAccess ) {
        throw new AuthorizationError('User does not have permission to unassign fields from forms');
      }
      r = await models.assignment.delete(req.payload.form_field_id, req.payload.form_id);
    } else {
      const form = await models.form.get(req.payload.form_id);
      if ( form.error ) throw form.error;
      if ( !req.auth?.token?.hasManagerAccessForForm(form.res?.name) ) {
        throw new AuthorizationError('User does not have permission to modify this form\'s field assignments');
      }

      if ( req.payload.action === 'assign' ) {
        r = await models.assignment.create(req.payload.form_field_id, req.payload.form_id);
      } else if ( req.payload.action === 'archive' ) {
        r = await models.assignment.patch(req.payload.form_field_id, req.payload.form_id, { is_archived: true });
      } else if ( req.payload.action === 'unarchive' ) {
        r = await models.assignment.patch(req.payload.form_field_id, req.payload.form_id, { is_archived: false });
      } else if ( req.payload.action === 'settings' ) {
        r = await models.assignment.patch(req.payload.form_field_id, req.payload.form_id, { assignment_settings: req.payload.assignment_settings ?? {} });
      } else if ( req.payload.action === 'reorder' ) {
        r = await models.assignment.patch(req.payload.form_field_id, req.payload.form_id, { sort_order: req.payload.sort_order });
      }
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

