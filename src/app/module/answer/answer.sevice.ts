import httpStatus from "http-status";
import {
  AttemptStatus,
  SubmissionStatus,
} from "../../../../generated/prisma/enums";

import { ICreateAnswer } from "./answer.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";

const createAnswer = async (payload: ICreateAnswer, candidateId: string) => {
  const { submissionId, problemId, answer } = payload;

  // Check submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
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

  // Candidate ownership
  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to submit this answer",
    );
  }

  // Submission must be pending
  if (submission.status !== SubmissionStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This submission has already been evaluated",
    );
  }

  // Attempt must be in progress
  if (submission.attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt is no longer in progress",
    );
  }

  // Check expiry
  if (new Date() >= submission.attempt.expiresAt) {
    throw new AppError(httpStatus.BAD_REQUEST, "This attempt has expired");
  }

  // Check whether problem belongs to this assessment
  const assessmentProblem = await prisma.assessmentProblem.findUnique({
    where: {
      uq_assessment_problem: {
        assessmentId: submission.attempt.assessmentId,
        problemId,
      },
    },
    include: {
      problem: true,
    },
  });

  if (!assessmentProblem) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This problem does not belong to this assessment",
    );
  }

  // Check existing answer
  const existingAnswer = await prisma.answer.findUnique({
    where: {
      uq_answer_submission_problem: {
        submissionId,
        problemId,
      },
    },
  });

  // If already answered, update it
  if (existingAnswer) {
    const result = await prisma.answer.update({
      where: {
        id: existingAnswer.id,
      },
      data: {
        answer,
      },
    });

    return result;
  }

  // Create new answer
  const result = await prisma.answer.create({
    data: {
      submissionId,
      problemId,
      answer,
    },
  });

  return result;
};

const getMyAnswers = async (submissionId: string, candidateId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      attempt: true,
    },
  });

  if (!submission) {
    throw new AppError(httpStatus.NOT_FOUND, "Submission not found");
  }

  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view these answers",
    );
  }

  const result = await prisma.answer.findMany({
    where: {
      submissionId,
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          difficulty: true,
          marks: true,
          options: true,
          // answer intentionally excluded
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return result;
};

export const answerService = {
  createAnswer,
  getMyAnswers,
};
