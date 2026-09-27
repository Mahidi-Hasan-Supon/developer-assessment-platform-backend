import express from "express";

import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { analyticsController } from "./analytics.controller";

const router = express.Router();

router.get(
  "/company",
  auth(UserRole.COMPANY),
  analyticsController.getCompanyAnalytics,
);

router.get(
  "/admin",
  auth(UserRole.ADMIN),
  analyticsController.getAdminAnalytics,
);

router.get(
  "/candidate",
  auth(UserRole.CANDIDATE),
  analyticsController.getCandidateAnalytics,
);

export const analyticsRoutes = router;
