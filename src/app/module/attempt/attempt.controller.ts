import { Request, Response } from "express";
import httpStatus from "http-status";
import { UserRole } from "../../../../generated/prisma/enums";
import { attemptService } from "./attempt.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const startAttempt = catchAsync(async (req: Request, res: Response) => {
  const candidateId = req.user?.userId as string;

  const result = await attemptService.startAttempt(req.body, candidateId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Assessment attempt started successfully",
    data: result,
  });
});

const getMyAttempts = catchAsync(async (req: Request, res: Response) => {
  const candidateId = req.user?.userId as string;

  const result = await attemptService.getMyAttempts(candidateId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attempts retrieved successfully",
    data: result,
  });
});

const getAllAttempts = catchAsync(async (req: Request, res: Response) => {
  const {data , meta} = await attemptService.getAllAttempts(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attempts retrieved successfully",
    data,
    meta
  });
});

const getAttemptById = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  const userId = req.user?.userId as string;
  const role = req.user?.role as UserRole;

  const result = await attemptService.getAttemptById(
    attemptId as string,
    userId,
    role,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attempt retrieved successfully",
    data: result,
  });
});

const submitAttempt = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  const candidateId = req.user?.userId as string;

  const result = await attemptService.submitAttempt(
    attemptId as string,
    candidateId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attempt submitted successfully",
    data: result,
  });
});

export const attemptController = {
  startAttempt,
  getAllAttempts,
  getMyAttempts,
  getAttemptById,
  submitAttempt,
};
