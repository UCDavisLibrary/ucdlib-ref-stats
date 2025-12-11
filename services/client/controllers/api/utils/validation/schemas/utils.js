import * as z from "zod";

/**
 * @description Returns "Required" validation message if value is null/undefined/empty
 * @param {String} msg - The validation message to return. Default: 'Required'
 * @returns
 */
const requiredString = (msg = 'Required') =>
  z.preprocess(
    v => (v == null ? '' : v),
    z.string().trim().min(1, msg)
  );

/**
 * @description Validates a value as a required number, allowing string inputs with commas and decimal points
 * Delineates between "required" and "not a number" validation errors
 * @param {Object} messages - Validation messages
 * @param {String} messages.required - The "required" validation message. Default: "Required"
 * @param {String} messages.nan - The "not a number" validation message. Default: "Must be a number"
 * @returns
 */
const requiredNumber = (
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

const urlFriendlyString = z.string().regex(/^[a-z0-9_-]+$/, {
  message: "Must be URL-friendly: lowercase letters, numbers, hyphens, and underscores only."
});

export { requiredString, requiredNumber, urlFriendlyString };
