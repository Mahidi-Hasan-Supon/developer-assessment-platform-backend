import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";
import { analyticsService } from "./analytics.service";

const getCompanyAnalytics = catchAsync(async (req: Request, res: Response) => {
  const companyId = req.user?.userId;

  const result = await analyticsService.getCompanyAnalytics(companyId!);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company analytics retrieved successfully",
    data: result,
  });
});

const getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await analyticsService.getAdminAnalytics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin analytics retrieved successfully",
    data: result,
  });
});

const getCandidateAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const candidateId = req.user?.userId;

    const result = await analyticsService.getCandidateAnalytics(candidateId!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Candidate analytics retrieved successfully",
      data: result,
    });
  },
);

export const analyticsController = {
  getCompanyAnalytics,
  getAdminAnalytics,
  getCandidateAnalytics,
};
