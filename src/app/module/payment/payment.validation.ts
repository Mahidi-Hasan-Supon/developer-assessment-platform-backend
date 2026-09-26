import { z } from "zod";

const createPaymentSchema = z.object({
  assessmentId: z.string().uuid(),
});

export const paymentValidation = {
  createPaymentSchema,
};
