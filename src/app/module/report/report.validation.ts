import { z } from "zod";

const createReportSchema = z.object({
  body: z.object({
    assessmentId: z.string().uuid(),
  }),
});

export const reportValidation = {
  createReportSchema,
};