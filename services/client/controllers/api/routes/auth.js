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

router.get('/user-data', async (req, res) => {

  try {
    // ensure user is in the database
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

    // ensure user department is in the database
    const userData = await models.libraryIam.getUserById(req.auth.token.id);
    if ( userData.error ) {
      logger.error('Unable to get user data from Library IAM', req.context.logSignal, { error: userData.error });
    } else {
      for ( const group of userData.res?.groups || [] ) {
        const groupUpsert = await models.group.upsert({
          groupId: group.id,
          name: group.name
        });
        if ( groupUpsert.error ) {
          logger.error('Unable to upsert user group', req.context.logSignal, { error: groupUpsert.error });
        } else {
          logger.info('User group upsert successful', req.context.logSignal, { groupId: groupUpsert.res.group_id });
        }
      }
    }

    res.status(200).json({userData: userData.res});
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;