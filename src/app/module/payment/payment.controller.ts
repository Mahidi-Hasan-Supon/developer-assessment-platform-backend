import { Request, Response } from "express";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const createPayment = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId } = req.body;

    const result = await paymentService.createPayment(
      assessmentId,
      req.user!.userId,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Payment initiated successfully",
      data: result,
    });
  },
);

const bkashCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentID, status } = req.query;

    const result =
      await paymentService.handleBkashCallback(
        paymentID as string,
        status as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: result.success,
      message: result.message,
      data: result,
    });
  },
);

export const paymentController = {
  createPayment,
  bkashCallback,
};

