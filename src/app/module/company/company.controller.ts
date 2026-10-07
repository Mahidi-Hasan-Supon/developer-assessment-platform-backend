import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { companyService } from "./company.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

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

export const companyController = {
  createCompanyProfile,
};
