import handleError from "../handleError.js";
import { picklistCreateSchema, picklistQuerySchema } from './schemas/picklist.js';

/**
 * @description Middleware to validate request data against a Zod schema.
 * Combines req.params, req.query, and req.body for validation.
 * On success, attaches validated data to req.validated.
 * @param {*} schema - A Zod schema
 * @param {*} opts - Options for validation
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
        req.payload = parse.data;
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
  picklistQuery: picklistQuerySchema
};

export { validate, schema };