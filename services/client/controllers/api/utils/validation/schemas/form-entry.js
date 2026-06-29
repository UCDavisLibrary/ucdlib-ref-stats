import * as z from "zod";
import { requiredString, booleanParam, toString, requiredNumber, requiredArray, pageParam, perPageParam, requiredIsoDate, isoDate, requiredIsoDatetime, isoDatetime } from "./utils.js";
import models from '#models';
import logger from '#lib/logger.js';
import definitions from '#lib/definitions.js';

/**
 * @description Returns a Zod superRefine callback that validates submitted values exist in the given picklist.
 * @param {String} field - The field name whose picklist items should be checked
 * @returns {Function} Async superRefine callback
 */
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

/**
 * @description Zod superRefine callback — validates that original_form_entry_id exists and belongs to the form.
 * @param {Object} data - Validated form entry data
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
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

/**
 * @description Zod superRefine callback — validates that an orderByField value references an existing field.
 * Strips a leading +/- sort direction prefix before the lookup.
 * @param {String} value - The orderByField query parameter value
 * @param {import('zod').RefinementCtx} ctx - Zod refinement context
 */
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

/**
 * @description Example of a fully custom (hardcoded) form entry schema.
 * Use this pattern when a form's validation requirements are too complex or
 * interdependent to express via the validation options present in the GUI.
 *
 * Steps to add a custom schema for a new form:
 *   1. Register the form name and its custom-validated field names in
 *      customValidationRegistry in services/lib/definitions.js.
 *   2. Build a Zod schema below using definitions.customValidation(fieldName, formName)
 *      as the key — this ensures the field is registered and prevents typos.
 *   3. Add create/update entries to the default export at the bottom of this file.
 *      buildDynamicFormEntrySchema will use the create schema as a baseSchema and
 *      automatically extend it with any remaining dynamic fields.
 */
const exampleFormBase = z.object({
  '_formId': z.string(),
  [definitions.customValidation('example-field', 'example')]: requiredString()
});

const exampleFormUpdate = exampleFormBase.extend({
  'original_form_entry_id': z.uuid()
}).superRefine(srOriginalFormEntryExists);


/**
 * @description Cross-field validation rules applied by buildDynamicFormEntrySchema.
 * For when validation requirements depend on the values of multiple fields, which is not currently possible to express via the GUI.
 * Each rule fires when all fields listed in `requires` are present in the schema.
 * The optional `forms` array restricts the rule to specific form names; omit it to apply
 * the rule to any form that has the required fields.
 * @type {Array<{requires: string[], forms?: string[], refine: Function}>}
 */
const CROSS_FIELD_REFINEMENTS = [
  {
    requires: ['event-count', 'virtual-event-count'],
    refine: (data, ctx) => {
      const eventCount = data['event-count'];
      const virtualCount = data['virtual-event-count'];
      if (eventCount == null || virtualCount == null) return;
      if (Number(virtualCount) > Number(eventCount)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Cannot exceed the total number of events/transactions (${eventCount})`,
          path: ['virtual-event-count']
        });
      }
    }
  }
];

/**
 * @description Builds a Zod schema for form entry validation from field metadata.
 * When a baseSchema is provided (hardcoded create schema), only generates validators
 * for fields not already covered by it, then extends.
 * assignment_settings (required, multiple, min, max, step) are applied per field.
 * Cross-field rules from CROSS_FIELD_REFINEMENTS are applied when their required fields are present.
 * @param {Array} fields - Field objects from models.field.query
 * @param {Object} opts
 * @param {boolean} opts.isUpdate - Whether this is an update operation
 * @param {import('zod').ZodObject|null} opts.baseSchema - Hardcoded create schema to extend, or null
 * @param {string|null} opts.formId - Form UUID used to look up per-form assignment_settings
 * @param {string|null} opts.formName - Form name used to match CROSS_FIELD_REFINEMENTS form filters
 * @param {Array|null} opts.userGroupIds - IAM group IDs for the current user, for conditional field filtering
 * @returns {import('zod').ZodType}
 */
export function buildDynamicFormEntrySchema(fields, opts = {}) {
  const { isUpdate = false, baseSchema = null, formId = null, formName = null, userGroupIds = null } = opts;
  const coveredKeys = baseSchema ? Object.keys(baseSchema.shape) : [];
  const extraShape = {};

  for (const field of fields) {
    if ( field.is_archived ) continue;
    const form = formId ? field.forms?.find(f => f.form_id === formId) : null;
    if ( form?.assignment_is_archived ) continue;
    if (coveredKeys.includes(field.name)) continue;

    const settings = formId
      ? (field.forms?.find(f => f.form_id === formId)?.assignment_settings || {})
      : {};

    if (settings.conditionalOnGroup?.length && userGroupIds !== null) {
      const userGids = userGroupIds.map(Number);
      if (!settings.conditionalOnGroup.some(gid => userGids.includes(Number(gid)))) continue;
    }

    const req = settings.required === true;
    const multiple = settings.multiple === true;

    let validator;

    switch (field.field_type) {
      case 'text':
      case 'textarea': {
        validator = req ? requiredString() : toString;
        const { min, max } = settings;
        if (min != null || max != null) {
          validator = validator.superRefine((val, ctx) => {
            if (!val) return;
            if (min != null && val.length < min) {
              ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: min, type: 'string', inclusive: true, message: `Must be at least ${min} characters` });
            }
            if (max != null && val.length > max) {
              ctx.addIssue({ code: z.ZodIssueCode.too_big, maximum: max, type: 'string', inclusive: true, message: `Must be at most ${max} characters` });
            }
          });
        }
        break;
      }
      case 'date':
        validator = req ? requiredIsoDate() : isoDate;
        break;
      case 'datetime':
        validator = req ? requiredIsoDatetime() : isoDatetime;
        break;
      case 'number': {
        validator = req ? requiredNumber() : z.coerce.number().optional();
        const { min, max, step } = settings;
        if (min != null || max != null || step != null) {
          validator = validator.superRefine((val, ctx) => {
            if (val == null) return;
            if (min != null && val < min) {
              ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: min, type: 'number', inclusive: true, message: `Must be at least ${min}` });
            }
            if (max != null && val > max) {
              ctx.addIssue({ code: z.ZodIssueCode.too_big, maximum: max, type: 'number', inclusive: true, message: `Must be at most ${max}` });
            }
            if (step != null && val % step !== 0) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Must be a multiple of ${step}` });
            }
          });
        }
        break;
      }
      case 'select':
        if (multiple) {
          validator = (req ? requiredArray() : z.array(z.string()).optional()).superRefine(srPicklistItemsExist(field.name));
        } else {
          validator = (req ? requiredString() : toString).superRefine(srPicklistItemsExist(field.name));
        }
        break;
      case 'radio':
        validator = (req ? requiredString() : toString).superRefine(srPicklistItemsExist(field.name));
        break;
      case 'typeahead':
        if (multiple) {
          validator = (req ? requiredArray() : z.array(z.string()).optional()).superRefine(srPicklistItemsExist(field.name));
        } else {
          validator = (req ? requiredString() : toString).superRefine(srPicklistItemsExist(field.name));
        }
        break;
      case 'checkbox-multiple':
        validator = (req ? requiredArray() : z.array(z.string()).optional()).superRefine(srPicklistItemsExist(field.name));
        break;
      case 'checkbox-single':
        validator = booleanParam;
        break;
    }

    if (validator) extraShape[field.name] = validator;
  }

  let schema;
  if (baseSchema && Object.keys(extraShape).length > 0) {
    schema = baseSchema.extend(extraShape);
  } else if (baseSchema) {
    schema = baseSchema;
  } else {
    schema = z.object({ _formId: z.string(), ...extraShape });
  }

  const allFieldKeys = new Set([
    ...Object.keys(extraShape),
    ...(baseSchema ? Object.keys(baseSchema.shape) : [])
  ]);
  for (const { requires, forms, refine } of CROSS_FIELD_REFINEMENTS) {
    if (forms && formName && !forms.includes(formName)) continue;
    if (requires.every(f => allFieldKeys.has(f))) {
      schema = schema.superRefine(refine);
    }
  }

  if (isUpdate) {
    schema = schema.extend({ original_form_entry_id: z.uuid() }).superRefine(srOriginalFormEntryExists);
  }

  return schema;
}

export default {
  'query': querySchema,

  'example': {
    'create': exampleFormBase,
    'update': exampleFormUpdate
  }
};