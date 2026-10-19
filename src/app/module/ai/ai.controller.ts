import { Request, Response } from "express";
import httpStatus from "http-status";

import { aiService } from "./ai.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const askAssistant = catchAsync(async (req: Request, res: Response) => {
  const result = await aiService.askAssistant(req.body.question);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "AI response generated successfully",
    data: result,
  });
});

export const aiController = {
  askAssistant,
};
