import express from "express";
import { paymentValidation } from "./payment.validation";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequestByZod";

const router = express.Router();

router.post(
  "/create",
  auth(UserRole.CANDIDATE),
  validationRequest(
    paymentValidation.createPaymentSchema,
  ),
  paymentController.createPayment,
);

router.get(
  "/bkash/callback",
  paymentController.bkashCallback,
);

export const paymentRoutes = router;

