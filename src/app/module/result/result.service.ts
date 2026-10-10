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
    data: {
      status,
      evaluatedAt: new Date(),
    },
    include: {
      assessment: true,
      submission: true,
    },
  });

  return updatedResult;
  return updatedResult;
};

const publishResult = async (resultId: string, companyId: string) => {
  const result = await prisma.result.findUnique({
    where: {
      id: resultId,
    },
    include: {
      assessment: true,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Result not found");
  }

  if (result.assessment.companyId !== companyId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to publish this result",
    );
  }

  if (
    result.status !== ResultStatus.PASSED &&
    result.status !== ResultStatus.FAILED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Result must be evaluated before publishing",
    );
  }

  if (result.publishedAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Result has already been published",
    );
  }

  const updatedResult = await prisma.result.update({
    where: {
      id: resultId,
    },
    data: {
      publishedAt: new Date(),
    },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          description: true,
          durationMinutes: true,
          totalMarks: true,
          passMarks: true,
          price: true,
        },
      },
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      submission: {
        select: {
          id: true,
          submittedAt: true,
          totalMarks: true,
          obtainedMarks: true,
        },
      },
    },
  });

  return updatedResult;
};

const getMyResults = async (candidateId: string) => {
  const allResults = await prisma.result.findMany({
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

  if (!allResults.length) {
  return [];
}

  const publishedResults = allResults.filter(
    (result) => result.publishedAt !== null,
  );

  if (publishedResults.length === 0) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your result has not been published yet",
    );
  }

  return publishedResults;
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

  if (!result?.publishedAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your result has not been published yet",
    );
  }

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
  publishResult,
};
