import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { authService } from "./auth.service";
import { sendResponse } from "../../utiles/sendResponse";
import { catchAsync } from "../../utiles/catchAsync";

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.registerUser(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registered successfully",
      data: result,
    });
  },
);

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.loginUser(req.body);
    const { accessToken, refreshToken } = result;

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
      },
    });
  },
);

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User retrieved successfully",
    data: user,
  });
});

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new Error("RefreshToken is missing");
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshToken(token);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    // const { user, patient } = result;
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient login successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  },
);

export const authController = {
  registerUser,
  loginUser,
  refreshToken,
  getMe
};
