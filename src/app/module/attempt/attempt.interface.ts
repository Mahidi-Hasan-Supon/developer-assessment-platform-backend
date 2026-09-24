import { AttemptStatus } from "../../../../generated/prisma/enums";

export interface ICreateAttempt {
  invitationId: string;
}

export interface IUpdateAttemptStatus {
  status: AttemptStatus;
}