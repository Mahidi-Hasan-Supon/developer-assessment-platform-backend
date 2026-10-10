import { Router } from "express";

import { auth } from "../../middleware/checkAuth";
import { userController } from "./user.controller";
import { UserRole } from "../../../../generated/prisma/enums";

const router = Router();

// Candidate list: Admin only
router.get(
  "/candidates",
  auth(UserRole.ADMIN),
  userController.getAllCandidates,
);

// Candidate Block / Unblock: Admin only
router.patch(
  "/candidates/:id/status",
  auth(UserRole.ADMIN),
  userController.updateCandidateStatus,
);

// Generic user list: Admin only
router.get("/", auth(UserRole.ADMIN), userController.getAllUsers);

// User details: Admin only
router.get("/:id", auth(UserRole.ADMIN), userController.getSingleUser);

// Generic user Block / Unblock: Admin only
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN),
  userController.updateUserStatus,
);

export const userRoute = router;
