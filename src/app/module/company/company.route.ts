import express, { Router } from "express";

import { companyController } from "./company.controller";
import { companyValidation } from "./company.validation";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";
import { validationRequest } from "../../middleware/validationRequestByZod";

const router = Router();

router.post(
  "/apply",
  auth(UserRole.COMPANY),
  validationRequest(companyValidation.createCompanyProfileSchema),
  companyController.createCompanyProfile,
);

router.get(
  "/applications",
  auth(UserRole.ADMIN),
  companyController.getCompanyApplications,
);
router.patch(
  "/applications/:id/status",
  auth(UserRole.ADMIN),
  validationRequest(companyValidation.updateCompanyStatusSchema),
  companyController.updateCompanyApplicationStatus,
);

export const companyRouter = router;
