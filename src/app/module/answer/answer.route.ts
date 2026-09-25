import { Router } from "express";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { answerController } from "./answer.controller";
import { answerValidation } from "./answer.validation";

const router = Router();

router.post(
  "/",
  auth(UserRole.CANDIDATE),
  validationRequest(answerValidation.createAnswerSchema),
  answerController.createAnswer,
);

router.get(
  "/submission/:submissionId",
  auth(UserRole.CANDIDATE),
  answerController.getMyAnswers,
);

router.patch(
  "/:answerId/evaluate",
  auth(UserRole.COMPANY),
  validationRequest(answerValidation.evaluateAnswerSchema),
  answerController.evaluateAnswer,
);

export const answerRoute = router;
