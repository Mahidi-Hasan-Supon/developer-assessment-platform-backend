import httpStatus from "http-status";
import { SubmissionStatus } from "../../../../generated/prisma/enums";

import { ICreateResult } from "./result.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";

const createResult = async (payload: ICreateResult, candidateId: string) => {
  const { submissionId } = payload;

  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
      attempt: {
        include: {
          assessment: true,
        },
      },
    },
  });

  if (!submission) {
    throw new AppError(httpStatus.NOT_FOUND, "Submission not found");
  }

  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to create this result",
    );
  }

  if (submission.status !== SubmissionStatus.EVALUATED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Submission has not been evaluated yet",
    );
  }

  const existingResult = await prisma.result.findUnique({
    where: {
      submissionId,
    },
  });

  if (existingResult) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Result already exists for this submission",
    );
  }

  const totalMarks = submission.totalMarks;
  const obtainedMarks = submission.obtainedMarks;

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  const result = await prisma.result.create({
    data: {
      submissionId,
      candidateId: submission.attempt.candidateId,
      assessmentId: submission.attempt.assessmentId,
      totalMarks,
      obtainedMarks,
      percentage,
    },
  });

  return result;
};

const getMyResults = async (candidateId: string) => {
  const result = await prisma.result.findMany({
    where: {
      candidateId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      assessment: true,
      submission: true,
    },
  });

  return result;
};

const getResultById = async (resultId: string, candidateId: string) => {
  const result = await prisma.result.findUnique({
    where: {
      id: resultId,
    },
    include: {
      assessment: true,
      submission: true,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Result not found");
  }

  if (result.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this result",
    );
  }

  return result;
};

export const resultService = {
  createResult,
  getMyResults,
  getResultById,
};
