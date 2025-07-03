export interface ProblemMetadata {
  functionName: string;
  inputs: Array<{ type: string; name: string }>;
  output: { type: string; name: string };
}

export interface ProblemDetails {
  id: number;
  functionName: string;
  inputs: Array<{ type: string; name: string }>;
  output: { type: string; name: string };
  problemTitle: string;
  problemDescription: string;
  problemExample: string;
  testCases: any;
}

export interface createSubmission {
  code: string;
  languageId: number,
  studentId: number,
  questionId: number,
  isSubmitted: boolean
}