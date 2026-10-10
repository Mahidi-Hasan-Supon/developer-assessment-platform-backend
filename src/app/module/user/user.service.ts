
import {
  Prisma,
  UserRole,
  UserStatus,
} from "../../../../generated/prisma/client";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import {
  UserListQuery,
  UpdateUserStatusInput,
} from "./user.validation";

export const getAllUsers = async (query: UserListQuery) => {
  const { search, role, status, page, limit } = query;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAllCandidates = async (query: UserListQuery) => {
  const { search, status, page, limit } = query;

  const where: Prisma.UserWhereInput = {
    role: UserRole.CANDIDATE,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [candidates, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: candidates,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSingleUser = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
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
    throw new AppError(404, "User not found");
  }

  return user;
};

export const updateUserStatus = async (
  id: string,
  payload: UpdateUserStatusInput,
  adminId: string,
) => {
  if (id === adminId) {
    throw new AppError(400, "You cannot change your own status");
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role === UserRole.ADMIN) {
    throw new AppError(
      403,
      "Admin account status cannot be changed here",
    );
  }

  if (user.status === payload.status) {
    throw new AppError(
      400,
      `User is already ${payload.status.toLowerCase()}`,
    );
  }

  return prisma.user.update({
    where: { id },
    data: { status: payload.status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
};

export const updateCandidateStatus = async (
  id: string,
  status: UserStatus,
) => {
  const candidate = await prisma.user.findFirst({
    where: {
      id,
      role: UserRole.CANDIDATE,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!candidate) {
    throw new AppError(404, "Candidate not found");
  }

  if (candidate.status === status) {
    throw new AppError(
      400,
      `Candidate is already ${status.toLowerCase()}`,
    );
  }

  return prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
};

export const userService = {
  getAllUsers,
  getAllCandidates,
  getSingleUser,
  updateUserStatus,
  updateCandidateStatus,
};
