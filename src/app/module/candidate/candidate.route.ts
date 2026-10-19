import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";
import { userController } from "../user/user.controller";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { candidateProfileValidation } from "../user/user.validation";

const router = Router()
router.get(
  "/me",
  auth(UserRole.CANDIDATE),
  userController.getMyProfile,
);

router.patch(
  "/me",
  auth(UserRole.CANDIDATE),
  validationRequest(candidateProfileValidation.updateCandidateProfileSchema),
  userController.updateMyProfile,
);

export const candidateRouter = router