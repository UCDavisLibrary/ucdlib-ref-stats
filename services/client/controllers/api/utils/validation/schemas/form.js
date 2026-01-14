import * as z from "zod";
import { requiredString, urlFriendlyString, pageParam, perPageParam, booleanParam, toString } from "./utils.js";
import models from '#models';
import logger from '#lib/logger.js';

const srNameUnique = async (data, ctx) => {
  if ( !data.name ) return;
  const existing = await models.form.get(data.name);
  if (existing.error) {
    logger.error('Database error validating form name uniqueness', { error: existing.error });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A database error occurred',
      fatal: true
    });
    return;
  }
  if ( !existing.res ) {
    return;
  }
  if ( !data.form_id || existing.res.form_id !== data.form_id ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A form with this name already exists',
      path: ['name']
    });
  }
}

const srValidateFormId = async (data, ctx) => {
  if ( data.form_id ) {
    const existing = await models.form.get(data.form_id);
    if (existing.error) {
      logger.error('Database error validating form ID', { error: existing.error });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A database error occurred',
        fatal: true
      });
      return;
    }
    if (!existing.res) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Form not found',
        path: ['form_id']
      });
    }
  } else {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'form_id is required',
      path: ['form_id']
    });
  }
}

const formBaseSchema = z.object({
  description: toString.pipe(z.string().max(300)).optional(),
  label: requiredString().pipe(z.string().max(250)),
  is_archived: z.boolean().optional()
});

const formCreateSchema = formBaseSchema.extend({
  name: requiredString().pipe(urlFriendlyString.max(250))
  })
  .superRefine(srNameUnique);

const formUpdateSchema = formBaseSchema.partial().extend({
  form_id: z.string().uuid()
})
.superRefine(srValidateFormId);

const formIdOrNameSchema = z.object({
  idOrName: requiredString()
    .superRefine(async (idOrName, ctx) => {
      const existing = await models.form.get(idOrName);

      if (existing.error) {
        throw existing.error;
      }

      if (!existing.res) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Form not found',
          path: []
        });
      }
      return true;
    })
});


const formQuerySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  q: z.string().max(250).optional()
});

export {
  formCreateSchema,
  formQuerySchema,
  formUpdateSchema,
  formIdOrNameSchema,
  srValidateFormId
}