import httpStatus from "http-status";
import {
  AttemptStatus,
  ProblemType,
  SubmissionStatus,
} from "../../../../generated/prisma/enums";

import { ICreateAnswer, IEvaluateAnswer } from "./answer.interface";
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
        marks: 0,
        isCorrect: null,
        evaluatedAt: null,
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
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return result;
};

const evaluateAnswer = async (
  answerId: string,
  payload: IEvaluateAnswer,
  companyId: string,
) => {
  const { marks } = payload;

  // Find answer
  const answer = await prisma.answer.findUnique({
    where: {
      id: answerId,
    },
    include: {
      problem: true,
      submission: {
        include: {
          attempt: {
            include: {
              assessment: true,
            },
          },
        },
      },
    },
  });

  if (!answer) {
    throw new AppError(httpStatus.NOT_FOUND, "Answer not found");
  }

  // Company ownership
  if (answer.submission.attempt.assessment.companyId !== companyId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to evaluate this answer",
    );
  }

  // Only Written / Coding can be manually evaluated
  if (
    answer.problem.type !== ProblemType.WRITTEN &&
    answer.problem.type !== ProblemType.CODING
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only written and coding answers can be manually evaluated",
    );
  }

  // Cannot give marks greater than problem marks
  const maxMarks = await prisma.assessmentProblem.findUnique({
    where: {
      uq_assessment_problem: {
        assessmentId: answer.submission.attempt.assessmentId,
        problemId: answer.problemId,
      },
    },
  });

  if (!maxMarks) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment problem not found");
  }

  const allowedMarks = maxMarks.marks ?? answer.problem.marks;

  if (marks < 0 || marks > allowedMarks) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Marks must be between 0 and ${allowedMarks}`,
    );
  }

  // Update answer
  const updatedAnswer = await prisma.answer.update({
    where: {
      id: answerId,
    },
    data: {
      marks,
      isCorrect: marks > 0,
      evaluatedAt: new Date(),
    },
  });

  // Get all answers of this submission
  const allAnswers = await prisma.answer.findMany({
    where: {
      submissionId: answer.submissionId,
    },
    include: {
      problem: true,
    },
  });

  // Calculate obtained marks
  const obtainedMarks = allAnswers.reduce(
    (total, item) => total + (item.marks ?? 0),
    0,
  );

  // Check whether any answered Written/Coding remains unevaluated
  const pendingManualEvaluation = allAnswers.some(
    (item) =>
      (item.problem.type === ProblemType.WRITTEN ||
        item.problem.type === ProblemType.CODING) &&
      item.evaluatedAt === null,
  );

  // Update submission
  await prisma.submission.update({
    where: {
      id: answer.submissionId,
    },
    data: {
      obtainedMarks,
      ...(pendingManualEvaluation
        ? {}
        : {
            status: SubmissionStatus.EVALUATED,
            evaluatedAt: new Date(),
          }),
    },
  });

  return updatedAnswer;
};

export const answerService = {
  createAnswer,
  getMyAnswers,
  evaluateAnswer,
};
