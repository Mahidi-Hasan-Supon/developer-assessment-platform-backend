import { z } from "zod";

const createAnswerSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  problemId: z.string().min(1, "Problem ID is required"),
  answer: z.string().optional(),
});

export const answerValidation = {
  createAnswerSchema,
};