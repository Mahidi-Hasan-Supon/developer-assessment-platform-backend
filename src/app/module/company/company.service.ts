import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import { UserRole } from "../../../../generated/prisma/enums";

type TCompanyProfilePayload = {
  companyName: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
}

const createCompanyProfile = async (userId: string, payload: TCompanyProfilePayload) => {
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

export const companyService = {
  createCompanyProfile,
};
