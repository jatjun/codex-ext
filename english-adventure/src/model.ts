import type { Answer, Task } from "./types";
export const emptyAnswer = (): Answer => ({
  text: "",
  tokens: [],
  selected: [],
  strokes: [],
  stamps: [],
  cells: Array(25).fill(""),
  bag: [],
  checks: [],
});
export function normalized(s: string, caseSensitive = false) {
  const v = s
    .normalize("NFC")
    .trim()
    .replace(/[‘’]/g, "'")
    .replace(/[.!?。！？，,]/g, "")
    .replace(/\s+/g, " ");
  return caseSensitive ? v : v.toLowerCase();
}
export function grade(t: Task, a: Answer): boolean | null {
  if (["say", "draw", "timetable", "bag"].includes(t.mode)) return null;
  if (t.mode === "count") {
    const selected = t
      .letters!.map((x, i) => (x === t.target ? i : -1))
      .filter((i) => i >= 0);
    return (
      a.text.trim() === String(selected.length) &&
      a.selected.length === selected.length &&
      selected.every((i) => a.selected.includes(i))
    );
  }
  const v = t.mode === "order" ? a.tokens.join(" ") : a.text;
  return (t.answer || []).some(
    (x) => normalized(x, t.caseSensitive) === normalized(v, t.caseSensitive),
  );
}
export function canSubmit(t: Task, a: Answer) {
  switch (t.mode) {
    case "count":
      return !!a.text && a.selected.length > 0;
    case "order":
      return a.tokens.length === t.tokens!.length;
    case "say":
      return true;
    case "draw":
      return (
        (a.stamps.length > 0 || a.strokes.some((s) => s.points.length > 1)) &&
        a.text.trim().length > 0
      );
    case "timetable":
      return a.cells.every(Boolean) && a.text.trim().length > 0;
    case "bag":
      return (
        (a.bag.length > 0 || a.strokes.some((s) => s.points.length > 1)) &&
        a.text.trim().length > 0
      );
    default:
      return !!a.text.trim();
  }
}
export function hintStage(n: number) {
  return n === 1 ? "HINT_1" : n === 2 ? "HINT_2" : "EXPLAIN";
}
export function mix<T>(a: T[]): T[] {
  return a.length > 1 ? [...a.slice(1).reverse(), a[0]] : [...a];
}
export function countLetters(t: Task) {
  return t.letters?.filter((c) => c === t.target).length || 0;
}
