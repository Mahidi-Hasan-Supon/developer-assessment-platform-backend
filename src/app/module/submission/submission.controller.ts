import { Request, Response } from "express";
import httpStatus from "http-status";

import { submissionService } from "./submission.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";
import { sub } from "date-fns";

const createSubmission = catchAsync(
  async (req: Request, res: Response) => {
    const candidateId = req.user?.userId as string;

    const result =
      await submissionService.createSubmission(
        req.body,
        candidateId,
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Submission created successfully",
      data: result,
    });
  },
);

const getMySubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const candidateId = req.user?.userId as string;

    const result =
      await submissionService.getMySubmissions(
        candidateId,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submissions retrieved successfully",
      data: result,
    });
  },
);

const getSubmissionById = catchAsync(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;

    const candidateId = req.user?.userId as string;

    const result =
      await submissionService.getSubmissionById(
        submissionId as string,
        candidateId,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission retrieved successfully",
      data: result,
    });
  },
);

const submitSubmission = catchAsync(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;

    const candidateId = req.user?.userId as string;

    const result = await submissionService.submitSubmission(
      submissionId as string,
      candidateId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission submitted and evaluated successfully",
      data: result,
    });
  },
);

export const submissionController = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  submitSubmission
};