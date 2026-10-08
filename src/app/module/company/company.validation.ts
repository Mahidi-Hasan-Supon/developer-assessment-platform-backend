import { z } from "zod";

const createCompanyProfileSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters"),

  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),

  website: z
    .string()
    .url("Website must be a valid URL")
    .optional()
    .or(z.literal("")),

  location: z
    .string()
    .max(200, "Location must be less than 200 characters")
    .optional(),

  industry: z
    .string()
    .max(100, "Industry must be less than 100 characters")
    .optional(),
});

const updateCompanyStatusSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reviewNote: z.string().max(1000).optional(),
  })
  .refine(
    (data) =>
      data.status === "APPROVED" ||
      (data.reviewNote && data.reviewNote.trim().length >= 5),
    {
      message: "Review note is required when rejecting a company",
      path: ["reviewNote"],
    },
  );
export const companyValidation = {
  createCompanyProfileSchema,
  updateCompanyStatusSchema,
};
