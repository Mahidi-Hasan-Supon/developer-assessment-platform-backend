import { Request, Response } from "express";
import httpStatus from "http-status";
import { UserRole } from "../../../../generated/prisma/enums";
import { invitationService } from "./invitation.service";
import { catchAsync } from "../../utiles/catchAsync";
import { sendResponse } from "../../utiles/sendResponse";

const createInvitation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const result = await invitationService.createInvitation(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invitation sent successfully",
    data: result,
  });
});

const getMyInvitations = catchAsync(async (req: Request, res: Response) => {
  const candidateId = req.user?.userId as string;

  const result = await invitationService.getMyInvitations(candidateId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitations retrieved successfully",
    data: result,
  });
});

const getAssessmentInvitations = catchAsync(
  async (req: Request, res: Response) => {
    const { assessmentId } = req.params;
    const userId = req.user?.userId as string;

    const result = await invitationService.getAssessmentInvitations(
      assessmentId as string,
      userId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assessment invitations retrieved successfully",
      data: result,
    });
  },
);

const updateInvitationStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { invitationId } = req.params;

    const userId = req.user?.userId as string;
    const role = req.user?.role as UserRole;

    const result = await invitationService.updateInvitationStatus(
      invitationId as string,
      req.body,
      userId,
      role,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Invitation status updated successfully",
      data: result,
    });
  },
);

const deleteInvitation = catchAsync(async (req: Request, res: Response) => {
  const { invitationId } = req.params;
  const userId = req.user?.userId as string;

  const result = await invitationService.deleteInvitation(
    invitationId as string,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation deleted successfully",
    data: result,
  });
});

export const invitationController = {
  createInvitation,
  getMyInvitations,
  getAssessmentInvitations,
  updateInvitationStatus,
  deleteInvitation,
};
