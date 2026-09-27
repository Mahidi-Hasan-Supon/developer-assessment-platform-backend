import { Router } from "express";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { resultController } from "./result.controller";
import { resultValidation } from "./result.validation";

const router = Router();

router.post(
  "/",
  auth(UserRole.COMPANY),
  validationRequest(resultValidation.createResultSchema),
  resultController.createResult,
);

router.patch(
  "/:resultId/evaluate",
  auth(UserRole.COMPANY),
  resultController.evaluateResult,
);

router.patch(
  "/publish/:resultId",
  auth(UserRole.COMPANY),
  resultController.publishResult,
);

router.get("/my", auth(UserRole.CANDIDATE), resultController.getMyResults);

router.get(
  "/:resultId",
  auth(UserRole.CANDIDATE),
  resultController.getResultById,
);

export const resultRoute = router;
