import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utiles/catchAsync";
import { candidateProfileService } from "./candiate.service";
import { sendResponse } from "../../utiles/sendResponse";


const getMyProfile = catchAsync(
    async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const result = await candidateProfileService.getMyProfile(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
}
)

const updateMyProfile = catchAsync(
    async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const result = await candidateProfileService.updateMyProfile(
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
}
)
export const candidateProfileController = {
  getMyProfile,
  updateMyProfile,
};
