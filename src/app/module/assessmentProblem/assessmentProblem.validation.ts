import { z } from "zod";

const createAssessmentProblemSchema = z.object({
  problemId: z.string().min(1, "Problem ID is required"),

  order: z
    .number()
    .int("Order must be an integer")
    .positive("Order must be greater than 0"),

  marks: z
    .number()
    .int("Marks must be an integer")
    .positive("Marks must be greater than 0")
    .optional(),
});

const updateAssessmentProblemSchema = z.object({
  order: z
    .number()
    .int("Order must be an integer")
    .positive("Order must be greater than 0")
    .optional(),

  marks: z
    .number()
    .int("Marks must be an integer")
    .positive("Marks must be greater than 0")
    .optional(),
});

export const assessmentProblemValidation = {
  createAssessmentProblemSchema,
  updateAssessmentProblemSchema,
};
