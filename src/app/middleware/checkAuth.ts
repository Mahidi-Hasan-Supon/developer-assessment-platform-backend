import type { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utiles/catchAsync";
import { jwtUtils } from "../utiles/jwt";
import config from "../config";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import httpStatus from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import { AppError } from "../utiles/appError";

export interface RequestUser {
  name: string;
  email: string;
  role: UserRole;
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const auth = (...requiredRole: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer")
        ? req.headers.authorization?.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in");
    }
    // console.log("TOKEN:", token);
    // console.log("ACCESS SECRET EXISTS:", !!config.jwt_access_secret);

    const verified = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verified.success) {
      throw new AppError(httpStatus.UNAUTHORIZED, verified.error);
    }

    const { email, name, userId, role } = verified.data as JwtPayload;

    if (requiredRole.length && !requiredRole.includes(role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        statusCode: httpStatus.FORBIDDEN,
        message: "Forbidden, you don't have permission",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        email,
        name,
        role,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Please login again");
    }

    if (user.status === "BLOCKED") {
      throw new AppError(httpStatus.FORBIDDEN, "Your account has been blocked");
    }

    req.user = {
      userId,
      name,
      role,
      email,
    };

    next();
  });
};
