import { Router } from "express";
import { UserRole } from "../../../../generated/prisma/enums";

import { assessmentController } from "./assessment.controller";
import { assessmentValidation } from "./assessment.validation";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { auth } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/",
  auth(UserRole.COMPANY),
  validationRequest(assessmentValidation.createAssessmentSchema),
  assessmentController.createAssessment,
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.COMPANY, UserRole.CANDIDATE),
  assessmentController.getAllAssessments,
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.COMPANY, UserRole.CANDIDATE),
  assessmentController.getAssessmentById,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  validationRequest(assessmentValidation.updateAssessmentSchema),
  assessmentController.updateAssessment,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  assessmentController.deleteAssessment,
);

export const assessmentRoutes = router;
