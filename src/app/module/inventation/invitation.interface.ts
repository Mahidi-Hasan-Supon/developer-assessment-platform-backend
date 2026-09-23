import { InvitationStatus } from "../../../../generated/prisma/enums";

export interface ICreateInvitation {
  assessmentId: string;
  candidateId: string;
  expiresAt?: Date;
}

export interface IUpdateInvitationStatus {
  status: InvitationStatus;
}
