import httpStatus from "http-status";
import { ResultStatus, UserRole } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { STATUS_CODES } from "node:http";

// ======================================
// GENERATE REPORT
// ======================================

const generateReport = async (
  assessmentId: string,
  userId: string,
  role: UserRole,
) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Company can generate only own assessment report
  if (role === UserRole.COMPANY && assessment.companyId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to generate this report",
    );
  }

  // Get all results
  const results = await prisma.result.findMany({
    where: {
      assessmentId,
    },
  });

  // Total candidates
  const totalCandidates = await prisma.invitation.count({
    where: {
      assessmentId,
    },
  });

  // Completed candidates
  const completedCandidates = results.length;

  // Passed candidates
  const passedCandidates = results.filter(
    (result) => result.status === ResultStatus.PASSED,
  ).length;

  // Failed candidates
  const failedCandidates = results.filter(
    (result) => result.status === ResultStatus.FAILED,
  ).length;

  // Scores
  const scores = results.map((result) => result.obtainedMarks);

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Create report
  const report = await prisma.report.create({
    data: {
      assessmentId,
      generatedBy: userId,
      totalCandidates,
      completedCandidates,
      passedCandidates,
      failedCandidates,
      averageScore,
      highestScore,
      lowestScore,
    },
  });

  return report;
};

// ======================================
// GET REPORT BY ASSESSMENT
// ======================================

const getReportByAssessment = async (
  assessmentId: string,
  userId: string,
  role: UserRole,
) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Company can see only own assessment report
  if (role === UserRole.COMPANY && assessment.companyId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this report",
    );
  }

  // Get latest generated report
  const report = await prisma.report.findFirst({
    where: {
      assessmentId,
    },
    orderBy: {
      generatedAt: "desc",
    },
  });

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, "Report not found");
  }

  return report;
};

// ======================================
// GET ALL REPORTS
// ======================================

const getAllReports = async (
  userId: string,
  role: UserRole,
  query: {
    page?: string;
    limit?: string;
    searchTerm?: string;
  },
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};

  // Company can see only reports
  // of their own assessments
  if (role === UserRole.COMPANY) {
    whereCondition.assessment = {
      companyId: userId,
      deletedAt: null,
    };
  } else {
    whereCondition.assessment = {
      deletedAt: null,
    };
  }

  // Search by assessment title
  if (query.searchTerm) {
    whereCondition.assessment = {
      ...whereCondition.assessment,
      title: {
        contains: query.searchTerm,
        mode: "insensitive",
      },
    };
  }

  const [reports, total] = await prisma.$transaction([
    prisma.report.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        generatedAt: "desc",
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            companyId: true,
          },
        },
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.report.count({
      where: whereCondition,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: reports,
  };
};

const updateReport = async (
  reportId: string,
  payload: Partial<{
    candidateCount: number;
    completedCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    pdfUrl: string;
  }>,
  userId: string,
  role: UserRole,
) => {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    include: {
      assessment: true,
    },
  });

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, "Report not found");
  }

  // Admin can update any report
  if (role !== UserRole.ADMIN) {
    if (report.assessment.companyId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to update this report",
      );
    }
  }

  const result = await prisma.report.update({
    where: {
      id: reportId,
    },
    data: payload,
  });

  return result;
};

const deleteReport = async (
  reportId: string,
  userId: string,
  role: UserRole,
) => {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
    include: {
      assessment: true,
    },
  });

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, "Report not found");
  }

  // Admin can delete any report
  if (role !== UserRole.ADMIN) {
    if (report.assessment.companyId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to delete this report",
      );
    }
  }

  await prisma.report.delete({
    where: {
      id: reportId,
    },
  });

  return null;
};

export const reportService = {
  generateReport,
  getReportByAssessment,
  getAllReports,
};
