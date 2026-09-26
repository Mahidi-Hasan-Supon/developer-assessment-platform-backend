import express, { Router } from "express";
import { notificationController } from "./notification.controller";
import { auth } from "../../middleware/checkAuth";
import { UserRole } from "../../../../generated/prisma/enums";


const router = Router();

router.post(
  "/",
  auth(
    UserRole.ADMIN,
    UserRole.CANDIDATE,
    UserRole.COMPANY
  ),
  notificationController.createNotification
);

router.get(
  "/",
  auth(
    UserRole.ADMIN,
    UserRole.CANDIDATE,
    UserRole.COMPANY
  ),
  notificationController.getMyNotifications
);

router.patch(
  "/:id",
  auth(
    UserRole.ADMIN,
    UserRole.CANDIDATE,
    UserRole.COMPANY
  ),
  notificationController.updateNotification
);

router.patch(
  "/:id/read",
  auth(
    UserRole.ADMIN,
    UserRole.CANDIDATE,
    UserRole.COMPANY
  ),
  notificationController.markAsRead
);

router.delete(
  "/:id",
  auth(
    UserRole.ADMIN,
    UserRole.CANDIDATE,
    UserRole.COMPANY
  ),
  notificationController.deleteNotification
);

export const notificationRoutes = router;
