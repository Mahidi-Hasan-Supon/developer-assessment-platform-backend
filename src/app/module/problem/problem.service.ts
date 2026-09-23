import { UserRole } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { ICreateProblem, IUpdateProblem } from "./problem.interface";
import httpStatus from "http-status";

const createProblem = async (payload: ICreateProblem, userId: string) => {
  const createdProblem = await prisma.problem.create({
    data: {
      title: payload.title,
      description: payload.description,
      type: payload.type,
      difficulty: payload.difficulty,
      marks: payload.marks,
      options: payload.options as any,
      answer: payload.answer,
      createdBy: userId,
    },
  });

  return createdProblem;
};

const getAllProblems = async () => {
  const problems = await prisma.problem.findMany({
    where: {
      deletedAt: null,
    },

    orderBy: {
      createdAt: "desc",
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return problems;
};

const getProblemById = async (id: string) => {
  const problem = await prisma.problem.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found");
  }

  return problem;
};

const updateProblem = async (
  id: string,
  payload: IUpdateProblem,
  userId: string,
  role: UserRole,
) => {
  const problem = await prisma.problem.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found");
  }

//   if (problem.createdBy !== userId) {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "You can only update your own problem",
//     );
//   }
//   if (role !== UserRole.ADMIN && problem.createdBy !== userId) {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "You can only update your own problem",
//     );
//   }

  
//   if (role !== UserRole.ADMIN && problem.createdBy !== userId) {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "You can only update your own problem",
//     );
//   }

//   if (problem.createdBy !== userId) {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "You can only delete your own problem",
//     );
  
  const isAdmin = role === UserRole.ADMIN;
  const isOwner = problem.createdBy === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this problem",
    );
  }

  const updatedProblem = await prisma.problem.update({
    where: {
      id,
    },

    data: {
      ...payload,
      options: payload.options as any,
    },
  });

  return updatedProblem;
};

const deleteProblem = async (id: string, userId: string, role: UserRole) => {
  const problem = await prisma.problem.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found");
  }

//   if (role !== UserRole.ADMIN && problem.createdBy !== userId) {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "You can only update your own problem",
//     );
//   }

//   if (problem.createdBy !== userId) {
//     throw new AppError(
//       httpStatus.FORBIDDEN,
//       "You can only delete your own problem",
//     );
//   }
  const isAdmin = role === UserRole.ADMIN;
  const isOwner = problem.createdBy === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this problem",
    );
  }

  await prisma.problem.update({
    where: {
      id,
    },

    data: {
      deletedAt: new Date(),
    },
  });

  return null;
};

export const problemService = {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
};
