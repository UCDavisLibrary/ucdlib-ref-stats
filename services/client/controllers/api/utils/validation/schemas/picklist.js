import * as z from "zod";
import { requiredString, urlFriendlyString, pageParam, perPageParam, booleanParam, toString } from "./utils.js";
import models from '#models';

const picklistBaseSchema = z.object({
  description: toString.pipe(z.string().max(300)).optional(),
  label: requiredString().pipe(z.string().max(250)),
  is_archived: z.boolean().optional()
});

const picklistItemSchema = z.object({
  label: requiredString().pipe(z.string().max(250)),
  value: requiredString().pipe(z.string().max(250)),
  description: toString.pipe(z.string().max(300)).optional(),
  is_archived: z.boolean().optional(),
  sort_order: z.coerce.number().int().nonnegative().optional(),
  include_segment: z.array(z.string().max(250)).optional(),
  exclude_segment: z.array(z.string().max(250)).optional()
});

const picklistCreateSchema = picklistBaseSchema.extend({
  name: requiredString()
    .pipe(urlFriendlyString.max(250))
      .superRefine(async (name, ctx) => {
      const existing = await models.picklist.get(name);

      if (existing.error) {
        logger.error('Database error validating picklist name uniqueness', { error: existing.error });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A database error occurred',
          fatal: true
        });
        return;
      }

      if (existing.res) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A picklist with this name already exists',
          path: [] 
        });
      }
    }),
  items: z.array(picklistItemSchema).optional()
});

const picklistItemUpdateSchema = picklistItemSchema.partial().extend({
  picklist_item_id: z.string().uuid().optional()
});

const picklistUpdateSchema = picklistBaseSchema.partial().extend({
  items: z.array(picklistItemUpdateSchema).optional()
});

const picklistIdOrNameSchema = z.object({
  idOrName: requiredString()
    .superRefine(async (idOrName, ctx) => {
      const existing = await models.picklist.get(idOrName);

      if (existing.error) {
        logger.error('Database error validating picklist ID or name', { error: existing.error });
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
          message: 'Picklist not found',
          path: []
        });
      }
      return true;
    })
});


const picklistQuerySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  archived_only: booleanParam,
  active_only: booleanParam,
  q: z.string().max(250).optional()
});

export { 
  picklistBaseSchema, 
  picklistCreateSchema, 
  picklistQuerySchema, 
  picklistUpdateSchema,
  picklistIdOrNameSchema
};