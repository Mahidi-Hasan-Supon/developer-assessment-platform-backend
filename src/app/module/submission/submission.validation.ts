import { z } from "zod";

const createSubmissionSchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required"),
});

const updateSubmissionStatusSchema = z.object({
  status: z.enum(["PENDING", "EVALUATED"]),
});

export const submissionValidation = {
  createSubmissionSchema,
  updateSubmissionStatusSchema,
};