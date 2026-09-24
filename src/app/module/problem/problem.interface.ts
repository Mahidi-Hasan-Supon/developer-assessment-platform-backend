import { Difficulty, ProblemType } from "../../../../generated/prisma/enums";

export interface ICreateProblem {
  title: string;
  description: string;
  type: ProblemType;
  difficulty: Difficulty;
  marks: number;
  options?: unknown;
  answer?: string;
}
export interface IQuery {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;

  type?: string;
  difficulty?: string;
  createdBy?: string;
}
export interface IUpdateProblem {
  title?: string;
  description?: string;
  type?: ProblemType;
  difficulty?: Difficulty;
  marks?: number;
  options?: unknown;
  answer?: string;
}




