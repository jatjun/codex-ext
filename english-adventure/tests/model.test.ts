import { describe, it, expect, beforeEach } from "vitest";
import { lessons } from "../src/catalog";
import {
  grade,
  emptyAnswer,
  canSubmit,
  normalized,
  countLetters,
  hintStage,
  mix,
} from "../src/model";
import { KEY, readRecords, saveRow, toCSV } from "../src/records";
import type { RecordRow } from "../src/types";
const find = (b: number, n: number) =>
  lessons.find((l) => l.book === b && l.number === n)!;
describe("原题完整性与英语规则", () => {
  it("两本完整18+12入口，重试与迁移独立", () => {
    expect(lessons).toHaveLength(30);
    expect(lessons.filter((l) => l.book === 1)).toHaveLength(18);
    for (const l of lessons) {
      expect(l.tasks.length).toBeGreaterThan(0);
      expect(l.retry.id).not.toBe(l.transfer.id);
      expect(l.retry.id).not.toBe(l.tasks[0].id);
    }
  });
  it("五组听力、三组匹配均保留", () => {
    expect(find(2, 1).tasks).toHaveLength(5);
    expect(find(2, 3).tasks).toHaveLength(3);
  });
  it.each([
    [1, 11, 4],
    [1, 18, 4],
  ])("大小写分开计数 %s-%s", (b, n, expected) => {
    const t = find(b, n).tasks[0];
    expect(countLetters(t)).toBe(expected);
    const a = emptyAnswer();
    a.text = String(expected);
    a.selected = t.letters!.flatMap((c, i) => (c === t.target ? [i] : []));
    expect(grade(t, a)).toBe(true);
    a.selected[0] = t.letters!.findIndex((c) => c !== t.target);
    expect(grade(t, a)).toBe(false);
  });
  it("queen以q开头，eye/puppy对应图片", () => {
    expect(find(1, 1).tasks[0].answer).toEqual(["q"]);
    expect(find(1, 9).tasks[0].answer).toEqual(["eye"]);
    expect(find(2, 2).tasks[0].answer).toEqual(["puppy"]);
  });
  it("igloo有两个o，错误iglo不能当正确拼写", () => {
    const t = find(1, 13).tasks.find((t) => t.mode === "fill")!;
    expect(grade(t, { ...emptyAnswer(), text: "igloo" })).toBe(true);
    expect(grade(t, { ...emptyAnswer(), text: "iglo" })).toBe(false);
  });
  it("Hi大小写严格；Hello不是听到的Hi", () => {
    const t = find(2, 5).tasks[0];
    expect(grade(t, { ...emptyAnswer(), text: "Hi" })).toBe(true);
    expect(grade(t, { ...emptyAnswer(), text: "hi" })).toBe(false);
    expect(grade(t, { ...emptyAnswer(), text: "Hello" })).toBe(false);
  });
  it("大小写、词边界与弯引号", () => {
    expect(normalized("  Hello! I’m Pip. ")).toBe("hello i'm pip");
    expect(normalized("Letsplay")).not.toBe(normalized("Lets play"));
  });
  it("jam明确区分浊塞擦音和字母名", () => {
    expect(find(1, 10).tasks[0].explain).toContain("浊塞擦音");
    expect(find(1, 10).tasks[0].explain).toContain("/dʒeɪ/");
  });
  it("箭头任务听整个单词，而非靠共同首音猜测", () => {
    expect(find(1, 17).tasks[0].listen).toEqual(["arrow"]);
    expect(find(1, 17).tasks[0].answer).toEqual(["arrow"]);
  });
  it("重排不改变原数组", () => {
    const a = ["a", "b", "c"];
    expect(mix(a)).not.toEqual(a);
    expect(a).toEqual(["a", "b", "c"]);
  });
  it("提示逐级增加", () =>
    expect([1, 2, 3].map(hintStage)).toEqual(["HINT_1", "HINT_2", "EXPLAIN"]));
  it("25格课程表不能少一格、作品需要动手和表达", () => {
    const t = find(2, 9).tasks[0],
      a = emptyAnswer();
    a.text = "I like English.";
    a.cells.fill("English");
    expect(canSubmit(t, a)).toBe(true);
    a.cells[24] = "";
    expect(canSubmit(t, a)).toBe(false);
    const d = find(2, 8).tasks[0];
    expect(canSubmit(d, a)).toBe(false);
    a.stamps.push({ id: "1", art: "running", x: 10, y: 10 });
    expect(canSubmit(d, a)).toBe(true);
  });
  it("所有开放题不伪造自动评分", () => {
    for (const l of lessons)
      for (const t of [...l.tasks, l.retry, l.transfer])
        if (["say", "draw", "timetable", "bag"].includes(t.mode))
          expect(grade(t, emptyAnswer())).toBeNull();
  });
  it("每个客观任务标准答案可通过，选项与拼词数据一致", () => {
    for (const l of lessons)
      for (const t of [...l.tasks, l.retry, l.transfer]) {
        if (["say", "draw", "timetable", "bag"].includes(t.mode)) continue;
        const a = emptyAnswer();
        if (t.mode === "count") {
          a.selected = t.letters!.flatMap((v, i) =>
            v === t.target ? [i] : [],
          );
          a.text = String(a.selected.length);
        } else if (t.mode === "order") a.tokens = t.tokens!;
        else a.text = t.answer![0];
        expect(grade(t, a), `${l.id}/${t.id}`).toBe(true);
        if (t.options)
          expect(t.options.some((o) => o.id === t.answer![0])).toBe(true);
      }
  });
});
describe("原始记录不可覆盖", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) || null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
    });
  });
  const row = (): RecordRow => ({
    id: "x",
    session: "s",
    lesson: "en-1-1",
    task: "q",
    phase: "main",
    date: "2026-10-22",
    firstAnswer: { ...emptyAnswer(), text: "k" },
    firstCorrect: false,
    firstAssisted: false,
    latestCorrect: false,
    attempts: 1,
    hints: 0,
    explanation: false,
    completed: false,
    selfChecked: false,
    heard: false,
    transcript: false,
    activeMs: 100,
    history: [],
  });
  it("后续正确保留首次错误和首次是否独立", () => {
    saveRow(row());
    saveRow({
      ...row(),
      firstAnswer: { ...emptyAnswer(), text: "q" },
      firstCorrect: true,
      firstAssisted: true,
      latestCorrect: true,
      attempts: 2,
    });
    const r = readRecords()[0];
    expect(r.firstAnswer?.text).toBe("k");
    expect(r.firstCorrect).toBe(false);
    expect(r.firstAssisted).toBe(false);
    expect(r.latestCorrect).toBe(true);
  });
  it("未作答的帮助记录不会锁定空的首次答案", () => {
    saveRow({ ...row(), attempts: 0, firstAnswer: null, firstCorrect: null });
    saveRow({ ...row(), firstAssisted: true });
    expect(readRecords()[0].firstAnswer?.text).toBe("k");
    expect(readRecords()[0].firstAssisted).toBe(true);
  });
  it("损坏记录不崩溃，CSV防公式注入", () => {
    store.set(KEY, "{broken");
    expect(readRecords()).toEqual([]);
    expect(toCSV([{ ...row(), lesson: "=SUM(1)" }])).toContain("'=SUM(1)");
  });
});
