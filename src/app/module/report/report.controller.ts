import { Request, Response } from "express";
import httpStatus from "http-status";

import { reportService } from "./report.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

// ======================================
// GENERATE REPORT
// ======================================

const generateReport = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId } = req.body;

    const result =
      await reportService.generateReport(
        assessmentId,
        req.user!.userId,
        req.user!.role,
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Report generated successfully",
      data: result,
    });
  },
);

// ======================================
// GET REPORT BY ASSESSMENT
// ======================================

const getReportByAssessment = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId } = req.params;

    const result =
      await reportService.getReportByAssessment(
        assessmentId as string,
        req.user!.userId,
        req.user!.role,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Report retrieved successfully",
      data: result,
    });
  },
);

// ======================================
// GET ALL REPORTS
// ======================================

const getAllReports = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await reportService.getAllReports(
        req.user!.userId,
        req.user!.role,
        req.query,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reports retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const reportController = {
  generateReport,
  getReportByAssessment,
  getAllReports,
};