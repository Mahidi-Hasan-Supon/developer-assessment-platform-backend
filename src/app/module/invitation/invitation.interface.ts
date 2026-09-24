import { InvitationStatus } from "../../../../generated/prisma/enums";

export interface ICreateInvitation {
  assessmentId: string;
  candidateId: string;
  expiresAt?: Date;
}

export interface IUpdateInvitationStatus {
  status: InvitationStatus;
}

export interface IQuery {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
}
