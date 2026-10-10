import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { CompanyStatus, UserRole } from "../../../../generated/prisma/enums";
import path from "path";
import { transporter } from "../../lib/nodemailer";
import config from "../../config";
import ejs from "ejs";

type TCompanyProfilePayload = {
  companyName: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
};

const createCompanyProfile = async (
  userId: string,
  payload: TCompanyProfilePayload,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      companyProfile: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== UserRole.COMPANY) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only company users can submit company application",
    );
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Please verify your email first");
  }

  if (user.companyProfile) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Company application already submitted",
    );
  }

  const companyProfile = await prisma.companyProfile.create({
    data: {
      companyName: payload.companyName,
      description: payload.description || null,
      website: payload.website || null,
      location: payload.location || null,
      industry: payload.industry || null,
      userId: user.id,
      // status default হবে PENDING
    },
  });

  return companyProfile;
};

const getCompanyApplications = async (status?: CompanyStatus) => {
  return prisma.companyProfile.findMany({
    where: status
      ? {
          status,
        }
      : undefined,

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateCompanyApplicationStatus = async (
  companyProfileId: string,
  status: CompanyStatus,
  reviewNote?: string,
) => {
  const companyProfile = await prisma.companyProfile.findUnique({
    where: {
      id: companyProfileId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!companyProfile) {
    throw new Error("Company application not found");
  }

  if (companyProfile.status !== CompanyStatus.PENDING) {
    throw new Error("This company application has already been reviewed");
  }

  const updatedCompany = await prisma.companyProfile.update({
    where: {
      id: companyProfileId,
    },
    data: {
      status,
      reviewNote: reviewNote?.trim() || null,
    },
  });

  try {
    // Send approval email
    if (status === CompanyStatus.APPROVED) {
      const templatePath = path.join(
        process.cwd(),
        "src/app/templates/company-approve-email.ejs",
      );

      const templateData = {
        name: companyProfile.user.name,
        companyName: companyProfile.companyName,
      };

      const html = await ejs.renderFile(templatePath, templateData);

      await transporter.sendMail({
        from: config.email_sender,
        to: companyProfile.user.email,
        subject: "Company Application Approved",
        html,
      });
    }

    // Send rejection email
    if (status === CompanyStatus.REJECTED) {
      const templatePath = path.join(
        process.cwd(),
        "src/app/templates/company-reject-email.ejs",
      );

      const templateData = {
        name: companyProfile.user.name,
        companyName: companyProfile.companyName,
        reviewNote: reviewNote?.trim(),
      };

      const html = await ejs.renderFile(templatePath, templateData);

      await transporter.sendMail({
        from: config.email_sender,
        to: companyProfile.user.email,
        subject: "Company Application Rejected",
        html,
      });
    }
  } catch (error) {
    console.error("Company status email failed:", error);
  }

  return updatedCompany;
};

// user get by admin company


const getCandidates = async (query: {
  searchTerm?: string;
  page?: string;
  limit?: string;
}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where = {
    role: UserRole.CANDIDATE,
    deletedAt: null,
    ...(query.searchTerm?.trim()
      ? {
          OR: [
            {
              name: {
                contains: query.searchTerm.trim(),
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: query.searchTerm.trim(),
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
      },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const companyService = {
  createCompanyProfile,
  getCompanyApplications,
  updateCompanyApplicationStatus,
  getCandidates
};
