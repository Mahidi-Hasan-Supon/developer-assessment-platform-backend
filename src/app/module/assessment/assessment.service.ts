import { ICreateAssessment, IUpdateAssessment } from "./assessment.interface";
import httpStatus from "http-status";
import { UserRole } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";

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

const getAllAssessments = async () => {
  const result = await prisma.assessment.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
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
  updateAssessment
};
