import { Router } from 'express';
import models from '#models';
import logger from '#lib/logger.js';
import handleError from '../utils/handleError.js';

const router = Router();

/**
 * @description Clears the access token cache and user cache for the authenticated user.
 * Called on app logout
 */
router.get('/clear-cache', async (req, res) => {

  const out = {}
  const tokenCache = await models.cache.delete('accessToken', req.auth.token.id);
  out.tokenCache = tokenCache.error ? false : true;
  if ( !out.tokenCache ) logger.error('Unable to clear access token cache', req.context.logSignal, { error: tokenCache.error });

  const userCache = await models.libraryIam.clearUserCache(req.auth.token.id);
  out.userCache = userCache.error ? false : true;
  if ( !out.userCache ) logger.error('Unable to clear user cache', req.context.logSignal, { error: userCache.error });

  res.json(out);

});

/**
 * @description Gets user data from the Library IAM API for the authenticated user.
 * And as a side effect, ensures the user and their groups are upserted into the database.
 * This is the first API call the web app makes after a user logs in browser-side
 */
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

    await models.libraryIam.getAllGroups(); // ensure all groups are in the database

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