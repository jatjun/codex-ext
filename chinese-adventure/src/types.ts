export type Kind =
  | "pinyin"
  | "character"
  | "sentence"
  | "sequence"
  | "connector"
  | "opposite"
  | "map"
  | "writing"
  | "sound"
  | "dictionary"
  | "story";
export interface Task {
  mode: "choice" | "multi" | "fill" | "order" | "sort" | "open";
  prompt: string;
  options?: string[];
  answers: string[];
  bins?: string[];
  explain: string;
  example?: string;
  checks?: string[];
}
export interface Lesson {
  id: string;
  book: number;
  number: number;
  title: string;
  kind: Kind;
  tasks: Task[];
  note: string;
}
export type Stage =
  | "INTRO"
  | "OBSERVE"
  | "QUESTION"
  | "HINT_1"
  | "HINT_2"
  | "EXPLAIN"
  | "RETRY"
  | "TRANSFER"
  | "COMPLETE";
export interface Teaching {
  stage: Stage;
  errors: number;
  solved: boolean;
  needsRetry: boolean;
}
export interface RecordRow {
  questionText?: string;
  id: string;
  session: string;
  lesson: string;
  task: number;
  phase: "main" | "retry" | "transfer";
  date: string;
  firstAnswer: string;
  firstCorrect: boolean | null;
  latestCorrect: boolean | null;
  attempts: number;
  hints: number;
  explanation: boolean;
  completed: boolean;
  selfChecked: boolean;
  activeMs: number;
  answerHistory: { answer: string; correct: boolean | null; at: string }[];
  errorType: string;
}
