import { AssessmentStatus } from "../../../../generated/prisma/enums";

export interface ICreateAssessment {
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
}

export interface IUpdateAssessment {
  title?: string;
  description?: string;
  durationMinutes?: number;
  totalMarks?: number;
  passMarks?: number;
  status?: AssessmentStatus;
}

export interface IQuery {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;

  status?: string;
  companyId?: string;
}
