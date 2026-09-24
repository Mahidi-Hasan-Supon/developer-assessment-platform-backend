import { Router } from "express";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { submissionController } from "./submission.controller";
import { submissionValidation } from "./submission.validation";

const router = Router();

router.post(
  "/",
  auth(UserRole.CANDIDATE),
  validationRequest(
    submissionValidation.createSubmissionSchema,
  ),
  submissionController.createSubmission,
);

router.get(
  "/my",
  auth(UserRole.CANDIDATE),
  submissionController.getMySubmissions,
);

router.get(
  "/:submissionId",
  auth(UserRole.CANDIDATE),
  submissionController.getSubmissionById,
);

export const submissionRoute = router;


