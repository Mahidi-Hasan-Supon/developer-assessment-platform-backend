import { z } from "zod";

const createAttemptSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
});

const updateAttemptStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "SUBMITTED", "EXPIRED", "AUTO_SUBMITTED"]),
});

export const attemptValidation = {
  createAttemptSchema,
  updateAttemptStatusSchema,
};
