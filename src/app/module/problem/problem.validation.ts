import { z } from "zod";

const problemTypeEnum = z.enum(["MCQ", "WRITTEN", "CODING"]);
const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

const createProblemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),

  type: problemTypeEnum,

  difficulty: difficultyEnum,

  marks: z
    .number()
    .int("Marks must be an integer")
    .positive("Marks must be greater than 0"),

  options: z.unknown().optional(),

  answer: z.string().optional(),
});

const updateProblemSchema = z.object({
  title: z.string().min(1).optional(),

  description: z.string().min(1).optional(),

  type: problemTypeEnum.optional(),

  difficulty: difficultyEnum.optional(),

  marks: z
    .number()
    .int("Marks must be an integer")
    .positive("Marks must be greater than 0")
    .optional(),

  options: z.unknown().optional(),

  answer: z.string().optional(),
});

export const problemValidation = {
  createProblemSchema,
  updateProblemSchema,
};
