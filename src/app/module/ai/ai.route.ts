import express, { Router } from "express";
import { aiController } from "./ai.controller";
import { aiValidation } from "./ai.validation";
import { validationRequest } from "../../middleware/validationRequestByZod";

const router = Router();

router.post(
  "/ask",
  validationRequest(aiValidation.askAssistantSchema),
  aiController.askAssistant,
);

export const aiRouter= router;