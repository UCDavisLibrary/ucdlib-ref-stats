import * as z from "zod";
import { requiredString, urlFriendlyString, pageParam, perPageParam, booleanParam } from "./utils.js";
import models from '../../../../../../lib/models/index.js';

const picklistBaseSchema = z.object({
  description: z.string().max(300).optional()
});

const picklistCreateSchema = picklistBaseSchema.extend({
  name: requiredString()
    .pipe(urlFriendlyString.max(250))
      .superRefine(async (name, ctx) => {
      const existing = await models.picklist.get(name);

      if (existing.error) {
        throw existing.error;
      }

      if (existing.res) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A picklist with this name already exists',
          path: [] 
        });
      }
    }),
  label: requiredString().pipe(z.string().max(250))
});

const picklistQuerySchema = z.object({
  page: pageParam,
  per_page: perPageParam(15),
  active: z.preprocess(
    v => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    },
    z.union([z.literal(true), z.literal(false)]).optional()
  ),
  archived_only: booleanParam,
  active_only: booleanParam
});

export { picklistBaseSchema, picklistCreateSchema, picklistQuerySchema };