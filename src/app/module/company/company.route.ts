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

export const companyRouter = router;
