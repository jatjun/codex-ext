import { describe, it, expect } from "vitest";
import { lessons } from "../src/catalog";
import {
  grade,
  answerState,
  helpState,
  initial,
  shuffled,
} from "../src/teaching";
import { variant } from "../src/variants";
import { csv, KEY, readRecords, saveRow } from "../src/records";
import type { RecordRow } from "../src/types";
describe("PDF逐题结构审计", () => {
  it("5册各25题、唯一地址", () => {
    expect(lessons).toHaveLength(125);
    expect(new Set(lessons.map((x) => x.id)).size).toBe(125);
    for (let i = 1; i <= 5; i++)
      expect(lessons.filter((x) => x.book === i).map((x) => x.number)).toEqual(
        Array.from({ length: 25 }, (_, j) => j + 1),
      );
  });
  for (const l of lessons)
    it(`${l.id} ${l.title}`, () => {
      expect(l.tasks.length).toBeGreaterThan(0);
      for (const t of l.tasks) {
        expect(t.explain.length).toBeGreaterThan(5);
        if (t.mode === "open") {
          expect(t.answers).toEqual([]);
          expect(t.checks!.length).toBeGreaterThan(1);
          expect(grade(t, "自己的表达")).toBeNull();
        } else if (t.mode === "sort") {
          expect(t.answers.length).toBe(t.options!.length);
          expect(t.answers.every((a) => +a >= 0 && +a < t.bins!.length)).toBe(
            true,
          );
          expect(grade(t, t.answers)).toBe(true);
          expect(grade(t, [])).toBe(false);
        } else {
          expect(grade(t, t.mode === "multi" ? t.answers : t.answers[0])).toBe(
            true,
          );
          expect(grade(t, "不相关")).toBe(false);
          if (t.mode === "choice" || t.mode === "multi")
            expect(t.answers.every((a) => t.options!.includes(a))).toBe(true);
          if (t.mode === "order") expect(grade(t, t.options!)).toBe(true);
        }
        const original = JSON.stringify(t);
        shuffled(t.options || []);
        expect(JSON.stringify(t)).toBe(original);
      }
      expect(variant(l.kind, "retry").prompt).not.toBe(
        variant(l.kind, "transfer").prompt,
      );
    });
});
it("原PDF错误修正及独立知识核对", () => {
  const get = (id: string) => lessons.find((l) => l.id === id)!.tasks;
  expect(get("cn-4-19")[0].answers).toEqual(["竖"]);
  expect(get("cn-4-8")[5].answers).toEqual(["抬"]);
  expect(
    get("cn-4-20")
      .filter((t) => t.prompt.includes("几画"))
      .map((t) => t.answers[0]),
  ).toEqual(["6", "6", "10"]);
  expect(get("cn-3-20")[1].answers).toEqual(["因为"]);
  expect(get("cn-5-17")[0].answers).toEqual(["yě xǔ"]);
  expect(get("cn-5-21")[0].answers).toEqual(["J"]);
  expect(get("cn-2-7")[0].answers).toHaveLength(10);
  expect(get("cn-1-12")[0].answers).toEqual(["不对"]);
});
it("声调和ü必须正确", () => {
  const t = lessons.find((l) => l.id === "cn-5-17")!.tasks[0];
  expect(grade(t, "yé xǔ")).toBe(false);
  expect(grade({ ...t, answers: ["ü"] }, "u")).toBe(false);
});
it("轻提示→图形提示→讲解→必须重试，已答对防重复", () => {
  let s = answerState({ ...initial, stage: "QUESTION" }, false);
  expect(s.stage).toBe("HINT_1");
  s = answerState(s, false);
  expect(s.stage).toBe("HINT_2");
  s = helpState(s);
  expect(s.stage).toBe("EXPLAIN");
  expect(s.needsRetry).toBe(true);
  expect(answerState(s, true).solved).toBe(false);
  s = answerState({ ...initial, stage: "QUESTION" }, true);
  expect(answerState(s, false)).toEqual(s);
});
it("多选不能漏选或多选", () => {
  const t = lessons.find((l) => l.id === "cn-2-5")!.tasks[0];
  expect(grade(t, ["hua", "tian"])).toBe(true);
  expect(grade(t, ["hua"])).toBe(false);
  expect(grade(t, ["hua", "tian", "ma"])).toBe(false);
});
const mem = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => mem.get(k) || null,
    setItem: (k: string, v: string) => mem.set(k, v),
  },
  configurable: true,
});
const row: RecordRow = {
  id: "one",
  session: "s",
  lesson: "cn-1-1",
  task: 0,
  phase: "main",
  date: "2026-10-22",
  firstAnswer: "初次错误",
  firstCorrect: false,
  latestCorrect: false,
  attempts: 1,
  hints: 0,
  explanation: false,
  completed: false,
  selfChecked: false,
  activeMs: 1000,
  answerHistory: [],
  errorType: "character",
};
it("首次错误不可覆盖", () => {
  mem.clear();
  saveRow(row);
  saveRow({
    ...row,
    firstAnswer: "后来正确",
    firstCorrect: true,
    latestCorrect: true,
    attempts: 2,
  });
  expect(readRecords()[0].firstAnswer).toBe("初次错误");
  expect(readRecords()[0].firstCorrect).toBe(false);
  expect(readRecords()[0].latestCorrect).toBe(true);
});
it("提示先于作答不会锁死首次答案", () => {
  mem.clear();
  saveRow({ ...row, attempts: 0, firstAnswer: "", firstCorrect: null });
  saveRow(row);
  expect(readRecords()[0].firstAnswer).toBe(row.firstAnswer);
});
it("损坏记录退回空数组", () => {
  mem.set(KEY, "invalid");
  expect(readRecords()).toEqual([]);
  mem.set(KEY, "[null,{}]");
  expect(readRecords()).toEqual([]);
});
it("CSV转义并防电子表格公式", () =>
  expect(csv([{ ...row, firstAnswer: '=1+"2"' }])).toContain('"\'=1+""2"""'));
it("关联词填空接受可成立的其他表达", () => {
  const get = (id: string) => lessons.find((l) => l.id === id)!.tasks[0];
  expect(grade(get("cn-4-1"), "只要……就……")).toBe(true);
  expect(grade(get("cn-4-2"), "不论……都……")).toBe(true);
});
