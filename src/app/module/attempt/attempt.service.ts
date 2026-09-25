import httpStatus from "http-status";
import {
  AssessmentStatus,
  AttemptStatus,
  InvitationStatus,
  UserRole,
} from "../../../../generated/prisma/enums";

import { ICreateAttempt, IQuery } from "./attempt.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { addMinutes, isBefore } from "date-fns";
import { AttemptWhereInput } from "../../../../generated/prisma/models";

const startAttempt = async (payload: ICreateAttempt, candidateId: string) => {
  const { invitationId } = payload;

  // 1. Find invitation
  const invitation = await prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
    include: {
      assessment: true,
    },
  });

  if (!invitation) {
    throw new AppError(httpStatus.NOT_FOUND, "Invitation not found");
  }

  // 2. Make sure invitation belongs to logged-in candidate
  if (invitation.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to start this assessment",
    );
  }

  // 3. Check invitation status
  if (invitation.status !== InvitationStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You must accept the invitation before starting the assessment",
    );
  }

  // 4. Check assessment
  if (invitation.assessment.deletedAt) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // 5. Check assessment status
  if (
    invitation.assessment.status !== AssessmentStatus.PUBLISHED &&
    invitation.assessment.status !== AssessmentStatus.ONGOING
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This assessment is not available for attempt",
    );
  }

  // 5. Check if attempt already exists
  const existingAttempt = await prisma.attempt.findUnique({
    where: {
      invitationId,
    },
  });

  if (existingAttempt) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already started this assessment",
    );
  }

  const startedAt = new Date();
  const expiresAt = addMinutes(
    startedAt,
    invitation.assessment.durationMinutes,
  );

  // 7. Create attempt
  const result = await prisma.attempt.create({
    data: {
      invitationId,
      candidateId,
      assessmentId: invitation.assessmentId,
      startedAt,
      expiresAt,
      status: AttemptStatus.IN_PROGRESS,
    },
  });

  // 8. Mark invitation as USED
  await prisma.invitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: InvitationStatus.USED,
    },
  });

  return result;
};

const getMyAttempts = async (candidateId: string) => {
  const result = await prisma.attempt.findMany({
    where: {
      candidateId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      assessment: true,
    },
  });

  return result;
};

const getAllAttempts = async (query: IQuery) => {
  const limit = query?.limit ? Number(query.limit) : 10;
  const page = query?.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const sortBy = query?.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query?.sortOrder ? query.sortOrder : "desc";

  const andConditions: AttemptWhereInput[] = [];

  // Search by assessment title/description
  if (query?.searchTerm) {
    andConditions.push({
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
    });
  }

  // Filter by attempt status
  if (query?.status) {
    andConditions.push({
      status: query.status as AttemptStatus,
    });
  }

  // Filter by assessment
  if (query?.assessmentId) {
    andConditions.push({
      assessmentId: query.assessmentId,
    });
  }

  // Filter by candidate
  if (query?.candidateId) {
    andConditions.push({
      candidateId: query.candidateId,
    });
  }

  const result = await prisma.attempt.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      assessment: true,
      invitation: true,
      candidate: true,
    },
  });

  const totalAttemptCount = await prisma.attempt.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: result,
    meta: {
      page,
      limit,
      total: totalAttemptCount,
      totalPages: Math.ceil(totalAttemptCount / limit),
    },
  };
};

const getAttemptById = async (
  attemptId: string,
  userId: string,
  role: UserRole,
) => {
  const attempt = await prisma.attempt.findUnique({
    where: {
      id: attemptId,
    },
    include: {
      assessment: true,
      invitation: true,
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found");
  }

  // Candidate can see only own attempt
  if (role === UserRole.CANDIDATE && attempt.candidateId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this attempt",
    );
  }

  // Company can see attempts of own assessment
  if (role === UserRole.COMPANY && attempt.assessment.companyId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this attempt",
    );
  }

  return attempt;
};

const submitAttempt = async (attemptId: string, candidateId: string) => {
  const attempt = await prisma.attempt.findUnique({
    where: {
      id: attemptId,
    },
  });

  if (!attempt) {
    throw new AppError(httpStatus.NOT_FOUND, "Attempt not found");
  }

  if (attempt.candidateId !== candidateId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to submit this attempt",
    );
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This attempt is no longer in progress",
    );
  }

  const now = new Date();

  // Time check expire the sumit
  if (!isBefore(now, attempt.expiresAt)) {
    const result = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.AUTO_SUBMITTED,
        submittedAt: now,
      },
    });
    return result;
  }

  // Normal submission
  const result = await prisma.attempt.update({
    where: {
      id: attemptId,
    },
    data: {
      status: AttemptStatus.SUBMITTED,
      submittedAt: now,
    },
  });

  return result;
};

export const attemptService = {
  startAttempt,
  getAllAttempts,
  getMyAttempts,
  getAttemptById,
  submitAttempt,
};
