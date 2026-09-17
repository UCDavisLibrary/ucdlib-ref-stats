import { Router } from 'express';
import handleError from '../utils/handleError.js';
import models from '#models';

const router = Router();

router.get('/all', async (req, res) => {
  try {
    const params = {};
    if ( req.query.active_only === 'true' ) params.active_only = true;
    const r = await models.group.getAllGroups(params);
    if ( r.error ) throw r.error;
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;
