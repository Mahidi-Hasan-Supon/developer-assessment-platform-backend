export interface ICreateAssessmentProblem {
  problemId: string;
  order: number;
  marks?: number;
}

export interface IUpdateAssessmentProblem {
  order?: number;
  marks?: number;
}

export interface IAssessmentProblemQuery {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  type?: string;
  difficulty?: string;
}

