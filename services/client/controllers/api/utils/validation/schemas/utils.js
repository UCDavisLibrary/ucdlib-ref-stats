import * as z from "zod";
import sanitizeHtml from 'sanitize-html';

const SAFE_HTML_OPTIONS = {
  allowedTags: ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
  allowedAttributes: { a: ['href', 'target'] }
};

/**
 * @description Returns "Required" validation message if value is null/undefined/empty
 * @param {String} msg - The validation message to return. Default: 'Required'
 * @returns
 */
export const requiredString = (msg = 'Required') =>
  z.preprocess(
    v => (v == null ? '' : v),
    z.string().trim().min(1, msg)
  );

/**
 * @description Coerces a value to a string, converting null/undefined to an empty string.
 */
export const toString = z.preprocess(
  v => {
    if (v == null ) return '';
    return String(v);
  }, z.string()
);

/**
 * @description Validates a required ISO date string (YYYY-MM-DD).
 * @param {String} msg - Required validation message. Default: 'Required'
 * @returns {import('zod').ZodType}
 */
export const requiredIsoDate = (msg = 'Required') =>
  z.preprocess(
    v => (v == null ? '' : v),
    z.string().trim().date(msg)
  );

/**
 * @description Validates an optional ISO date string (YYYY-MM-DD). Allows empty/null.
 */
export const isoDate = z.preprocess(
  v => (v == null ? '' : v),
  z.string().trim().refine(
    v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
    'Must be a valid date (YYYY-MM-DD)'
  )
);

/**
 * @description Validates a required local datetime string (YYYY-MM-DDTHH:mm[:ss]).
 * Matches the format produced by datetime-local inputs.
 * @param {String} msg - Required validation message. Default: 'Required'
 */
export const requiredIsoDatetime = (msg = 'Required') =>
  z.preprocess(
    v => (v == null ? '' : v),
    z.string().trim().min(1, msg)
  ).pipe(
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, 'Must be a valid date and time')
  );

/**
 * @description Validates an optional local datetime string (YYYY-MM-DDTHH:mm[:ss]). Allows empty/null.
 */
export const isoDatetime = z.preprocess(
  v => (v == null ? '' : v),
  z.string().trim().refine(
    v => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v),
    'Must be a valid date and time'
  )
);

/**
 * @description Validates a required array with at least one item.
 * @param {String} msg - Required validation message. Default: 'Required'
 * @param {import('zod').ZodType} [itemSchema] - Schema for array items. Defaults to z.string()
 * @returns {import('zod').ZodType}
 */
export const requiredArray = (msg = 'Required', itemSchema) => {
  itemSchema = itemSchema || z.string();
  return z.preprocess(
    v => {
      if ( !Array.isArray(v) ) return [];
      return v;
    },
    z.array(itemSchema).min(1, msg)
  );
}


/**
 * @description Validates a value as a required number, allowing string inputs with commas and decimal points
 * Delineates between "required" and "not a number" validation errors
 * @param {Object} messages - Validation messages
 * @param {String} messages.required - The "required" validation message. Default: "Required"
 * @param {String} messages.nan - The "not a number" validation message. Default: "Must be a number"
 * @returns
 */
export const requiredNumber = (
  messages = { required: "Required", nan: "Must be a number" }
  ) =>
  z.preprocess(
    v => {
      if (v == null) return "";
      return String(v);
    },
    z.string().trim().min(1, messages.required)
  )
  .pipe(
    z
      .string()
      .regex(/^-?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?$/, messages.nan)
      .transform(v => Number(v.replace(/,/g, '')))
  );

/**
 * @description Returns "Required" validation message if value is null/undefined/empty,
 * or a standard enum error if the value is not one of the allowed values.
 * @param {String[]} values - The allowed enum values
 * @param {String} msg - The required validation message. Default: 'Required'
 * @returns {import('zod').ZodType}
 */
export const requiredEnum = (values, msg = 'Required') =>
  z.preprocess(
    v => (v == null ? '' : v),
    z.string().trim().min(1, msg)
  ).pipe(
    z.enum(values)
  );

/**
 * @description Validates a URL-friendly string: lowercase letters, numbers, hyphens, and underscores only.
 */
export const urlFriendlyString = z.string().regex(/^[a-z0-9_-]+$/, {
  message: "Must be URL-friendly: lowercase letters, numbers, hyphens, and underscores only."
});

/**
 * @description Validates a page query parameter. Coerces empty/null to 1.
 */
export const pageParam = z.preprocess(
  v => {
    if (v == null || v === '') return 1;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  },
  z.number().int().positive("Page must be a positive integer")
);

/**
 * @description Validates a per_page query parameter with configurable default and maximum.
 * @param {Number} defaultValue - Default value when empty/null. Default: 15
 * @param {Number} maxValue - Maximum allowed value. Default: 100
 * @returns {import('zod').ZodType}
 */
export const perPageParam = (defaultValue = 15, maxValue = 100) =>
  z.preprocess(
    v => {
      if (v == null || v === '') return defaultValue;
      const n = Number(v);
      return Number.isFinite(n) ? n : v;
    },
    z.number()
      .int()
      .positive("per_page must be a positive integer")
      .max(maxValue, `per_page must be ≤ ${maxValue}`)
  );

/**
 * @description Zod preprocess that sanitizes HTML to a safe subset of tags before storing.
 * Coerces null/undefined to empty string, strips disallowed tags/attributes.
 * Use in place of `toString` for fields that accept basic HTML.
 */
export const toSafeHtml = z.preprocess(
  v => sanitizeHtml(v == null ? '' : String(v), SAFE_HTML_OPTIONS),
  z.string()
);

/**
 * @description Coerces 'true'/'false' string query params to booleans. Optional — passes through undefined.
 */
export const booleanParam = z.preprocess(
  v => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  },
  z.boolean().optional()
);
