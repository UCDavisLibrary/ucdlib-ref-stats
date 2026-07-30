import * as z from "zod";
import { requiredString, urlFriendlyString, pageParam, perPageParam, booleanParam, toString, toSafeHtml } from "./utils.js";
import models from '#models';
import logger from '#lib/logger.js';

/**
 * @description Zod superRefine callback — validates that a dashboard name is unique in the database.
 * Allows the existing name when updating the same record.
 * @param {Object} data - Validated dashboard data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
const srNameUnique = async (data, ctx) => {
  if ( !data.name ) return;
  const existing = await models.dashboard.get(data.name);
  if ( existing.error ) {
    logger.error('Database error validating dashboard name uniqueness', { error: existing.error });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A database error occurred',
      fatal: true
    });
    return;
  }
  if ( !existing.res ) return;
  if ( !data.dashboard_id || existing.res.dashboard_id !== data.dashboard_id ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A dashboard with this name already exists',
      path: ['name']
    });
  }
};

/**
 * @description Zod superRefine callback — validates that dashboard_id exists in the database.
 * @param {Object} data - Validated dashboard data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
const srValidateDashboardId = async (data, ctx) => {
  if ( data.dashboard_id ) {
    const existing = await models.dashboard.get(data.dashboard_id);
    if ( existing.error ) {
      logger.error('Database error validating dashboard ID', { error: existing.error });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A database error occurred',
        fatal: true
      });
      return;
    }
    if ( !existing.res ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dashboard not found',
        path: ['dashboard_id']
      });
    }
  } else {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dashboard_id is required',
      path: ['dashboard_id']
    });
  }
};

const rlsSchema = z.object({
  identifier: z.enum(['username', 'email']).optional(),
  column: z.string().max(250).optional(),
  applyToRoles: z.array(z.string()).optional(),
  applyIfMissingRoles: z.array(z.string()).optional()
}).optional();

const uiConfigSchema = z.preprocess(
  v => {
    if ( v === null || v === undefined || v === '' ) return {};
    if ( typeof v === 'string' ) {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  },
  z.record(z.unknown())
).optional();

const dashboardBaseSchema = z.object({
  label: requiredString().pipe(z.string().max(250)),
  description: toString.pipe(z.string().max(300)).optional(),
  intro: toSafeHtml.optional(),
  is_archived: z.boolean().optional(),
  form_ids: z.array(z.string().uuid()).optional(),
  superset_dashboard_id: z.string().max(250).optional(),
  superset_dashboard_ui_config: uiConfigSchema,
  superset_rls: rlsSchema
});

const dashboardCreateSchema = dashboardBaseSchema.extend({
  name: requiredString().pipe(urlFriendlyString.max(250))
}).superRefine(srNameUnique);

const dashboardUpdateSchema = dashboardBaseSchema.partial().extend({
  dashboard_id: z.string().uuid()
}).superRefine(srValidateDashboardId);

const dashboardQuerySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  q: z.string().max(250).optional(),
  form: z.string().max(250).optional(),
  active_only: booleanParam
});

const dashboardIdOrNameSchema = z.object({
  idOrName: requiredString().superRefine(async (idOrName, ctx) => {
    const existing = await models.dashboard.get(idOrName);
    if ( existing.error ) throw existing.error;
    if ( !existing.res ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dashboard not found',
        path: []
      });
    }
    return true;
  })
});

export {
  dashboardCreateSchema,
  dashboardUpdateSchema,
  dashboardQuerySchema,
  dashboardIdOrNameSchema,
  srValidateDashboardId
};
