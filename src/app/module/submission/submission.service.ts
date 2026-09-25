import httpStatus from "http-status";
import {
  AttemptStatus,
  ProblemType,
  SubmissionStatus,
} from "../../../../generated/prisma/enums";

import { ICreateSubmission, IQuery } from "./submission.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { number } from "zod";
import { SubmissionWhereInput } from "../../../../generated/prisma/models";

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

const getMySubmissions = async (candidateId: string, query: IQuery) => {
  const limit = query?.limit ? Number(query.limit) : 10;
  const page = query?.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query?.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query?.sortOrder ? query.sortOrder : "desc";

  const andConditions: SubmissionWhereInput[] = [];

  // Candidate's submissions only
  andConditions.push({
    attempt: {
      candidateId,
    },
  });

  // Search by assessment title or description
  if (query?.searchTerm) {
    andConditions.push({
      attempt: {
        assessment: {
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
        },
      },
    });
  }

  // Filter by submission status
  if (query?.status) {
    andConditions.push({
      status: query.status as SubmissionStatus,
    });
  }

  const result = await prisma.submission.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      attempt: {
        include: {
          assessment: true,
        },
      },
    },
  });

  const totalSubmissionCount = await prisma.submission.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: result,
    meta: {
      page,
      limit,
      total: totalSubmissionCount,
      totalPages: Math.ceil(totalSubmissionCount / limit),
    },
  };
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
    where: { id: submissionId },
    include: {
      attempt: {
        include: { assessment: true },
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
  let pendingEvaluation = false;

  // MCQ answer update promises
  const answerUpdatePromises = [];

  // Evaluate answers
  for (const assessmentProblem of assessmentProblems) {
    const problem = assessmentProblem.problem;
    const candidateAnswer = answerMap.get(problem.id);

    // Candidate did not answer this problem
    if (!candidateAnswer) {
      // Written / Coding answer না থাকলেও
      // manual evaluation pending থাকবে
      if (
        problem.type === ProblemType.WRITTEN ||
        problem.type === ProblemType.CODING
      ) {
        pendingEvaluation = true;
      }

      continue;
    }

    // MCQ → automatic evaluation
    if (problem.type === ProblemType.MCQ) {
      const isCorrect =
        candidateAnswer.answer?.trim() === problem.answer?.trim();

      const marks = isCorrect ? (assessmentProblem.marks ?? problem.marks) : 0;

      answerUpdatePromises.push(
        prisma.answer.update({
          where: {
            id: candidateAnswer.id,
          },
          data: {
            marks,
            isCorrect,
            evaluatedAt: new Date(),
          },
        }),
      );

      obtainedMarks += marks;
    }

    // WRITTEN / CODING → manual evaluation pending
    if (
      problem.type === ProblemType.WRITTEN ||
      problem.type === ProblemType.CODING
    ) {
      pendingEvaluation = true;
    }
  }

  // যদি Written / Coding evaluation pending থাকে,
  // তাহলে Submission এখনো EVALUATED হবে না
  const submissionStatus = pendingEvaluation
    ? SubmissionStatus.PENDING
    : SubmissionStatus.EVALUATED;

  const evaluatedAt = pendingEvaluation ? undefined : new Date();

  // Update submission
  const submissionUpdate = prisma.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      obtainedMarks,
      status: submissionStatus,
      evaluatedAt,
    },
  });

  // Submit attempt
  const attemptUpdate = prisma.attempt.update({
    where: {
      id: submission.attempt.id,
    },
    data: {
      status: AttemptStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  // Update MCQ answers + submission + attempt together
  const transactionResults = await prisma.$transaction([
    ...answerUpdatePromises,
    submissionUpdate,
    attemptUpdate,
  ]);

  // Last item = attempt update
  // Second last item = submission update
  return transactionResults[transactionResults.length - 2];
};



export const submissionService = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  submitSubmission,
};
