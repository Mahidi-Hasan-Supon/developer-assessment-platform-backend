import { Request, Response } from "express";
import httpStatus from "http-status";

import { UserRole } from "../../../../generated/prisma/enums";
import { assessmentService } from "./assessment.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const createAssessment = catchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.userId;

  const result = await assessmentService.createAssessment(
    req.body,
    companyId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Assessment created successfully",
    data: result,
  });
});

const getAllAssessments = catchAsync(async (req: Request, res: Response) => {
  const {data , meta} = await assessmentService.getAllAssessments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessments retrieved successfully",
    data,
    meta
  });
});

const getAssessmentById = catchAsync(async (req: Request, res: Response) => {
  const result = await assessmentService.getAssessmentById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment retrieved successfully",
    data: result,
  });
});

const updateAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  const result = await assessmentService.updateAssessment(
    req.params.id as string,
    req.body,
    userId as string,
    role as UserRole,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment updated successfully",
    data: result,
  });
});

const deleteAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

   await assessmentService.deleteAssessment(
    req.params.id as string,
    userId as string,
    role as UserRole,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assessment deleted successfully",
    data: null,
  });
});

export const assessmentController = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
};
