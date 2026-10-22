import type { RecordRow } from "./types";
export const KEY = "chinese-adventure.records.v1";
export function readRecords(): RecordRow[] {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(a)
      ? a.filter(
          (x) =>
            x &&
            typeof x.id === "string" &&
            typeof x.lesson === "string" &&
            Array.isArray(x.answerHistory) &&
            typeof x.attempts === "number",
        )
      : [];
  } catch {
    return [];
  }
}
export function saveRow(row: RecordRow) {
  try {
    const rows = readRecords(),
      i = rows.findIndex((x) => x.id === row.id);
    if (i < 0) rows.push(row);
    else
      rows[i] = {
        ...row,
        firstAnswer: rows[i].attempts ? rows[i].firstAnswer : row.firstAnswer,
        firstCorrect: rows[i].attempts
          ? rows[i].firstCorrect
          : row.firstCorrect,
        date: rows[i].date,
      };
    localStorage.setItem(KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}
export function csv(rows: RecordRow[]) {
  const fields = [
    "lesson",
    "task",
    "phase",
    "date",
    "firstAnswer",
    "firstCorrect",
    "latestCorrect",
    "attempts",
    "hints",
    "explanation",
    "completed",
    "selfChecked",
    "activeMs",
    "errorType",
  ] as const;
  const cell = (x: unknown) =>
    '"' +
    String(x ?? "")
      .replace(/^[=+@\-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return (
    "\uFEFF" +
    [
      fields.join(","),
      ...rows.map((r) => fields.map((k) => cell(r[k])).join(",")),
    ].join("\r\n")
  );
}
export function exportRows(format: "json" | "csv") {
  const rows = readRecords(),
    blob = new Blob(
      [format === "json" ? JSON.stringify(rows, null, 2) : csv(rows)],
      {
        type:
          format === "json"
            ? "application/json;charset=utf-8"
            : "text/csv;charset=utf-8",
      },
    ),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `语文学习手记-${new Date().toISOString().slice(0, 10)}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
