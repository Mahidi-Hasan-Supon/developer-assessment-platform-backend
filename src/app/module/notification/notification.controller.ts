
import { Request, Response } from "express";

import { notificationService } from "./notification.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";
import httpStatus from 'http-status';

const createNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await notificationService.createNotification(
        req.body
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Notification created successfully",
      data: result,
    });
  }
);

const getMyNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const result =
      await notificationService.getMyNotifications(
        userId!
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notifications retrieved successfully",
      data: result,
    });
  }
);

const updateNotification = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result =
      await notificationService.updateNotification(
        id as string,
        userId!,
        req.body
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification updated successfully",
      data: result,
    });
  }
);

const markAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result =
      await notificationService.markAsRead(
        id as string,
        userId!
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  }
);

const deleteNotification = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    await notificationService.deleteNotification(
      id as string,
      userId!
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification deleted successfully",
      data: null,
    });
  }
);

export const notificationController = {
  createNotification,
  getMyNotifications,
  updateNotification,
  markAsRead,
  deleteNotification,
};

