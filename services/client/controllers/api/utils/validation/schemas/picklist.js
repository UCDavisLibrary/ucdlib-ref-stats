import * as z from "zod";
import { requiredString, urlFriendlyString } from "./utils.js";
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
          message: 'Picklist with this name already exists',
          path: [] 
        });
      }
    }),
  label: requiredString().pipe(z.string().max(250))
});

export { picklistBaseSchema, picklistCreateSchema };