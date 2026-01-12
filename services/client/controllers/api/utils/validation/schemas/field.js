import * as z from "zod";
import { requiredString, urlFriendlyString, pageParam, perPageParam, booleanParam, toString } from "./utils.js";
import models from '#models';
import definitions from '#lib/definitions.js';

const fieldTypeEnum = z.enum(definitions.fieldTypes.map(ft => ft.value));

const srNameUnique = async (data, ctx) => {
  if ( !data.name ) return;
  const existing = await models.field.get(data.name);
  if (existing.error) {
    throw existing.error;
  }
  if ( !existing.res ) {
    return;
  }
  if ( !data.form_field_id || existing.res.form_field_id !== data.form_field_id ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A field with this name already exists',
      path: ['name']
    });
  }
}

const srValidatePicklistId = async (data, ctx) => {
  let fieldType = data.field_type;

  // just picklist_id was patched
  if ( !data.field_type && data.picklist_id !== undefined && data.form_field_id ) {
    const existing = await models.field.get(data.form_field_id);
    if (existing.error) {
      throw existing.error;
    }
    if (existing.res) {
      fieldType = existing.res.field_type;
    }
  }
  if (fieldType === 'picklist') {
    if (!data.picklist_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A picklist is required when field_type is picklist',
        path: ['picklist_id']
      });
    } else {
        const existing = await models.picklist.get(data.picklist_id);
  
        if (existing.error) {
          throw existing.error;
        }

        if (!existing.res) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'The specified picklist does not exist',
            path: ['picklist_id']
          });
        }
    }
  }
}

const srValidateFieldId = async (data, ctx) => {
  if ( data.form_field_id ) {
    const existing = await models.field.get(data.form_field_id);
    if (existing.error) {
      throw existing.error;
    }
    if (!existing.res) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Field not found',
        path: ['form_field_id']
      });
    }
  } else {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'form_field_id is required',
      path: ['form_field_id']
    });
  }
}

const fieldBaseSchema = z.object({
  description: toString.pipe(z.string().max(300)).optional(),
  label: requiredString().pipe(z.string().max(250)),
  field_type: fieldTypeEnum,
  picklist_id: z.string().uuid().nullish(),
  is_archived: z.boolean().optional(),
  arl_required: z.boolean().optional()
});

const fieldCreateSchema = fieldBaseSchema.extend({
  name: requiredString().pipe(urlFriendlyString.max(250))
  })
  .superRefine(srNameUnique)
  .superRefine(srValidatePicklistId);

const fieldUpdateSchema = fieldBaseSchema.partial().extend({
  form_field_id: z.string().uuid()
})
.superRefine(srValidateFieldId)
.superRefine(srValidatePicklistId);

const fieldIdOrNameSchema = z.object({
  idOrName: requiredString()
    .superRefine(async (idOrName, ctx) => {
      const existing = await models.field.get(idOrName);

      if (existing.error) {
        throw existing.error;
      }

      if (!existing.res) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Field not found',
          path: []
        });
      }
      return true;
    })
});


const fieldQuerySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  q: z.string().max(250).optional(),
  form: z.string().optional()
});

export {
  fieldCreateSchema,
  fieldQuerySchema,
  fieldUpdateSchema,
  fieldIdOrNameSchema
}