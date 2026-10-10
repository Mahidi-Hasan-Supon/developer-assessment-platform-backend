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
  console.log("🔥 SUBMIT SUBMISSION SERVICE CALLED", {
    submissionId,
    candidateId,
  });
  console.log("SUBMIT SUBMISSION FUNCTION CALLED", submissionId);
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

  if (submission.attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to submit this submission",
    );
  }

  if (submission.status === SubmissionStatus.EVALUATED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This submission has already been evaluated",
    );
  }

  if (submission.attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt is no longer in progress",
    );
  }

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

  console.log(
    "🔥 ASSESSMENT PROBLEMS:",
    assessmentProblems.map((item) => ({
      problemId: item.problem.id,
      title: item.problem.title,
      type: item.problem.type,
      correctAnswer: item.problem.answer,
      marks: item.marks,
    })),
  );

  if (assessmentProblems.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This assessment has no problems",
    );
  }

  const answers = await prisma.answer.findMany({
    where: {
      submissionId,
    },
  });

  const answerMap = new Map(
    answers.map((answer) => [answer.problemId, answer]),
  );

  let obtainedMarks = 0;
  let pendingEvaluation = false;

  const answerUpdatePromises = [];

  const normalizeAnswer = (value: unknown): string =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  for (const assessmentProblem of assessmentProblems) {
    const problem = assessmentProblem.problem;
    const candidateAnswer = answerMap.get(problem.id);
    console.log("🔥 ENTERED MCQ BLOCK:", problem.id);

    console.log("🔥 LOOP DEBUG:", {
      problemId: problem.id,
      type: problem.type,
      candidateAnswerFound: Boolean(candidateAnswer),
      candidateAnswer: candidateAnswer?.answer,
      correctAnswer: problem.answer,
    });

    if (!candidateAnswer) {
      if (
        problem.type === ProblemType.WRITTEN ||
        problem.type === ProblemType.CODING
      ) {
        pendingEvaluation = true;
      }

      continue;
    }

    if (problem.type === ProblemType.MCQ) {
      const normalizeAnswer = (value: unknown) =>
        String(value ?? "")
          .trim()
          .toLowerCase();

      console.log("MCQ EVALUATION DEBUG:", {
        problemId: problem.id,
        problemType: problem.type,
        candidateAnswer: candidateAnswer.answer,
        correctAnswer: problem.answer,
        candidateNormalized: String(candidateAnswer.answer ?? "")
          .trim()
          .toLowerCase(),
        correctNormalized: String(problem.answer ?? "")
          .trim()
          .toLowerCase(),
      });

      const isCorrect =
        normalizeAnswer(candidateAnswer.answer) ===
        normalizeAnswer(problem.answer);
      const marks = isCorrect ? (assessmentProblem.marks ?? problem.marks) : 0;

      console.log("MCQ EVALUATION:", {
        question: problem.title,
        candidateAnswer: candidateAnswer.answer,
        correctAnswer: problem.answer,
        isCorrect,
        obtainedMarks: marks,
        maxMarks: assessmentProblem.marks ?? problem.marks,
      });

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

    if (
      problem.type === ProblemType.WRITTEN ||
      problem.type === ProblemType.CODING
    ) {
      pendingEvaluation = true;
    }
  }

  const submissionStatus = pendingEvaluation
    ? SubmissionStatus.PENDING
    : SubmissionStatus.EVALUATED;

  const evaluatedAt = pendingEvaluation ? null : new Date();

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

  const attemptUpdate = prisma.attempt.update({
    where: {
      id: submission.attempt.id,
    },
    data: {
      status: AttemptStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  const transactionResults = await prisma.$transaction([
    ...answerUpdatePromises,
    submissionUpdate,
    attemptUpdate,
  ]);

  return transactionResults[transactionResults.length - 2];
};

const getCompanySubmissions = async (companyId: string) => {
  const submissions = await prisma.submission.findMany({
    where: {
      attempt: {
        assessment: {
          companyId,
        },
      },
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
      result: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return submissions;
};

export const submissionService = {
  createSubmission,
  getMySubmissions,
  getSubmissionById,
  submitSubmission,
  getCompanySubmissions,
};
