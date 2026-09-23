import { Router } from "express";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { invitationController } from "./invitation.controller";
import { invitationValidation } from "./invtation.validation";

const router = Router();

router.post(
  "/",
  auth(UserRole.COMPANY),
  validationRequest(invitationValidation.createInvitationSchema),
  invitationController.createInvitation,
);

router.get(
  "/my",
  auth(UserRole.CANDIDATE),
  invitationController.getMyInvitations,
);

router.get(
  "/assessment/:assessmentId",
  auth(UserRole.COMPANY),
  invitationController.getAssessmentInvitations,
);

router.patch(
  "/:invitationId/status",
  auth(UserRole.CANDIDATE, UserRole.COMPANY),
  validationRequest(invitationValidation.updateInvitationStatusSchema),
  invitationController.updateInvitationStatus,
);

router.delete(
  "/:invitationId",
  auth(UserRole.COMPANY),
  invitationController.deleteInvitation,
);

export const invitationRoute = router;
