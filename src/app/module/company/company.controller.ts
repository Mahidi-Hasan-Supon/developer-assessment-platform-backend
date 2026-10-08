import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { companyService } from "./company.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";
import { CompanyStatus } from "../../../../generated/prisma/enums";

const createCompanyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    const result = await companyService.createCompanyProfile(
      userId as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Company application submitted successfully",
      data: result,
    });
  },
);

const getCompanyApplications = catchAsync(
  async (req: Request, res: Response) => {
    const status = req.query.status as CompanyStatus | undefined;

    const result = await companyService.getCompanyApplications(status);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Company applications retrieved successfully",
      data: result,
    });
  },
);

const updateCompanyApplicationStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status , reviewNote} = req.body;

    const result = await companyService.updateCompanyApplicationStatus(
      id as string,
      status as CompanyStatus,
      reviewNote
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Company application ${status.toLowerCase()} successfully`,
      data: result,
    });
  },
);

export const companyController = {
  createCompanyProfile,
  getCompanyApplications,
  updateCompanyApplicationStatus
};
