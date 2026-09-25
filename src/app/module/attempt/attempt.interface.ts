import { AttemptStatus } from "../../../../generated/prisma/enums";

export interface ICreateAttempt {
  invitationId: string;
}

export interface IUpdateAttemptStatus {
  status: AttemptStatus;
}

export interface IQuery {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  assessmentId?: string;
  candidateId?: string;
}
