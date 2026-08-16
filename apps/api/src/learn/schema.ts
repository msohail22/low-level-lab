import { z } from "zod";

export const submitAttemptSchema = z
  .object({
    optionIds: z.array(z.string().min(1)).default([]),
    booleanValue: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasOptions = data.optionIds.length > 0;
    const hasBool = typeof data.booleanValue === "boolean";
    if (hasOptions === hasBool) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either optionIds or booleanValue (not both/neither)",
      });
    }
  });

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
