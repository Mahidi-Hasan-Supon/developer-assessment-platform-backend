import httpStatus from "http-status";
import { InvitationStatus, UserRole } from "../../../../generated/prisma/enums";
import {
  ICreateInvitation,
  IQuery,
  IUpdateInvitationStatus,
} from "./invitation.interface";
import { AppError } from "../../utiles/appError";
import { prisma } from "../../lib/prisma";

const createInvitation = async (payload: ICreateInvitation, userId: string) => {
  const { assessmentId, candidateId, expiresAt } = payload;

  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Only assessment owner company can send invitation
  if (assessment.companyId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to invite candidates to this assessment",
    );
  }

  // Check candidate
  const candidate = await prisma.user.findFirst({
    where: {
      id: candidateId,
      role: UserRole.CANDIDATE,
      deletedAt: null,
    },
  });

  if (!candidate) {
    throw new AppError(httpStatus.NOT_FOUND, "Candidate not found");
  }

  // Check duplicate invitation
  const existingInvitation = await prisma.invitation.findUnique({
    where: {
      uq_invitation_assessment_candidate: {
        assessmentId,
        candidateId,
      },
    },
  });

  if (existingInvitation) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This candidate has already been invited to this assessment",
    );
  }

  const result = await prisma.invitation.create({
    data: {
      assessmentId,
      candidateId,
      expiresAt,
    },
  });

  return result;
};

const getMyInvitations = async (candidateId: string, query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  // Sorting
  const allowedSortFields = ["createdAt", "invitedAt", "expiresAt"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: any[] = [
    {
      candidateId,
    },
  ];

  // Search assessment title/description
  if (query.searchTerm) {
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

  // Status filter
  if (query.status) {
    andConditions.push({
      status: query.status as InvitationStatus,
    });
  }

  const result = await prisma.invitation.findMany({
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
    },
  });

  const totalInvitationCount = await prisma.invitation.count({
    where: {
      AND: andConditions,
    },
  });

  return {
    data: result,
    meta: {
      page,
      limit,
      total: totalInvitationCount,
      totalPages: Math.ceil(totalInvitationCount / limit),
    },
  };
};

const getAssessmentInvitations = async (
  assessmentId: string,
  userId: string,
) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  if (assessment.companyId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view these invitations",
    );
  }

  const result = await prisma.invitation.findMany({
    where: {
      assessmentId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      candidate: {
        omit: {
          password: true,
        },
      },
    },
  });

  return result;
};

const updateInvitationStatus = async (
  invitationId: string,
  payload: IUpdateInvitationStatus,
  userId: string,
  role: UserRole,
) => {
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

  // Candidate can accept/reject their own invitation
  if (role === UserRole.CANDIDATE) {
    if (invitation.candidateId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to update this invitation",
      );
    }

    if (
      payload.status !== InvitationStatus.ACCEPTED &&
      payload.status !== InvitationStatus.REJECTED
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Candidate can only accept or reject an invitation",
      );
    }
  }

  // Company can manage invitations for its own assessment
  if (role === UserRole.COMPANY) {
    if (invitation.assessment.companyId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to update this invitation",
      );
    }
  }

  const result = await prisma.invitation.update({
    where: {
      id: invitationId,
    },
    data: {
      status: payload.status,
      ...(payload.status === InvitationStatus.ACCEPTED && {
        acceptedAt: new Date(),
      }),
    },
  });

  return result;
};

const deleteInvitation = async (invitationId: string, userId: string) => {
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

  if (invitation.assessment.companyId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to delete this invitation",
    );
  }

  const result = await prisma.invitation.delete({
    where: {
      id: invitationId,
    },
  });

  return result;
};

export const invitationService = {
  createInvitation,
  getMyInvitations,
  getAssessmentInvitations,
  updateInvitationStatus,
  deleteInvitation,
};
