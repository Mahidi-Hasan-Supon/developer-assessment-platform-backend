

import { z } from "zod";

const assessmentStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "ARCHIVED",
]);

const createAssessmentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),

    description: z.string().optional(),

    durationMinutes: z
      .number()
      .int("Duration must be an integer")
      .positive("Duration must be greater than 0"),

    totalMarks: z
      .number()
      .int("Total marks must be an integer")
      .positive("Total marks must be greater than 0"),

    passMarks: z
      .number()
      .int("Pass marks must be an integer")
      .positive("Pass marks must be greater than 0"),
  })
  .refine((data) => data.passMarks <= data.totalMarks, {
    message: "Pass marks cannot be greater than total marks",
    path: ["passMarks"],
  });

const updateAssessmentSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),

    description: z.string().optional(),

    durationMinutes: z
      .number()
      .int("Duration must be an integer")
      .positive("Duration must be greater than 0")
      .optional(),

    totalMarks: z
      .number()
      .int("Total marks must be an integer")
      .positive("Total marks must be greater than 0")
      .optional(),

    passMarks: z
      .number()
      .int("Pass marks must be an integer")
      .positive("Pass marks must be greater than 0")
      .optional(),

    status: assessmentStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (
        data.passMarks !== undefined &&
        data.totalMarks !== undefined
      ) {
        return data.passMarks <= data.totalMarks;
      }

      return true;
    },
    {
      message: "Pass marks cannot be greater than total marks",
      path: ["passMarks"],
    },
  );

export const assessmentValidation = {
  createAssessmentSchema,
  updateAssessmentSchema,
};