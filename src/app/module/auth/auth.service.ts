import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { jwtUtils } from "../../utiles/jwt";
import { TLoginPayload, TRegisterPayload } from "./auth.interface";
import config from "../../config";
import { JwtPayload } from "jsonwebtoken";
import { UserStatus } from "../../../../generated/prisma/enums";
import { get } from "node:http";

const registerUser = async (payload: TRegisterPayload) => {
  const { name, email, password, role } = payload;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this email",
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      //   emailVerified: true,
      createdAt: true,
    },
  });

  return user;
};

const loginUser = async (payload: TLoginPayload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.deletedAt) {
    throw new AppError(httpStatus.FORBIDDEN, "User has been deleted");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Password login is not available for this account",
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    process.env.JWT_ACCESS_SECRET!,
    process.env.JWT_ACCESS_EXPIRES_IN!,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    process.env.JWT_REFRESH_SECRET!,
    process.env.JWT_REFRESH_EXPIRES_IN!,
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      //   emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      candidateProfile: true,
      companyProfile: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: data.userId as string,
    },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User is inactive or not found",
    );
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const authService = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
};
