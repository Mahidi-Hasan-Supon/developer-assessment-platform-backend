import httpStatus from "http-status";
import {
  AttemptStatus,
  SubmissionStatus,
} from "../../../../generated/prisma/enums";

import { ICreateSubmission } from "./submission.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";

const createSubmission = async (
  payload: ICreateSubmission,
  candidateId: string,
) => {
  const { attemptId } = payload;

  // 1. Find attempt
  const attempt = await prisma.attempt.findUnique({
    where: {
      id: attemptId,
    },
    include: {
      assessment: true,
    },
  });

  if (!attempt) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Attempt not found",
    );
  }

  // 2. Check ownership
  if (attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to create this submission",
    );
  }

  // 3. Check attempt status
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt is no longer in progress",
    );
  }

  // 4. Check expiry
  if (new Date() >= attempt.expiresAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt has expired",
    );
  }

  // 5. Check existing submission
  const existingSubmission =
    await prisma.submission.findUnique({
      where: {
        attemptId,
      },
    });

  if (existingSubmission) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Submission already exists for this attempt",
    );
  }

  // 6. Create submission
  const result = await prisma.submission.create({
    data: {
      attemptId,
      totalMarks: attempt.assessment.totalMarks,
      status: SubmissionStatus.PENDING,
    },
  });

  return result;
};

const getMySubmissions = async (
  candidateId: string,
) => {
  const result = await prisma.submission.findMany({
    where: {
      attempt: {
        candidateId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      attempt: {
        include: {
          assessment: true,
        },
      },
    },
  });

  return result;
};

const getSubmissionById = async (
  submissionId: string,
  candidateId: string,
) => {
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
      answers: {
        include: {
          problem: true,
        },
      },
    },
  });

  if (!submission) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Submission not found",
    );
  }

  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this submission",
    );
  }

  return submission;
};

export const submissionService = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
};