import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequestByZod";
import { userValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validationRequest(userValidation.userRegisterSchema),
  authController.registerUser,
);
router.post(
  "/login",
  validationRequest(userValidation.loginZodSchema),
  authController.loginUser,
);
router.get(
  "/getMe",
  auth(UserRole.ADMIN, UserRole.CANDIDATE, UserRole.COMPANY),
  authController.getMe,
);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forget-password",
  validationRequest(userValidation.forgetZodSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validationRequest(userValidation.resetZodSchema),
  authController.resetPassword,
);

router.post("/google-login", authController.googleLogin);

export const authRouter = router;
