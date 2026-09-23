export interface ICreateAssessmentProblem {
  problemId: string;
  order: number;
  marks?: number;
}

export interface IUpdateAssessmentProblem {
  order?: number;
  marks?: number;
}
