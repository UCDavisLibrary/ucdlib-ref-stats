import * as z from "zod";

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

export const toString = z.preprocess(
  v => {
    if (v == null ) return '';
    return String(v);
  }, z.string()
);

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

export const urlFriendlyString = z.string().regex(/^[a-z0-9_-]+$/, {
  message: "Must be URL-friendly: lowercase letters, numbers, hyphens, and underscores only."
});

export const pageParam = z.preprocess(
  v => {
    if (v == null || v === '') return 1;
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  },
  z.number().int().positive("Page must be a positive integer")
);

export const perPageParam = (defaultValue = 15, maxValue = 50) =>
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

export const booleanParam = z.preprocess(
  v => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  },
  z.boolean().optional()
);
