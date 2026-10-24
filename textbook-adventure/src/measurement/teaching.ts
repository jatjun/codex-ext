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
export type Teaching = {
  stage: Stage;
  mistakes: number;
  hints: number;
  assisted: boolean;
  correct: boolean;
  explained: boolean;
};
export const initial: Teaching = {
  stage: "INTRO",
  mistakes: 0,
  hints: 0,
  assisted: false,
  correct: false,
  explained: false,
};
export type Event =
  | { type: "start" }
  | { type: "observed" }
  | { type: "answer"; correct: boolean }
  | { type: "help" }
  | { type: "retry" }
  | { type: "transfer" };
export function transition(s: Teaching, e: Event): Teaching {
  if (e.type === "start") return { ...initial, stage: "OBSERVE" };
  if (e.type === "transfer") return { ...initial, stage: "TRANSFER" };
  if (e.type === "observed")
    return s.stage === "OBSERVE" ? { ...s, stage: "QUESTION" } : s;
  if (e.type === "retry") return { ...s, stage: "RETRY", correct: false };
  if (
    e.type === "answer" &&
    s.stage !== "INTRO" &&
    s.stage !== "OBSERVE" &&
    s.stage !== "COMPLETE"
  ) {
    if (e.correct) return { ...s, correct: true, stage: "COMPLETE" };
    const mistakes = s.mistakes + 1,
      level = Math.max(mistakes, s.hints + 1);
    return {
      ...s,
      mistakes,
      hints: level,
      assisted: true,
      explained: s.explained || level >= 3,
      stage: level === 1 ? "HINT_1" : level === 2 ? "HINT_2" : "EXPLAIN",
    };
  }
  if (e.type === "help" && s.stage !== "COMPLETE") {
    const hints = s.hints + 1;
    return {
      ...s,
      hints,
      assisted: true,
      explained: s.explained || hints >= 3,
      stage: hints === 1 ? "HINT_1" : hints === 2 ? "HINT_2" : "EXPLAIN",
    };
  }
  return s;
}
export type Attempt = { answer: string; correct: boolean; time: string };
export type Row = {
  id: string;
  lesson: string;
  questionId: string;
  question: string;
  phase: "guided" | "practice" | "transfer" | "bank";
  started: string;
  firstAnswer: string | null;
  firstCorrect: boolean | null;
  attempts: Attempt[];
  hints: number;
  replays: number;
  explained: boolean;
  assisted: boolean;
  complete: boolean;
  activeSeconds: number;
  errorType: string;
};
export const RECORD_KEY = "textbook-adventure.measurement.records.v1";
export function readRows(): Row[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECORD_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter(
          (x) =>
            x &&
            typeof x.id === "string" &&
            typeof x.question === "string" &&
            (x.firstAnswer === null || typeof x.firstAnswer === "string") &&
            (x.firstCorrect === null || typeof x.firstCorrect === "boolean") &&
            ["guided", "practice", "transfer", "bank"].includes(x.phase) &&
            [x.hints, x.replays, x.activeSeconds].every(
              (v) => Number.isFinite(v) && v >= 0,
            ) &&
            [x.assisted, x.explained, x.complete].every(
              (v) => typeof v === "boolean",
            ) &&
            Array.isArray(x.attempts) &&
            x.attempts.every(
              (a: unknown) =>
                !!a &&
                typeof a === "object" &&
                typeof (a as Attempt).answer === "string",
            ),
        )
      : [];
  } catch {
    return [];
  }
}
export function updateRow(rows: Row[], fresh: Row, answer?: Attempt): Row[] {
  const old = rows.find((x) => x.id === fresh.id);
  const base = old
    ? {
        ...fresh,
        started: old.started,
        firstAnswer: old.firstAnswer,
        firstCorrect: old.firstCorrect,
        attempts: old.attempts,
        errorType: fresh.errorType || old.errorType,
        assisted: old.assisted || fresh.assisted,
        explained: old.explained || fresh.explained,
        hints: Math.max(old.hints, fresh.hints),
        replays: Math.max(old.replays, fresh.replays),
        activeSeconds: Math.max(old.activeSeconds, fresh.activeSeconds),
      }
    : fresh;
  const row = answer
    ? {
        ...base,
        firstAnswer:
          base.firstAnswer === null ? answer.answer : base.firstAnswer,
        firstCorrect:
          base.firstCorrect === null ? answer.correct : base.firstCorrect,
        attempts: [...base.attempts, answer],
        complete: answer.correct,
      }
    : base;
  return old ? rows.map((x) => (x.id === row.id ? row : x)) : [...rows, row];
}
export function writeRows(rows: Row[]): boolean {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}
export function download(rows: Row[]) {
  const u = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          { version: 1, exported: new Date().toISOString(), records: rows },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = "测量与称重学习记录.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function statistics(rows: Row[]) {
  const answered = rows.filter((r) => r.firstAnswer !== null);
  return {
    answered: answered.length,
    first: answered.filter((r) => r.firstCorrect).length,
    assisted: answered.filter((r) => r.complete && r.assisted).length,
    transfer: answered.filter((r) => r.phase === "transfer").length,
    transferIndependent: answered.filter(
      (r) => r.phase === "transfer" && r.firstCorrect && !r.assisted,
    ).length,
  };
}
