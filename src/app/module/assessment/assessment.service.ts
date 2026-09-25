import {
  ICreateAssessment,
  IQuery,
  IUpdateAssessment,
} from "./assessment.interface";
import httpStatus from "http-status";
import { AssessmentStatus, UserRole } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { AssessmentWhereInput } from "../../../../generated/prisma/models";

const createAssessment = async (
  payload: ICreateAssessment,
  companyId: string,
) => {
  const result = await prisma.assessment.create({
    data: {
      title: payload.title,
      description: payload.description,
      durationMinutes: payload.durationMinutes,
      totalMarks: payload.totalMarks,
      passMarks: payload.passMarks,
      companyId,
    },
  });

  return result;
};

const getAllAssessments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: AssessmentWhereInput[] = [];

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
  if (query.status) {
    andConditions.push({
      status: query.status as AssessmentStatus,
    });
  }

  if (query.companyId) {
    andConditions.push({
      companyId: query.companyId,
    });
  }

  // Soft deleted বাদ
  andConditions.push({
    deletedAt: null,
  });

  const allAssessments = await prisma.assessment.findMany({
    where: {
      AND: andConditions,
    },

    take: limit,
    skip,

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const totalAssessmentCount = await prisma.assessment.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: allAssessments,
    meta: {
      page,
      limit,
      total: totalAssessmentCount,
      totalPages: Math.ceil(totalAssessmentCount / limit),
    },
  };
};

const getAssessmentById = async (id: string) => {
  const result = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  return result;
};

const updateAssessment = async (
  id: string,
  payload: IUpdateAssessment,
  userId: string,
  role: UserRole,
) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  const isAdmin = role === UserRole.ADMIN;
  const isOwner = assessment.companyId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this assessment",
    );
  }

  const totalMarks = payload.totalMarks ?? assessment.totalMarks;
  const passMarks = payload.passMarks ?? assessment.passMarks;

  if (passMarks > totalMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Pass marks cannot be greater than total marks",
    );
  }

  // Assessment status lifecycle
  if (payload.status) {
    const allowedTransitions: Record<AssessmentStatus, AssessmentStatus[]> = {
      [AssessmentStatus.DRAFT]: [AssessmentStatus.PUBLISHED],
      [AssessmentStatus.PUBLISHED]: [AssessmentStatus.ONGOING],
      [AssessmentStatus.ONGOING]: [AssessmentStatus.COMPLETED],
      [AssessmentStatus.COMPLETED]: [AssessmentStatus.ARCHIVED],
      [AssessmentStatus.ARCHIVED]: [],
    };

    const currentStatus = assessment.status;
    const newStatus = payload.status;

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot change assessment status from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  const result = await prisma.assessment.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
  });

  return result;
};


const deleteAssessment = async (id: string, userId: string, role: UserRole) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  const isAdmin = role === UserRole.ADMIN;
  const isOwner = assessment.companyId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to delete this assessment",
    );
  }

  const result = await prisma.assessment.update({
    where: {
      id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result;
};

export const assessmentService = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  deleteAssessment,
  updateAssessment,
};
