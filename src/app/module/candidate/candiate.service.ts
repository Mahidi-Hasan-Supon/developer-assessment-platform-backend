import { prisma } from "../../lib/prisma";


const getMyProfile = async (userId: string) => {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

const updateMyProfile = async (userId: string, payload: { name: string }) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

export const candidateProfileService = {
  getMyProfile,
  updateMyProfile,
};
