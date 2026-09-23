import { Request, Response } from "express";
import httpStatus from "http-status";

import { UserRole } from "../../../../generated/prisma/enums";
import { assessmentProblemService } from "./assessmentProblem.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const createAssessmentProblem = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const payload = req.body
    const userId = req.user?.userId as string;
    const role = req.user?.role as UserRole;

    const result = await assessmentProblemService.createAssessmentProblem(
      assessmentId as string,
      payload,
      userId,
      role,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Assessment problem added successfully",
      data: result,
    });
  },
);

const getAssessmentProblems = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId } = req.params;

    const userId = req.user?.userId as string;
    const role = req.user?.role as UserRole;

    const result = await assessmentProblemService.getAssessmentProblems(
      assessmentId as string,
      userId,
      role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assessment problems retrieved successfully",
      data: result,
    });
  },
);

const updateAssessmentProblem = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId, problemId } = req.params;

    const userId = req.user?.userId as string;
    const role = req.user?.role as UserRole;

    const result = await assessmentProblemService.updateAssessmentProblem(
      assessmentId as string,
      problemId as string,
      req.body,
      userId,
      role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assessment problem updated successfully",
      data: result,
    });
  },
);

const deleteAssessmentProblem = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId, problemId } = req.params;

    const userId = req.user?.userId as string;
    const role = req.user?.role as UserRole;

    const result = await assessmentProblemService.deleteAssessmentProblem(
      assessmentId as string,
      problemId as string,
      userId,
      role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assessment problem deleted successfully",
      data: result,
    });
  },
);

export const assessmentProblemController = {
  createAssessmentProblem,
  getAssessmentProblems,
  updateAssessmentProblem,
  deleteAssessmentProblem,
};
