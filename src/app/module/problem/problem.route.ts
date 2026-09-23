import { Router } from "express";

import { problemController } from "./problem.controller";
import { problemValidation } from "./problem.validation";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { auth } from "../../middleware/checkAuth";

import { UserRole } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  validationRequest(problemValidation.createProblemSchema),
  problemController.createProblem,
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.COMPANY, UserRole.CANDIDATE),
  problemController.getAllProblems,
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.COMPANY, UserRole.CANDIDATE),
  problemController.getProblemById,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  validationRequest(problemValidation.updateProblemSchema),
  problemController.updateProblem,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  problemController.deleteProblem,
);

export const problemRouter = router;
