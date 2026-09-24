import { Difficulty, ProblemType, UserRole } from "../../../../generated/prisma/enums";
import { ProblemWhereInput } from "../../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { ICreateProblem, IQuery, IUpdateProblem } from "./problem.interface";
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

const getAllProblems = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: ProblemWhereInput[] = [];

  // Searching
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // Filtering
  if (query.type) {
    andConditions.push({
      type: query.type as ProblemType,
    });
  }

  if (query.difficulty) {
    andConditions.push({
      difficulty: query.difficulty as Difficulty,
    });
  }

  if (query.createdBy) {
    andConditions.push({
      createdBy: query.createdBy,
    });
  }

  // Soft deleted problems বাদ
  andConditions.push({
    deletedAt: null,
  });

  const allProblems = await prisma.problem.findMany({
    where: {
      AND: andConditions.length > 0 ? andConditions : undefined,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
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

  const totalProblemCount = await prisma.problem.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: allProblems,
    meta: {
      page,
      limit,
      total: totalProblemCount,
      totalPages: Math.ceil(totalProblemCount / limit),
    },
  };
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
