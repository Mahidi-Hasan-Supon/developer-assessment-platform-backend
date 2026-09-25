import { z } from "zod";

const createAnswerSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  problemId: z.string().min(1, "Problem ID is required"),
  answer: z.string().optional(),
});
const evaluateAnswerSchema = z.object({
  marks: z
    .number()
    .int("Marks must be an integer")
    .min(0, "Marks cannot be negative"),
});

export const answerValidation = {
  createAnswerSchema,
  evaluateAnswerSchema
};
