import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";
import { answerService } from "./answer.sevice";


const createAnswer = catchAsync(
  async (req: Request, res: Response) => {
    const candidateId = req.user?.userId as string;

    const result = await answerService.createAnswer(
      req.body,
      candidateId,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Answer submitted successfully",
      data: result,
    });
  },
);

const getMyAnswers = catchAsync(
  async (req: Request, res: Response) => {
    const { submissionId } = req.params;

    const candidateId = req.user?.userId as string;

    const result = await answerService.getMyAnswers(
      submissionId as string,
      candidateId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Answers retrieved successfully",
      data: result,
    });
  },
);

export const answerController = {
  createAnswer,
  getMyAnswers,
};