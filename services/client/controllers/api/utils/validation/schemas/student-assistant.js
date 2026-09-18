import * as z from "zod";
import models from '#models';
import logger from '#lib/logger.js';
import { requiredArray, requiredNumber, requiredString, pageParam, perPageParam } from "./utils.js";

/**
 * @description Zod superRefine callback — validates that all form_id (name or UUID) entries exist.
 * @param {Object} data - Validated student assistant assignment data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
const srValidateFormIds = async (data, ctx) => {
  if ( !data.form_id?.length ) return;
  const results = await Promise.all(data.form_id.map(idOrName => models.form.get(idOrName)));
  const dbError = results.find(r => r.error);
  if ( dbError ) {
    logger.error('Database error validating form ids', { error: dbError.error });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A database error occurred', fatal: true });
    return;
  }
  if ( results.some(r => !r.res) ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'One or more selected forms do not exist', path: ['form_id'] });
  }
};

/**
 * @description Zod superRefine callback — validates that group_id exists in the groups table.
 * @param {Object} data - Validated student assistant assignment data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
const srValidateGroupId = async (data, ctx) => {
  const existing = await models.group.getAllGroups();
  if ( existing.error ) {
    logger.error('Database error validating group id', { error: existing.error });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A database error occurred', fatal: true });
    return;
  }
  const validIds = new Set((existing.res || []).map(g => g.group_id));
  if ( !validIds.has(data.group_id) ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selected group does not exist', path: ['group_id'] });
  }
};

const studentAssistantAssignmentSchema = z.object({
  user_id: requiredArray('At least one student assistant is required'),
  form_id: requiredArray('At least one form is required'),
  group_id: requiredNumber({ required: 'Group is required', nan: 'Group must be a number' })
}).superRefine(srValidateFormIds).superRefine(srValidateGroupId);

const studentAssistantQuerySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  user_id: z.string().optional(),
  group_id: z.preprocess(
    v => (v == null || v === '' ? undefined : Number(v)),
    z.number().int().optional()
  ),
  form: z.string().optional()
});

const studentAssistantUpdateFormAccessSchema = z.object({
  user_id: requiredString(),
  form_id: z.array(z.string())
}).superRefine(srValidateFormIds);

const studentAssistantSyncSchema = z.object({
  user_id: requiredString()
});

export {
  studentAssistantAssignmentSchema,
  studentAssistantQuerySchema,
  studentAssistantUpdateFormAccessSchema,
  studentAssistantSyncSchema
};
