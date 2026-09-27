import httpStatus from "http-status";
import {
  AssessmentStatus,
  AttemptStatus,
  InvitationStatus,
  PaymentStatus,
  ResultStatus,
  SubmissionStatus,
  UserRole,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const getCompanyAnalytics = async (companyId: string) => {
  const [
    totalAssessments,
    publishedAssessments,
    totalInvitations,
    acceptedInvitations,
    totalAttempts,
    totalSubmissions,
    totalResults,
    passedResults,
    failedResults,
    revenue,
  ] = await Promise.all([
    prisma.assessment.count({
      where: {
        companyId,
        deletedAt: null,
      },
    }),

    prisma.assessment.count({
      where: {
        companyId,
        status: AssessmentStatus.PUBLISHED,
        deletedAt: null,
      },
    }),

    prisma.invitation.count({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
      },
    }),

    prisma.invitation.count({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
        status: InvitationStatus.ACCEPTED,
      },
    }),

    prisma.attempt.count({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
      },
    }),

    prisma.submission.count({
      where: {
        attempt: {
          assessment: {
            companyId,
            deletedAt: null,
          },
        },
      },
    }),

    prisma.result.count({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.count({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
        status: ResultStatus.PASSED,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.count({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
        status: ResultStatus.FAILED,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.payment.aggregate({
      where: {
        assessment: {
          companyId,
          deletedAt: null,
        },
        status: PaymentStatus.SUCCESS,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const passRate = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;

  return {
    totalAssessments,
    publishedAssessments,
    totalInvitations,
    acceptedInvitations,
    totalAttempts,
    totalSubmissions,
    totalResults,
    passedResults,
    failedResults,
    passRate,
    totalRevenue: revenue._sum.amount ?? 0,
  };
};

const getAdminAnalytics = async () => {
  const [
    totalUsers,
    totalCandidates,
    totalCompanies,
    totalAssessments,
    totalProblems,
    totalAttempts,
    totalSubmissions,
    totalResults,
    passedResults,
    failedResults,
    revenue,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: UserRole.CANDIDATE,
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: UserRole.COMPANY,
        deletedAt: null,
      },
    }),

    prisma.assessment.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.problem.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.attempt.count(),

    prisma.submission.count(),

    prisma.result.count({
      where: {
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.count({
      where: {
        status: ResultStatus.PASSED,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.count({
      where: {
        status: ResultStatus.FAILED,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const passRate = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;

  return {
    totalUsers,
    totalCandidates,
    totalCompanies,
    totalAssessments,
    totalProblems,
    totalAttempts,
    totalSubmissions,
    totalResults,
    passedResults,
    failedResults,
    passRate,
    totalRevenue: revenue._sum.amount ?? 0,
  };
};

const getCandidateAnalytics = async (candidateId: string) => {
  const [
    totalAttempts,
    completedAttempts,
    totalResults,
    passedResults,
    failedResults,
    averageScore,
  ] = await Promise.all([
    prisma.attempt.count({
      where: {
        candidateId,
      },
    }),

    prisma.attempt.count({
      where: {
        candidateId,
        status: AttemptStatus.SUBMITTED,
      },
    }),

    prisma.result.count({
      where: {
        candidateId,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.count({
      where: {
        candidateId,
        status: ResultStatus.PASSED,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.count({
      where: {
        candidateId,
        status: ResultStatus.FAILED,
        publishedAt: {
          not: null,
        },
      },
    }),

    prisma.result.aggregate({
      where: {
        candidateId,
        publishedAt: {
          not: null,
        },
      },
      _avg: {
        percentage: true,
      },
    }),
  ]);

  const passRate = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;

  return {
    totalAttempts,
    completedAttempts,
    totalResults,
    passedResults,
    failedResults,
    passRate,
    averageScore: averageScore._avg.percentage ?? 0,
  };
};

export const analyticsService = {
  getCompanyAnalytics,
  getAdminAnalytics,
  getCandidateAnalytics,
};
