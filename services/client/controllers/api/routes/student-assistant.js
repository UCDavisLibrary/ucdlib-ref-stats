import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';
import protect from '../utils/protect.js';

const router = Router();

router.get('/active-appointments', protect('hasManagerAccessToAnyForm'), async (req, res) => {
  try {
    const r = await models.studentAssistant.getActiveAppointments();
    if ( r.error ) throw r.error;
    logger.info('Student assistant active appointments fetched', req.context.logSignal, { resultCount: r.res.length });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.post('/', json(), validate(schema.studentAssistantAssignment, {reqParts: ['body']}), async (req, res) => {
  try {
    const forms = await Promise.all(req.payload.form_id.map(idOrName => models.form.get(idOrName)));
    const formError = forms.find(f => f.error);
    if ( formError ) throw formError.error;

    const unauthorized = forms.some(f => !req.auth.token.hasManagerAccessForForm(f.res.name));
    if ( unauthorized ) {
      return res.status(403).json({ message: 'You do not have permission to grant access for one or more selected forms.' });
    }

    const r = await models.studentAssistant.createAssignments({
      userIds: req.payload.user_id,
      formIds: forms.map(f => f.res.form_id),
      groupId: req.payload.group_id,
      createdBy: req.auth.token.id
    });
    if ( r.error ) throw r.error;

    logger.info('Student assistant assignments created', req.context.logSignal, r.res);
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;
