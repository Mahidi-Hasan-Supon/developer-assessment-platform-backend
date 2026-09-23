import httpStatus from "http-status";
import { UserRole } from "../../../../generated/prisma/enums";
import {
  ICreateAssessmentProblem,
  IUpdateAssessmentProblem,
} from "./assessmentProblem.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";


const createAssessmentProblem = async (
  assessmentId: string,
  payload: ICreateAssessmentProblem,
  userId: string,
  role: UserRole,
) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Check permission
  const isAdmin = role === UserRole.ADMIN;
  const isOwner = assessment.companyId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to manage this assessment",
    );
  }

  // Check problem
  const problem = await prisma.problem.findFirst({
    where: {
      id: payload.problemId,
      deletedAt: null,
    },
  });

  if (!problem) {
    throw new AppError(httpStatus.NOT_FOUND, "Problem not found");
  }

  // Company can only add their own problem
  if (!isAdmin && problem.createdBy !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to add this problem",
    );
  }

  // Check duplicate problem
  const existingAssessmentProblem = await prisma.assessmentProblem.findFirst({
    where: {
      assessmentId,
      problemId: payload.problemId,
    },
  });

  if (existingAssessmentProblem) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This problem is already added to this assessment",
    );
  }

  // Create assessment problem
  const result = await prisma.assessmentProblem.create({
    data: {
      assessmentId,
      problemId: payload.problemId,
      order: payload.order,
      marks: payload.marks,
    },
  });

  return result;
};

const getAssessmentProblems = async (
  assessmentId: string,
  userId: string,
  role: UserRole,
) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Check permission
  const isAdmin = role === UserRole.ADMIN;
  const isOwner = assessment.companyId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view these problems",
    );
  }

  const result = await prisma.assessmentProblem.findMany({
    where: {
      assessmentId,
    },
    orderBy: {
      order: "asc",
    },
    include: {
      problem: true,
    },
  });

  return result;
};

const updateAssessmentProblem = async (
  assessmentId: string,
  problemId: string,
  payload: IUpdateAssessmentProblem,
  userId: string,
  role: UserRole,
) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Check permission
  const isAdmin = role === UserRole.ADMIN;
  const isOwner = assessment.companyId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this assessment problem",
    );
  }

  // Check assessment problem
  const assessmentProblem = await prisma.assessmentProblem.findFirst({
    where: {
      assessmentId,
      problemId,
    },
  });

  if (!assessmentProblem) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment problem not found");
  }

  const result = await prisma.assessmentProblem.update({
    where: {
      id: assessmentProblem.id,
    },
    data: {
      ...payload,
    },
  });

  return result;
};

const deleteAssessmentProblem = async (
  assessmentId: string,
  problemId: string,
  userId: string,
  role: UserRole,
) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Check permission
  const isAdmin = role === UserRole.ADMIN;
  const isOwner = assessment.companyId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to delete this assessment problem",
    );
  }

  // Check assessment problem
  const assessmentProblem = await prisma.assessmentProblem.findFirst({
    where: {
      assessmentId,
      problemId,
    },
  });

  if (!assessmentProblem) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment problem not found");
  }

  // Delete relation
  const result = await prisma.assessmentProblem.delete({
    where: {
      id: assessmentProblem.id,
    },
  });

  return result;
};

export const assessmentProblemService = {
  createAssessmentProblem,
  getAssessmentProblems,
  updateAssessmentProblem,
  deleteAssessmentProblem,
};
