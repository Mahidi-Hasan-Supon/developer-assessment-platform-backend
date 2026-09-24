
import { ProblemType } from "../../../../generated/prisma/enums";

export interface ICreateAnswer {
  submissionId: string;
  problemId: string;
  answer?: string;
}