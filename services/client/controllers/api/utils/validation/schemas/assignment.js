import { srValidateFormId } from './form.js';
import { srValidateFieldId } from './field.js';
import * as z from "zod";
import models from '#models';
import { requiredString, toSafeHtml } from "./utils.js";
import logger from '#lib/logger.js';

/**
 * @description Zod superRefine callback — validates that all group IDs in conditionalOnGroup exist in the groups table.
 * @param {Object} data - Validated assignment data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
const srValidateGroupIds = async (data, ctx) => {
  const ids = data.assignment_settings?.conditionalOnGroup;
  if (!ids?.length) return;
  const r = await models.libraryIam.getAllGroups();
  if (r.error) {
    logger.error('Error fetching IAM groups for validation', { error: r.error });
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A server error occurred', fatal: true });
    return;
  }
  const validIds = new Set((r.res || []).map(g => g.id));
  if (!ids.every(id => validIds.has(id))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'One or more selected groups do not exist',
      path: ['assignment_settings', 'conditionalOnGroup']
    });
  }
};

/**
 * @description Zod superRefine callback — validates that a field-form assignment exists for non-assign actions.
 * @param {Object} data - Validated assignment data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
const srValidateAssignmentExists = async (data, ctx) => {
  if ( data.action && data.action !== 'assign' ) {
    const existing = await models.assignment.get(data.form_field_id, data.form_id);
    if (existing.error) {
      logger.error('Database error validating assignment existence', { error: existing.error });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A database error occurred while validating the assignment',
        fatal: true
      });
      return;
    }
    if (!existing.res) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Assignment does not exist'
      });
    }
  }
};

const assignmentSchema = z.object({
  form_id: requiredString(),
  form_field_id: requiredString(),
  action: z.enum(['assign', 'unassign', 'archive', 'unarchive', 'settings', 'reorder']),
  sort_order: z.number().int().nonnegative().optional(),
  assignment_settings: z.object({
    required: z.boolean().optional(),
    multiple: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    placeholder: z.string().optional(),
    rows: z.number().int().optional(),
    noFieldContainer: z.boolean().optional(),
    description: toSafeHtml.pipe(z.string().max(1000)).optional(),
    label: z.string().optional(),
    allowQuickAdd: z.boolean().optional(),
    defaultValue: z.string().optional(),
    conditionalOnGroup: z.array(z.number().int()).optional()
  }).optional()
}).superRefine(srValidateFormId).superRefine(srValidateFieldId).superRefine(srValidateAssignmentExists).superRefine(srValidateGroupIds);

export {
  assignmentSchema
}