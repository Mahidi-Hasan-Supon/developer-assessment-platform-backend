export interface ICreateAnswer {
  submissionId: string;
  problemId: string;
  answer: string;
}

export interface IEvaluateAnswer {
  marks: number;
}