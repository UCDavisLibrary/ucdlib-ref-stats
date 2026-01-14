import handleError from "../handleError.js";
import { 
  picklistCreateSchema, 
  picklistQuerySchema, 
  picklistUpdateSchema,
  picklistIdOrNameSchema
} from './schemas/picklist.js';

import { 
  fieldCreateSchema,
  fieldQuerySchema,
  fieldUpdateSchema,
  fieldIdOrNameSchema
} from './schemas/field.js';

import { 
  formCreateSchema,
  formQuerySchema,
  formUpdateSchema,
  formIdOrNameSchema
} from './schemas/form.js';

import {
  assignmentSchema
} from './schemas/assignment.js';

/**
 * @description Middleware to validate request data against a Zod schema.
 * Combines req.params, req.query, and req.body for validation.
 * On success, attaches validated data to req.validated.
 * @param {*} schema - A Zod schema
 * @param {*} opts - Options for validation
 * @param {Array} opts.reqParts - Array of request parts to validate (e.g., ['body', 'query']). If not provided, all parts are combined.
 * @param {String} opts.outputKey - Key to attach validated data to on req object. Defaults to 'payload'.
 * @returns
 */
function validate(schema, opts={}) {
  return async (req, res, next) => {
    try {
      let input = {};
      if ( Array.isArray(opts.reqParts ) ) {
        for ( const part of opts.reqParts ) {
          input = { ...input, ...(req[part]||{}) };
        }
      } else {
        input = { ...req.params, ...req.query, ...req.body };
      }
      const parse = await schema.safeParseAsync(input);
      if (parse.success) {
        req[opts.outputKey || 'payload'] = parse.data;
        return next();
      }

      return res.status(422).json(formatErrorResponse(parse.error));

    } catch (e) {
      return handleError(res, req, e);
    }
  };
}

function formatErrorResponse(zodError) {
  const issues = [];
  for (let issue of zodError.issues) {
    issue = { ...issue };
    issues.push(issue);
  }
  return { validationError: true, errors: issues };
}

const schema = {
  picklistCreate: picklistCreateSchema,
  picklistQuery: picklistQuerySchema,
  picklistUpdate: picklistUpdateSchema,
  picklistIdOrNameSchema: picklistIdOrNameSchema,
  fieldCreate: fieldCreateSchema,
  fieldQuery: fieldQuerySchema,
  fieldUpdate: fieldUpdateSchema,
  fieldIdOrNameSchema: fieldIdOrNameSchema,
  formCreate: formCreateSchema,
  formQuery: formQuerySchema,
  formUpdate: formUpdateSchema,
  formIdOrNameSchema: formIdOrNameSchema,
  assignment: assignmentSchema
};

export { validate, schema };