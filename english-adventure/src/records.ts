import type { RecordRow } from "./types";
export const KEY = "english-adventure.records.v1";
export function readRecords(): RecordRow[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data)
      ? data.filter(
          (x) =>
            x &&
            typeof x.id === "string" &&
            typeof x.lesson === "string" &&
            Array.isArray(x.history),
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
    if (i === -1) rows.push(row);
    else {
      const old = rows[i];
      rows[i] = {
        ...row,
        date: old.date,
        ...(old.attempts
          ? {
              firstAnswer: old.firstAnswer,
              firstCorrect: old.firstCorrect,
              firstAssisted: old.firstAssisted,
            }
          : {}),
      };
    }
    localStorage.setItem(KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}
export function toCSV(rows: RecordRow[]) {
  const fields = [
    "lesson",
    "task",
    "phase",
    "date",
    "firstAnswer",
    "firstCorrect",
    "firstAssisted",
    "latestCorrect",
    "attempts",
    "hints",
    "explanation",
    "selfChecked",
    "heard",
    "transcript",
    "completed",
    "activeMs",
  ] as const;
  const cell = (v: unknown) => {
    let text = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    if (/^[\s]*[=+@\-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      fields.join(","),
      ...rows.map((r) => fields.map((k) => cell(r[k])).join(",")),
    ].join("\r\n")
  );
}
export function download(format: "json" | "csv") {
  const rows = readRecords(),
    url = URL.createObjectURL(
      new Blob(
        [format === "json" ? JSON.stringify(rows, null, 2) : toCSV(rows)],
        {
          type:
            format === "json"
              ? "application/json;charset=utf-8"
              : "text/csv;charset=utf-8",
        },
      ),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `英语学习手记-${new Date().toISOString().slice(0, 10)}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
