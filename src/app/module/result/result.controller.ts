import { Request, Response } from "express";
import httpStatus from "http-status";
import { resultService } from "./result.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const createResult = catchAsync(
  async (req: Request, res: Response) => {
    const companyId = req.user?.userId as string;

    const result = await resultService.createResult(
      req.body,
      companyId,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Result created successfully",
      data: result,
    });
  },
);

const evaluateResult = catchAsync(
  async (req: Request, res: Response) => {
    const { resultId } = req.params;

    const companyId = req.user?.userId as string;

    const result = await resultService.evaluateResult(
      resultId as string,
      companyId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Result evaluated successfully",
      data: result,
    });
  },
);




const getMyResults = catchAsync(
  async (req: Request, res: Response) => {
    const candidateId = req.user?.userId as string;

    const result = await resultService.getMyResults(
      candidateId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Results retrieved successfully",
      data: result,
    });
  },
);

const getResultById = catchAsync(
  async (req: Request, res: Response) => {
    const { resultId } = req.params;

    const candidateId = req.user?.userId as string;

    const result = await resultService.getResultById(
      resultId as string,
      candidateId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  },
);

export const resultController = {
  createResult,
  getMyResults,
  getResultById,
  evaluateResult
};