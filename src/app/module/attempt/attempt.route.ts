import { Router } from "express";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { attemptController } from "./attempt.controller";
import { attemptValidation } from "./attempt.validation";

const router = Router();

router.post(
  "/start",
  auth(UserRole.CANDIDATE),
  validationRequest(attemptValidation.createAttemptSchema),
  attemptController.startAttempt,
);

router.get(
  "/my",
  auth(UserRole.CANDIDATE),
  attemptController.getMyAttempts,
);

router.get(
  "/:attemptId",
  auth(
    UserRole.CANDIDATE,
    UserRole.COMPANY,
    UserRole.ADMIN,
  ),
  attemptController.getAttemptById,
);

router.patch(
  "/:attemptId/submit",
  auth(UserRole.CANDIDATE),
  attemptController.submitAttempt,
);

export const attemptRoute = router;