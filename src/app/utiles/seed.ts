import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import config from "../config";
import {
  AuthProvider,
  UserRole,
  UserStatus,
} from "../../../generated/prisma/enums";

export const createAdmin = async () => {
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: config.admin_email,
    },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(config.admin_password, 10);

  const admin = await prisma.user.create({
    data: {
      name: config.admin_name,
      email: config.admin_email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIALS,
      emailVerified: true,
    },
  });

  // console.log("Admin created successfully");
  // console.log("Admin ID:", admin.id);
  // console.log("Email:", admin.email);
};

// Create Company
export const createCompany = async () => {
  const existingCompany = await prisma.user.findUnique({
    where: {
      email: config.company_email,
    },
  });

  if (existingCompany) {
    console.log("Company already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(config.company_password, 10);

  const company = await prisma.user.create({
    data: {
      name: config.company_name,
      email: config.company_email,
      password: hashedPassword,
      role: UserRole.COMPANY,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIALS,
      emailVerified: true,
    },
  });

  // console.log("Company created successfully");
  // console.log("Company ID:", company.id);
  // console.log("Email:", company.email);
};

// Create Candidate
export const createCandidate = async () => {
  const existingCandidate = await prisma.user.findUnique({
    where: {
      email: config.candidate_email,
    },
  });

  if (existingCandidate) {
    console.log("Candidate already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(config.candidate_password, 10);

  const candidate = await prisma.user.create({
    data: {
      name: config.candidate_name,
      email: config.candidate_email,
      password: hashedPassword,
      role: UserRole.CANDIDATE,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIALS,
      emailVerified: true,
    },
  });

  // console.log("Candidate created successfully");
  // console.log("Candidate ID:", candidate.id);
  // console.log("Email:", candidate.email);
};
