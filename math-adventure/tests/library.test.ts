import { it, expect } from "vitest";
import { mathLibrary } from "../src/library/catalog";
import { restoreMathRecord } from "../src/library/review";
import { buildLesson, defaultValues } from "../src/pdf/model";
import { newEntry } from "../src/records/store";
import { buildLevel } from "../src/questions/builders";
import { defaults } from "../src/questions/models";
it("260个原题地址独立保留，只有1题待核对；可用题有完整条件和问题", () => {
  expect(mathLibrary).toHaveLength(260);
  expect(new Set(mathLibrary.map((e) => e.id)).size).toBe(260);
  expect(mathLibrary.filter((e) => e.pending)).toHaveLength(1);
  for (const e of mathLibrary.filter((e) => !e.pending)) {
    expect(e.story.length, e.id).toBeGreaterThan(0);
    expect(e.prompts.length, e.id).toBeGreaterThan(0);
  }
});
it("同题型跨上传批次汇总，保留来源", () => {
  const rows = mathLibrary.filter((e) => e.topic === "排队与方阵");
  expect(rows.some((e) => e.id.startsWith("queue-"))).toBe(true);
  expect(rows.some((e) => e.id.startsWith("pdf-"))).toBe(true);
  expect(rows.every((e) => e.source)).toBe(true);
});
it("改过数字的快照按当时题目重做，不退回默认数字", () => {
  const values = { ...defaultValues(12) };
  const lesson = buildLesson(12, values);
  const r = {
    ...newEntry("s", "pdf-12", "main-" + lesson.tasks[0].id, false),
    questionText: lesson.tasks[0].prompt,
    parameters: JSON.stringify({ original: values }),
    lessonSnapshot: lesson,
  };
  const restored = restoreMathRecord(r);
  expect(restored.kind).toBe("pdf");
  if (restored.kind === "pdf") {
    expect(restored.lesson.tasks[0].answer).toBe(lesson.tasks[0].answer);
    expect(restored.lesson.scene).toEqual(lesson.scene);
  }
});
it("基础题保存快照可重做，缺失条件的旧迁移不会猜题", () => {
  const l = buildLevel("shop", defaults),
    q = l.questions[0],
    r = {
      ...newEntry("s", "shop", q.id, false),
      questionText: q.prompt,
      questionSnapshot: q,
      parameters: JSON.stringify(l.model),
    };
  expect(restoreMathRecord(r).kind).toBe("base");
  expect(() =>
    restoreMathRecord({
      ...r,
      questionSnapshot: undefined,
      questionId: "unknown-old-transfer",
      questionText: "旧题缺失",
    }),
  ).toThrow(/快照/);
});
