import { Router } from 'express';
import models from '#models';
import logger from '#lib/logger.js';
import handleError from '../utils/handleError.js';

const router = Router();

router.get('/clear-cache', async (req, res) => {

  const response = await models.cache.delete('accessToken', req.auth.token.id);
  const success = response.error ? false : true;
  if ( !success ) console.error('Unable to clear access token cache: ', response.error);

  res.json({success});

});

router.get('/set-cache', async (req, res) => {

  try {
    const r = await models.user.upsert({
      userId:    req.auth.token.id,
      firstName: req.auth.token.firstName,
      lastName:  req.auth.token.lastName,
      email:     req.auth.token.email
    });
    if (r.error) {
      throw r.error;
    }
    logger.info('User upsert successful', req.context.logSignal, { userId: r.res.user_id });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;