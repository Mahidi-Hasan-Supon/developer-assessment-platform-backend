import httpStatus from "http-status";
import {
  ResultStatus,
  SubmissionStatus,
} from "../../../../generated/prisma/enums";

import { ICreateResult } from "./result.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";

const createResult = async (payload: ICreateResult, companyId: string) => {
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

  // Company can create result only for their own assessment
  if (submission.attempt.assessment.companyId !== companyId) {
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

const evaluateResult = async (resultId: string, companyId: string) => {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: { assessment: true, submission: true },
  });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Result not found");
  }
  // Company can evaluate only their own assessment result
  if (result.assessment.companyId !== companyId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to evaluate this result",
    );
  }
  if (result.status !== ResultStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This result has already been evaluated",
    );
  }
  const passMarks = result.assessment.passMarks;
  const status =
    result.obtainedMarks >= passMarks
      ? ResultStatus.PASSED
      : ResultStatus.FAILED;
  const updatedResult = await prisma.result.update({
    where: { id: resultId },
    data: { status, evaluatedAt: new Date() },
  });
  return updatedResult;
};

const getMyResults = async (candidateId: string) => {
  const result = await prisma.result.findMany({
    where: {
      candidateId,
      status: {
        in: [ResultStatus.PASSED, ResultStatus.FAILED],
      },
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
  evaluateResult,
};
