import type { Task, Teaching } from "./types";
export const initial: Teaching = {
  stage: "INTRO",
  errors: 0,
  solved: false,
  needsRetry: false,
};
export function answerState(s: Teaching, correct: boolean): Teaching {
  if (s.solved || s.stage === "EXPLAIN") return s;
  if (correct) return { ...s, solved: true };
  const errors = s.errors + 1;
  return {
    ...s,
    errors,
    stage: errors === 1 ? "HINT_1" : errors === 2 ? "HINT_2" : "EXPLAIN",
    needsRetry: errors >= 3,
  };
}
export function helpState(s: Teaching): Teaching {
  return answerState(s, false);
}
// 保留声调、ü及字形差别，仅忽略空白、句末标点与等价的分隔符。
export function normalize(s: string) {
  return s
    .normalize("NFC")
    .trim()
    .replace(/[\s，,。！!？?；;、…—\-]/g, "")
    .replace(/ɡ/g, "g");
}
export function grade(task: Task, answer: string | string[]): boolean | null {
  if (task.mode === "open") return null;
  if (task.mode === "sort")
    return (
      Array.isArray(answer) &&
      answer.length === task.answers.length &&
      answer.every((x, i) => x === task.answers[i])
    );
  if (task.mode === "multi")
    return (
      Array.isArray(answer) &&
      answer.length === task.answers.length &&
      task.answers.every((x) => answer.includes(x))
    );
  const text = Array.isArray(answer) ? answer.join("") : answer;
  return task.answers.some((x) => normalize(x) === normalize(text));
}
export function shuffled<T>(a: T[]): T[] {
  // 可复现的打乱，不改变题库原数组；避免答案按原顺序展示
  return a.length > 1
    ? [
        ...a.filter((_, i) => i % 2 === 1).reverse(),
        ...a.filter((_, i) => i % 2 === 0).reverse(),
      ]
    : [...a];
}
