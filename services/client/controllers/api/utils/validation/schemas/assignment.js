import { srValidateFormId } from './form.js';
import { srValidateFieldId } from './field.js';
import * as z from "zod";
import models from '#models';
import { requiredString } from "./utils.js";
import logger from '#lib/logger.js';

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
  action: z.enum(['assign', 'unassign', 'archive', 'unarchive'])
}).superRefine(srValidateFormId).superRefine(srValidateFieldId).superRefine(srValidateAssignmentExists);

export {
  assignmentSchema
}