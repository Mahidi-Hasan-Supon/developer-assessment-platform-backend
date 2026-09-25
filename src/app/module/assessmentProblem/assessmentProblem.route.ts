import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { assessmentProblemValidation } from "./assessmentProblem.validation";
import { assessmentProblemController } from "./assessmentProblem.controller";

const router = Router();

router.post(
  "/:assessmentId/problems",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  validationRequest(assessmentProblemValidation.createAssessmentProblemSchema),
  assessmentProblemController.createAssessmentProblem,
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  assessmentProblemController.getAllAssessmentProblems,
);

router.get(
  "/:assessmentId/problems",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  assessmentProblemController.getByIdAssessmentProblems,
);

router.patch(
  "/:assessmentId/problems/:problemId",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  validationRequest(assessmentProblemValidation.updateAssessmentProblemSchema),
  assessmentProblemController.updateAssessmentProblem,
);

router.delete(
  "/:assessmentId/problems/:problemId",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  assessmentProblemController.deleteAssessmentProblem,
);

export const assessmentProblemRoute = router;
