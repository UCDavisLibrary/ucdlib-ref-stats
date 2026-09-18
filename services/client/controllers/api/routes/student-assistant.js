import { Router, json } from 'express';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';
import protect from '../utils/protect.js';

const router = Router();

router.get('/', protect('hasManagerAccessToAnyForm'), validate(schema.studentAssistantQuery, {reqParts: ['query']}), async (req, res) => {
  try {
    const r = await models.studentAssistant.query(req.payload);
    if ( r.error ) throw r.error;
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

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

    const syncedUserIds = req.payload.user_id.filter(id => !r.res.skippedUsers.includes(id));
    const keycloakSync = await Promise.all(syncedUserIds.map(userId => models.studentAssistant.syncKeycloakAccess({ userId })));

    res.status(200).json({ ...r.res, keycloakSync });
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.patch('/', json(), validate(schema.studentAssistantUpdateFormAccess, {reqParts: ['body']}), async (req, res) => {
  try {
    const forms = await Promise.all(req.payload.form_id.map(idOrName => models.form.get(idOrName)));
    const formError = forms.find(f => f.error);
    if ( formError ) throw formError.error;

    const current = await models.studentAssistant.query({ user_id: req.payload.user_id, per_page: 1 });
    if ( current.error ) throw current.error;
    const currentForms = current.res.results[0]?.forms || [];

    const targetFormIds = forms.map(f => f.res.form_id);
    const changedForms = [
      ...forms.filter(f => !currentForms.some(cf => cf.form_id === f.res.form_id)),
      ...currentForms.filter(cf => !targetFormIds.includes(cf.form_id))
    ];
    const unauthorized = changedForms.some(f => !req.auth.token.hasManagerAccessForForm(f.name || f.res.name));
    if ( unauthorized ) {
      return res.status(403).json({ message: 'You do not have permission to modify access for one or more affected forms.' });
    }

    const r = await models.studentAssistant.updateFormAccess({
      userId: req.payload.user_id,
      formIds: targetFormIds,
      updatedBy: req.auth.token.id
    });
    if ( r.error ) throw r.error;

    logger.info('Student assistant form access updated', req.context.logSignal, r.res);

    const keycloakSync = await models.studentAssistant.syncKeycloakAccess({ userId: req.payload.user_id });

    res.status(200).json({ ...r.res, keycloakSync });
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.post('/sync', protect('hasManagerAccessToAnyForm'), json(), validate(schema.studentAssistantSync, {reqParts: ['body']}), async (req, res) => {
  try {
    const r = await models.studentAssistant.syncKeycloakAccess({ userId: req.payload.user_id });
    if ( r.error ) throw r.error;

    logger.info('Student assistant Keycloak roles synced', req.context.logSignal, { userId: req.payload.user_id, ...r.res });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;
