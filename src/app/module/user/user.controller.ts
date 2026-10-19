import { Request, Response } from "express";

import * as UserService from "./user.service";
import { userListQuerySchema, updateUserStatusSchema } from "./user.validation";
import { catchAsync } from "../../utiles/catchAsync";
import { AppError } from "../../utiles/appError";
import { sendResponse } from "../../utiles/sendResponse";
import httpStatus from 'http-status';



const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const query = userListQuerySchema.parse(req.query);
  const result = await UserService.getAllUsers(query);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAllCandidates = catchAsync(async (req: Request, res: Response) => {
  const query = userListQuerySchema.omit({ role: true }).parse(req.query);

  const result = await UserService.getAllCandidates(query);

  res.status(200).json({
    success: true,
    message: "Candidates retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getSingleUser(req.params.id as string);

  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const payload = updateUserStatusSchema.parse(req.body);
  const adminId = req.user?.userId;

  if (!adminId) {
    throw new AppError(401, "Authenticated user not found");
  }

  const user = await UserService.updateUserStatus(
    req.params.id as string,
    payload,
    adminId,
  );

  res.status(200).json({
    success: true,
    message: `User status updated to ${user.status}`,
    data: user,
  });
});

const updateCandidateStatus = catchAsync(
  async (req: Request, res: Response) => {
    const payload = updateUserStatusSchema.parse(req.body);

    const candidate = await UserService.updateCandidateStatus(
      req.params.id as string,
      payload.status,
    );

    res.status(200).json({
      success: true,
      message: `Candidate status updated to ${candidate.status}`,
      data: candidate,
    });
  },
);



const getMyProfile = catchAsync(
  async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const result = await UserService.userService.getMyProfile(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  })}
)

const updateMyProfile = catchAsync(
  async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const result = await UserService.userService.updateMyProfile(
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });

  })

export const candidateProfileController = {
  getMyProfile,
  updateMyProfile,
};

export const userController = {
  getAllUsers,
  getAllCandidates,
  getSingleUser,
  updateUserStatus,
  updateCandidateStatus,
  getMyProfile,
  updateMyProfile
};
