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
  const adminEmail = config.admin_email;
  const adminName = config.admin_name;
  const adminPassword = config.admin_password;

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIALS,
      emailVerified: true,
    },
  });

  console.log("Admin created successfully");
  console.log("Admin ID:", admin.id);
  console.log("Email:", admin.email);
};


