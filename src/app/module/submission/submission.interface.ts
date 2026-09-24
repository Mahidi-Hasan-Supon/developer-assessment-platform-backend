import { SubmissionStatus } from "../../../../generated/prisma/enums";

export interface ICreateSubmission {
  attemptId: string;
}

export interface IUpdateSubmissionStatus {
  status: SubmissionStatus;
}