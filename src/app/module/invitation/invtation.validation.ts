import { z } from "zod";

const createInvitationSchema = z.object({
  assessmentId: z
    .string()
    .min(1, "Assessment ID is required"),

  candidateId: z
    .string()
    .min(1, "Candidate ID is required"),

  expiresAt: z
    .coerce
    .date()
    .optional(),
});

const updateInvitationStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "USED",
  ]),
});

export const invitationValidation = {
  createInvitationSchema,
  updateInvitationStatusSchema,
};