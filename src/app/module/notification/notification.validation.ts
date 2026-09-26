import { z } from "zod";

const createNotificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  message: z.string().min(1, "Message is required"),
  type: z.enum([
    "INVITATION",
    "ASSESSMENT",
    "SUBMISSION",
    "RESULT",
    "PAYMENT",
    "SYSTEM",
  ]),
});

const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),

  message: z.string().min(1, "Message is required").optional(),

  type: z
    .enum([
      "INVITATION",
      "ASSESSMENT",
      "SUBMISSION",
      "RESULT",
      "PAYMENT",
      "SYSTEM",
    ])
    .optional(),
});

export const notificationValidation = {
  createNotificationSchema,
  updateNotificationSchema,
};
