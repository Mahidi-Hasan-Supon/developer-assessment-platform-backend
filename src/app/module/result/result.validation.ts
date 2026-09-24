import { z } from "zod";

const createResultSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
});

export const resultValidation = {
  createResultSchema,
};