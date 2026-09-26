import express from "express";
import { reportController } from "./report.controller";
import { reportValidation } from "./report.validation";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validationRequest } from "../../middleware/validationRequestByZod";


const router = express.Router();

// Generate report
router.post(
  "/generate",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  validationRequest(
    reportValidation.createReportSchema,
  ),
  reportController.generateReport,
);

// Get all reports
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  reportController.getAllReports,
);

// Get report by assessment
router.get(
  "/:assessmentId",
  auth(UserRole.ADMIN, UserRole.COMPANY),
  reportController.getReportByAssessment,
);

export const reportRoutes = router;