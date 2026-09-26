import { NotificationType } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import httpStatus from 'http-status';


const createNotification = async (payload: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  const result = await prisma.notification.create({
    data: payload,
  });

  return result;
};

const getMyNotifications = async (userId: string) => {
  const result = await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const updateNotification = async (
  id: string,
  userId: string,
  payload: {
    title?: string;
    message?: string;
    type?: NotificationType;
  }
) => {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

  if (!notification) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification not found"
    );
  }

  const result = await prisma.notification.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

const markAsRead = async (
  id: string,
  userId: string
) => {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

  if (!notification) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification not found"
    );
  }

  const result = await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result;
};

const deleteNotification = async (
  id: string,
  userId: string
) => {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

  if (!notification) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification not found"
    );
  }

  await prisma.notification.delete({
    where: {
      id,
    },
  });

  return null;
};

export const notificationService = {
  createNotification,
  getMyNotifications,
  updateNotification,
  markAsRead,
  deleteNotification,
};

