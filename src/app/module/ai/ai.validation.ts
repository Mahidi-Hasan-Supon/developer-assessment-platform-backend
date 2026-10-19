
import { z } from "zod";

const askAssistantSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required")
    .max(2000, "Question cannot exceed 2000 characters"),
});

export const aiValidation = {
  askAssistantSchema,
};
