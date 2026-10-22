export type Art =
  | "queen"
  | "puppy"
  | "kitten"
  | "piglet"
  | "eye"
  | "owl"
  | "dog"
  | "ink"
  | "igloo"
  | "elephant"
  | "bee"
  | "apple"
  | "bear"
  | "ant"
  | "arrow"
  | "alligator"
  | "ruler"
  | "pencil"
  | "case"
  | "book"
  | "school"
  | "breakfast"
  | "bed"
  | "fish"
  | "head"
  | "nose"
  | "stadium"
  | "kangaroo"
  | "jam"
  | "hello"
  | "bye"
  | "cry"
  | "self"
  | "play"
  | "running"
  | "football"
  | "tennis"
  | "rope";
export type Kind =
  | "word"
  | "greeting"
  | "listen"
  | "letters"
  | "phonics"
  | "sentence"
  | "playground"
  | "timetable"
  | "schoolbag";
export interface Option {
  id: string;
  label: string;
  art?: Art;
  colour?: string;
}
export interface Task {
  id: string;
  mode:
    | "choice"
    | "fill"
    | "order"
    | "count"
    | "say"
    | "draw"
    | "timetable"
    | "bag";
  prompt: string;
  english?: string;
  options?: Option[];
  answer?: string[];
  tokens?: string[];
  listen?: string[];
  scene: Art;
  letters?: string[];
  target?: string;
  caseSensitive?: boolean;
  explain: string;
  hint: string;
  checks?: string[];
  example?: string;
  label?: string;
  minItems?: number;
}
export interface Lesson {
  id: string;
  book: number;
  number: number;
  title: string;
  subtitle: string;
  kind: Kind;
  tasks: Task[];
  retry: Task;
  transfer: Task;
  note?: string;
}
export interface Stroke {
  points: { x: number; y: number }[];
  colour: string;
}
export interface Stamp {
  id: string;
  art: Art;
  x: number;
  y: number;
}
export interface Answer {
  text: string;
  tokens: string[];
  selected: number[];
  strokes: Stroke[];
  stamps: Stamp[];
  cells: string[];
  bag: Art[];
  checks: boolean[];
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
export interface RecordRow {
  questionText?: string;
  id: string;
  session: string;
  lesson: string;
  task: string;
  phase: "main" | "retry" | "transfer";
  date: string;
  firstAnswer: Answer | null;
  firstCorrect: boolean | null;
  firstAssisted: boolean;
  latestCorrect: boolean | null;
  attempts: number;
  hints: number;
  explanation: boolean;
  completed: boolean;
  selfChecked: boolean;
  heard: boolean;
  transcript: boolean;
  activeMs: number;
  history: { answer: Answer; correct: boolean | null; at: string }[];
}
