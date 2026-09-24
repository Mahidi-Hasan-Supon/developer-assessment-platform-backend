import httpStatus from "http-status";
import {
  AttemptStatus,
  ProblemType,
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
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found");
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
    throw new AppError(httpStatus.BAD_REQUEST, "This attempt has expired");
  }

  // 5. Check existing submission
  const existingSubmission = await prisma.submission.findUnique({
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

const getMySubmissions = async (candidateId: string) => {
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

const getSubmissionById = async (submissionId: string, candidateId: string) => {
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
    throw new AppError(httpStatus.NOT_FOUND, "Submission not found");
  }

  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this submission",
    );
  }

  return submission;
};

const submitSubmission = async (submissionId: string, candidateId: string) => {
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

  // Candidate ownership
  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to submit this submission",
    );
  }

  // Submission already evaluated
  if (submission.status === SubmissionStatus.EVALUATED) {
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

  // Get all problems of this assessment
  const assessmentProblems = await prisma.assessmentProblem.findMany({
    where: {
      assessmentId: submission.attempt.assessmentId,
    },
    include: {
      problem: true,
    },
    orderBy: {
      order: "asc",
    },
  });

  if (assessmentProblems.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This assessment has no problems",
    );
  }

  // Get candidate answers
  const answers = await prisma.answer.findMany({
    where: {
      submissionId,
    },
  });

  const answerMap = new Map(answers.map((item) => [item.problemId, item]));

  let obtainedMarks = 0;

  // Evaluate answers
  for (const assessmentProblem of assessmentProblems) {
    const problem = assessmentProblem.problem;

    const candidateAnswer = answerMap.get(problem.id);

    // Candidate did not answer this problem
    if (!candidateAnswer) {
      continue;
    }

    // MCQ auto evaluation
    if (problem.type === ProblemType.MCQ) {
      const isCorrect =
        candidateAnswer.answer?.trim() === problem.answer?.trim();

      const marks = isCorrect ? (assessmentProblem.marks ?? problem.marks) : 0;

      await prisma.answer.update({
        where: {
          id: candidateAnswer.id,
        },
        data: {
          marks,
          isCorrect,
          evaluatedAt: new Date(),
        },
      });

      obtainedMarks += marks;
    }

    // Written / Coding
    // এগুলো এখন manual/automated evaluation-এর জন্য pending থাকবে
  }

  // Update submission + attempt together
  const result = await prisma.$transaction([
    prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        obtainedMarks,
        status: SubmissionStatus.EVALUATED,
        evaluatedAt: new Date(),
      },
    }),

    prisma.attempt.update({
      where: {
        id: submission.attempt.id,
      },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    }),
  ]);

  return result[0];
};



export const submissionService = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  submitSubmission
};
