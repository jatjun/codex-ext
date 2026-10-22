export const KEY = "textbook-adventure.records.v1";
export interface Row {
  id: string;
  lesson: string;
  question: string;
  phase: string;
  time: string;
  firstAnswer: string;
  firstCorrect: boolean;
  attempts: number;
  hints: number;
  replays: number;
  finalCorrect: boolean;
  independent: boolean;
  explanation: boolean;
  seconds: number;
  history: { answer: string; correct: boolean }[];
}
export function read(): Row[] {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(x)) throw Error();
    return x.filter(
      (r) => r && typeof r.id === "string" && Array.isArray(r.history),
    );
  } catch {
    return [];
  }
}
export function write(rows: Row[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}
export function result(r: Row) {
  return !r.finalCorrect
    ? "尚未完成"
    : r.independent
      ? "独立正确"
      : r.explanation
        ? "讲解后正确"
        : "提示后正确";
}
