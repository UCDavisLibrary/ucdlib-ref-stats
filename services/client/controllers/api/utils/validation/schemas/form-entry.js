import * as z from "zod";
import { requiredString, booleanParam, toString, requiredNumber, requiredArray, pageParam, perPageParam , requiredIsoDate} from "./utils.js";
import models from '#models';
import logger from '#lib/logger.js';

function srPicklistItemsExist(field){
  return async (value, ctx) => {
    if ( !value || value?.length === 0 ) return;
    const r = await models.field.picklistItemsExist(field, value);
    if ( r.error ) {
      logger.error('Database error validating picklist items existence', { error: r.error });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A database error occurred',
        fatal: true
      });
      return;
    }
    if ( !r.res ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Option(s) do not exist in picklist',
      });
    }
  }
} 

const srOriginalFormEntryExists = async (data, ctx) => {
  if ( !data.original_form_entry_id ) return;
  const existing = await models.formEntry.get(data.original_form_entry_id, data._formId);
  if (existing.error) {
    logger.error('Database error validating original form entry existence', { error: existing.error });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A database error occurred',
      fatal: true
    });
    return;
  }
  if ( !existing.res) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Original form entry not found or does not belong to this form',
      path: ['original_form_entry_id']
    });
  }
}

const srOrderByFieldExists = async (value, ctx) => {
  if ( !value ) return;
  console.log('Validating orderByField:', value);
  if ( value.startsWith('-') || value.startsWith('+') ) {
    value = value.substring(1);
  }
  if ( !value ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid orderByField value',
    });
    return;
  }
  const field = await models.field.get(value);
  if ( field.error ) {
    logger.error('Database error validating orderByField existence', { error: field.error });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A database error occurred',
      fatal: true
    });
    return;
  }
  if ( !field.res ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `orderByField field not found: ${value}`,
    });
  }
}

const querySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  form: z.string().optional(),
  is_latest_version: booleanParam,
  orderByField: z.string().optional().superRefine(srOrderByFieldExists)
});

const instructionStatsBase = z.object({
  '_formId': z.string(),
  'participant-count': requiredNumber(),
  'instructor-session-type': requiredString().superRefine(srPicklistItemsExist('instructor-session-type')),
  'department': requiredArray().superRefine(srPicklistItemsExist('department')),
  'date': requiredIsoDate()
});


const instructionStatsUpdate = instructionStatsBase.extend({
  'original_form_entry_id': z.uuid()
}).superRefine(srOriginalFormEntryExists);


export default {
  'query': querySchema,

  'instruction-statistics': {
    'create': instructionStatsBase,
    'update': instructionStatsUpdate
  }
};