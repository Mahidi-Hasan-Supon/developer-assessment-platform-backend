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

export const companyValidation = {
  createCompanyProfileSchema,
};