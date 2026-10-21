export const STORAGE_KEY = "math-adventure.records.v1";
export type AnswerEvent = {
  at: string;
  answer: string;
  correct: boolean;
  kind: "answer" | "help" | "retry";
};
export type RecordEntry = {
  id: string;
  session: string;
  dateTime: string;
  levelId: string;
  questionId: string;
  firstAnswer: string | null;
  firstCorrect: boolean | null;
  attempts: number;
  hints: number;
  watchedExplanation: boolean;
  transfer: boolean;
  transferResult: boolean | null;
  correct: boolean;
  completed: boolean;
  interactionMs: number;
  errors: string[];
  events: AnswerEvent[];
};
export function newEntry(
  session: string,
  levelId: string,
  questionId: string,
  transfer: boolean,
): RecordEntry {
  return {
    id: session + ":" + questionId,
    session,
    dateTime: new Date().toISOString(),
    levelId,
    questionId,
    firstAnswer: null,
    firstCorrect: null,
    attempts: 0,
    hints: 0,
    watchedExplanation: false,
    transfer,
    transferResult: null,
    correct: false,
    completed: false,
    interactionMs: 0,
    errors: [],
    events: [],
  };
}
export function answerEntry(
  r: RecordEntry,
  answer: string,
  correct: boolean,
  error: string,
  kind: AnswerEvent["kind"] = "answer",
): RecordEntry {
  const first =
    (kind === "answer" || kind === "help") && r.firstAnswer === null;
  return {
    ...r,
    firstAnswer: first ? answer : r.firstAnswer,
    firstCorrect: first ? correct : r.firstCorrect,
    attempts: r.attempts + (kind === "answer" ? 1 : 0),
    correct: kind === "answer" ? correct : r.correct,
    transferResult: r.transfer && first ? correct : r.transferResult,
    errors: !correct && kind === "answer" ? [...r.errors, error] : r.errors,
    events: [
      ...r.events,
      { at: new Date().toISOString(), answer, correct, kind },
    ],
  };
}
export function readRecords(): RecordEntry[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (v): v is RecordEntry =>
        !!v &&
        typeof v === "object" &&
        typeof v.id === "string" &&
        typeof v.levelId === "string" &&
        Array.isArray(v.events) &&
        Array.isArray(v.errors) &&
        typeof v.interactionMs === "number" &&
        typeof v.attempts === "number",
    );
  } catch {
    return [];
  }
}
export function writeRecord(entry: RecordEntry): boolean {
  try {
    const list = readRecords();
    const index = list.findIndex((r) => r.id === entry.id);
    if (index < 0) list.push(entry);
    else list[index] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
export function report(records: RecordEntry[]) {
  const main = records.filter((r) => !r.transfer && r.firstAnswer !== null);
  const transfer = records.filter((r) => r.transfer && r.firstAnswer !== null);
  const helped = records.filter((r) => r.hints > 0 && r.attempts > 0);
  const rate = (a: RecordEntry[], predicate: (r: RecordEntry) => boolean) => ({
    correct: a.filter(predicate).length,
    total: a.length,
  });
  return {
    first: rate(main, (r) => r.firstCorrect === true),
    helped: rate(helped, (r) => r.correct),
    transfer: rate(transfer, (r) => r.transferResult === true),
  };
}
export function exportRecords(records: RecordEntry[], format: "json" | "csv") {
  const headers = [
    "dateTime",
    "session",
    "levelId",
    "questionId",
    "firstAnswer",
    "firstCorrect",
    "attempts",
    "hints",
    "watchedExplanation",
    "transfer",
    "transferResult",
    "correct",
    "completed",
    "interactionMs",
    "errors",
  ] as const;
  const cell = (value: unknown) =>
    '"' + String(value ?? "").replaceAll('"', '""') + '"';
  const data =
    format === "json"
      ? JSON.stringify(records, null, 2)
      : "\uFEFF" +
        headers.join(",") +
        "\r\n" +
        records
          .map((r) =>
            headers
              .map((h) => cell(Array.isArray(r[h]) ? r[h].join("；") : r[h]))
              .join(","),
          )
          .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([data], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download =
    "math-adventure-" + new Date().toISOString().slice(0, 10) + "." + format;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
