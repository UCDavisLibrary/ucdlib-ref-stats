import { Router, json } from 'express';
import jwt from 'jsonwebtoken';
import handleError from '../utils/handleError.js';
import { validate, schema } from '../utils/validation/index.js';
import models from '#models';
import logger from '#lib/logger.js';
import protect from '../utils/protect.js';
import config from '#lib/config.js';

const router = Router();

const SUPERSET_FIELDS = ['superset_dashboard_id', 'superset_dashboard_ui_config', 'superset_rls'];

/**
 * @description Strip Superset-only fields from payload if the requester is not an admin.
 * @param {Object} payload - Request payload to mutate
 * @param {Object} token - AccessToken instance from req.auth.token
 */
function stripSupersetFieldsIfNotAdmin(payload, token) {
  if ( !token?.hasAdminAccess ) {
    for ( const field of SUPERSET_FIELDS ) {
      delete payload[field];
    }
  }
}

/**
 * @description Sign a Superset guest token JWT locally using the shared GUEST_TOKEN_JWT_SECRET,
 * avoiding the need to call the Superset API and deal with CSRF.
 * @param {Object} opts
 * @param {Object} opts.user - User identity (username, first_name, last_name)
 * @param {String} opts.dashboardId - Superset dashboard UUID
 * @param {Array} opts.rls - RLS clause array
 * @returns {String} Signed JWT guest token
 */
function signGuestToken({ user, dashboardId, rls }) {
  const secret = config.superset.guestTokenSecret;
  if ( !secret ) throw new Error('SUPERSET_GUEST_TOKEN_JWT_SECRET is not configured');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user,
    resources: [{ type: 'dashboard', id: dashboardId }],
    rls_rules: rls,
    iat: now,
    exp: now + 300,
    aud: 'superset',
    type: 'guest'
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256', noTimestamp: true });
}

/**
 * @description Build the RLS clause array for a Superset guest token request.
 * @param {Object} supersetRls - The superset_rls config from the dashboard record
 * @param {Object} userInfo - Keycloak userInfo from req.auth.userInfo
 * @param {String[]} userRoles - Combined realm + resource roles for the user
 * @returns {Array} Array of RLS clause objects for the guest token payload
 */
function buildRlsClauses(supersetRls, userInfo, userRoles) {
  if ( !supersetRls || typeof supersetRls !== 'object' ) return [];

  const { identifier, column, applyToRoles = [], applyIfMissingRoles = [] } = supersetRls;
  if ( !identifier || !column ) return [];
  if ( !applyToRoles.length && !applyIfMissingRoles.length ) return [];

  const hasApplyToRole = applyToRoles.some(role => userRoles.includes(role));
  const missingRequiredRole = applyIfMissingRoles.some(role => !userRoles.includes(role));

  if ( !hasApplyToRole && !missingRequiredRole ) return [];

  const value = identifier === 'email' ? userInfo.email : userInfo.preferred_username;
  return [{ clause: `${column} = '${value}'` }];
}

router.get('/', validate(schema.dashboardQuery, {reqParts: ['query']}), async (req, res) => {
  try {
    const r = await models.dashboard.query(req.payload);
    if ( r.error ) throw r.error;
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/all', async (req, res) => {
  try {
    const params = {};
    if ( req.query.active_only === 'true' ) params.active_only = true;
    const r = await models.dashboard.getAllDashboards(params);
    if ( r.error ) throw r.error;
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/:idOrName/guest-token', async (req, res) => {
  try {
    const r = await models.dashboard.get(req.params.idOrName, { errorOnMissing: true });
    if ( r.error ) throw r.error;

    const dashboard = r.res;
    if ( !dashboard.superset_dashboard_id ) {
      return res.status(422).json({ message: 'Dashboard has no Superset ID configured' });
    }

    const token = req.auth.token;
    const userRoles = [
      ...(token.realmAccessRoles || []),
      ...(token.resourceAccessRoles || [])
    ];
    const rls = buildRlsClauses(dashboard.superset_rls, req.auth.userInfo, userRoles);

    const guestToken = signGuestToken({
      user: {
        username: req.auth.userInfo.preferred_username,
        first_name: req.auth.userInfo.given_name || '',
        last_name: req.auth.userInfo.family_name || ''
      },
      dashboardId: dashboard.superset_dashboard_id,
      rls
    });

    logger.info('Superset guest token issued', req.context?.logSignal, { dashboardId: dashboard.dashboard_id });
    res.status(200).json({ token: guestToken });
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.get('/:idOrName', async (req, res) => {
  try {
    const r = await models.dashboard.get(req.params.idOrName, { errorOnMissing: true });
    if ( r.error ) throw r.error;
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.post('/', protect('hasManagerAccess'), json(), validate(schema.dashboardCreate, {reqParts: ['body']}), async (req, res) => {
  try {
    stripSupersetFieldsIfNotAdmin(req.payload, req.auth.token);
    const r = await models.dashboard.create(req.payload);
    if ( r.error ) throw r.error;
    logger.info('Dashboard created', req.context?.logSignal, { dashboard: r.res });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.patch('/', protect('hasManagerAccess'), json(), validate(schema.dashboardUpdate, {reqParts: ['body']}), async (req, res) => {
  try {
    stripSupersetFieldsIfNotAdmin(req.payload, req.auth.token);
    const r = await models.dashboard.patch(req.payload.dashboard_id, req.payload);
    if ( r.error ) throw r.error;
    logger.info('Dashboard updated', req.context?.logSignal, { dashboard: r.res });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

router.delete('/:idOrName', protect('hasAdminAccess'), validate(schema.dashboardIdOrNameSchema, {reqParts: ['params']}), async (req, res) => {
  try {
    const r = await models.dashboard.delete(req.params.idOrName);
    if ( r.error ) throw r.error;
    logger.info('Dashboard deleted', req.context?.logSignal, { dashboard: r.res });
    res.status(200).json(r.res);
  } catch (e) {
    return handleError(res, req, e);
  }
});

export default router;
