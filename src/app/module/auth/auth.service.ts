import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { jwtUtils } from "../../utiles/jwt";
import {
  ILoginPayload,
  IRegisterPayload,
  IResetPasswordPayload,
  IVerifyPayload,
} from "./auth.interface";
import config from "../../config";
import { JwtPayload } from "jsonwebtoken";
import { UserStatus } from "../../../../generated/prisma/enums";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import path from "path";
import ejs from "ejs";

const registerUser = async (payload: IRegisterPayload) => {
  const { name, password, role } = payload;

  const email = payload.email.trim().toLowerCase();

  // Check existing user
  const isExistUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (isExistUser) {
    throw new AppError(httpStatus.CONFLICT, "User already exists");
  }

  // Hash password
  const passwordSecure = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  // Generate OTP
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  const expirationSeconds = 5 * 60;

  // OTP Redis key
  const otpKey = `assessment:register:otp:${email}`;

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  // Temporary registration data
  const registrationKey = `assessment:register:data:${email}`;

  const registrationData = {
    name,
    email: email,
    password: passwordSecure,
    role,
  };

  await redisClient.set(registrationKey, JSON.stringify(registrationData), {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  // Email template
  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-user-otp.ejs",
  );

  const templateData = {
    name,
    email: email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  // Send email
  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Verification",
    html,
  });
};

const verifyEmail = async (payload: IVerifyPayload) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLowerCase();

  // Check if user already exists
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExist?.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (isUserExist?.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already verified");
  }

  // OTP key
  const otpKey = `assessment:register:otp:${email}`;

  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
  }

  // Delete OTP after successful verification
  await redisClient.del(otpKey);

  // Registration data key
  const registrationKey = `assessment:register:data:${email}`;

  const redisRegistrationData = await redisClient.get(registrationKey);

  if (!redisRegistrationData) {
    throw new AppError(httpStatus.BAD_REQUEST, "Registration data has expired");
  }

  const registrationPayload: IRegisterPayload = JSON.parse(
    redisRegistrationData,
  );

  // Create user after OTP verification
  const createdUser = await prisma.user.create({
    data: {
      name: registrationPayload.name,
      email: registrationPayload.email,
      password: registrationPayload.password,
      role: registrationPayload.role,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },

    omit: {
      password: true,
    },
  });

  // Delete temporary registration data
  await redisClient.del(registrationKey);

  // Welcome email
  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/welcome-email.ejs",
  );

  const templateData = {
    name: createdUser.name,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Welcome To Development Assessment Platform",
    html,
  });

  // JWT payload
  const jwtPayload = {
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
  };

  // Access token
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  // Refresh token
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    user: createdUser,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginPayload) => {
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

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const otpValue = crypto.randomInt(100000, 1000000).toString();

  const otpKey = `assessment:forget:password:reset:otp${user.email}`;

  const expiredTime = 5 * 60;

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: expiredTime,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password.ejs",
  );

  const templateData = {
    name: user.name,
    otpValue,
    expirationMinutes: expiredTime / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: `"Development Assessment Platform" <${config.email_sender}>`,
    to: user.email,
    subject: "Password forget OTP",
    html,
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, newPassword, otp } = payload;

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
  }

  // 2. Check user status
  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  // 3. Check deleted user
  if (user.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  // 4. Check email verification
  if (!user.emailVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please verify your email first",
    );
  }

  // 5. Google account cannot reset password this way
  // if (user.googleId && user.authProvider === AuthProvider.GOOGLE) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     "This account is registered with Google",
  //   );
  // }

  // 6. Redis OTP key
  const otpKey = `assessment:forgot-password:otp:${user.email}`;

  // 7. Get OTP from Redis
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "OTP has expired or does not exist",
    );
  }

  // 8. Compare OTP
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
  }

  // 9. Hash new password
  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  // 10. Update password
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  // 11. Delete OTP
  await redisClient.del(otpKey);

  // 12. Send confirmation email
  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/reset-password-otp.ejs",
  );

  const templateData = {
    name: user.name,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: user.email,
    subject: "Password Changed Successfully",
    html,
  });

  return {
    message: "Password reset successfully",
  };
};

export const authService = {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
};
