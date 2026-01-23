import * as z from "zod";
import { requiredString, booleanParam, toString, requiredNumber, requiredArray } from "./utils.js";
import models from '#models';
import definitions from '#lib/definitions.js';
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

const instructionStatsBase = z.object({
  '_formId': z.string(),
  'participant-count': requiredNumber(),
  'instructor-session-type': requiredString().superRefine(srPicklistItemsExist('instructor-session-type'))
});

const instructionStatsCreate = instructionStatsBase.extend({
  'department': requiredArray().superRefine(srPicklistItemsExist('department')),
});

export default {

  'instruction-statistics': {
    'create': instructionStatsCreate
  }
};