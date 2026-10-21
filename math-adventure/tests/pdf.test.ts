import { describe, expect, it } from "vitest";
import {
  buildRetryLesson,
  demonstrationCounts,
  buildLesson,
  catalog,
  checkTask,
  defaultValues,
  defaults,
  shapeCounts,
  validate,
} from "../src/pdf/model";
describe("PDF notebook mathematical models", () => {
  it("has all 21 source questions and distinct stable task IDs", () => {
    expect(catalog).toHaveLength(21);
    for (let id = 1; id <= 21; id++) {
      const lesson = buildLesson(id);
      expect(lesson.id).toBe(id);
      expect(lesson.tasks.length).toBeGreaterThan(0);
      expect(new Set(lesson.tasks.map((t) => t.id)).size).toBe(
        lesson.tasks.length,
      );
      expect(validate(id, defaultValues(id))).toEqual([]);
    }
  });
  for (let id = 1; id <= 6; id++)
    it(`source ${id}: actual SVG parts match every category in the PDF answer`, () => {
      const l = buildLesson(id);
      if (l.scene.type !== "pieces") throw Error("scene");
      for (const [kind, n] of shapeCounts[id])
        expect(l.scene.pieces.filter((p) => p.kind === kind)).toHaveLength(n);
      expect(new Set(l.scene.pieces.map((p) => p.id)).size).toBe(
        l.scene.pieces.length,
      );
    });
  it("animal front/back excludes the target, and running direction is explicit", () => {
    expect(buildLesson(7).tasks.map((t) => t.answer)).toEqual([
      "4",
      "2",
      "小鸡",
      "大象",
    ]);
    expect(buildLesson(8).tasks[0].answer).toBe("小云");
    expect(buildLesson(9).tasks.map((t) => t.answer)).toEqual([
      "小狗",
      "小猫、蜗牛",
      "小狗",
      "蜗牛",
    ]);
    expect(buildLesson(10).tasks.map((t) => t.answer)).toEqual([
      "小鸡",
      "孔雀、小鹅",
      "小鸡",
      "小鹅",
    ]);
  });
  it("solids retain the full 12-object sequence and source ordinals", () => {
    const l = buildLesson(11);
    expect(l.tasks.map((t) => t.answer)).toEqual([
      "8",
      "11",
      "2",
      "3",
      "2",
      "长方体4",
    ]);
    if (l.scene.type === "solids") expect(l.scene.items).toHaveLength(12);
  });
  it("part/whole and original amounts follow the source diagram", () => {
    expect(buildLesson(12).tasks.map((t) => t.answer)).toEqual(["14", "14"]);
    expect(buildLesson(13).tasks[0].answer).toBe("17");
    expect(buildLesson(14).tasks[0].answer).toBe("11");
    expect(buildLesson(15).tasks[0].answer).toBe("14");
  });
  it("both promotions include exact-threshold purchases and accept open plans", () => {
    expect(
      buildLesson(16)
        .tasks.slice(0, 2)
        .map((t) => t.answer),
    ).toEqual(["26", "30"]);
    const l = buildLesson(17);
    expect(l.tasks.slice(0, 2).map((t) => t.answer)).toEqual(["不够", "15"]);
    expect(checkTask(l, l.tasks[1], "15", [], [0, 0, 0, 1, 0, 1])).toBe(true);
    expect(checkTask(l, l.tasks[2], "22", [], [1, 0, 0, 0, 0, 1])).toBe(true);
    expect(checkTask(l, l.tasks[2], "15", [], [0, 0, 0, 0, 0, 1])).toBe(false);
  });
  it("does not accept a memorised correct price with the wrong basket", () => {
    const l = buildLesson(16);
    expect(checkTask(l, l.tasks[0], "26", [], [0, 0, 0, 0, 0, 0])).toBe(false);
    expect(checkTask(l, l.tasks[0], "26", [], [0, 1, 1, 0, 0, 0])).toBe(true);
  });
  it("distinguishes different goods from two possibly identical racket sets", () => {
    expect(buildLesson(18).tasks.map((t) => t.answer)).toEqual(["19", "94"]);
    expect(buildLesson(19).tasks.map((t) => t.answer)).toEqual(["10", "15"]);
    expect(buildLesson(20).tasks.map((t) => t.answer)).toEqual(["26", "51"]);
    const l = buildLesson(21);
    expect(l.tasks.map((t) => t.answer)).toEqual(["44", "88"]);
    expect(checkTask(l, l.tasks[0], "44", [], [2, 0, 0])).toBe(true);
    const d = buildLesson(20);
    expect(checkTask(d, d.tasks[0], "26", [], [0, 0, 2])).toBe(false);
  });
  it("requires exact object selections, including valid empty selections", () => {
    const l = buildLesson(9),
      t = l.tasks[1];
    expect(checkTask(l, t, "", ["item-2", "item-3"], [])).toBe(true);
    expect(checkTask(l, t, "", ["item-1", "item-2", "item-3"], [])).toBe(false);
    const edge = buildLesson(9, { ...defaultValues(9), target: 1 });
    expect(checkTask(edge, edge.tasks[0], "", [], [])).toBe(true);
  });
  it("all edited models and independent variants have valid answers and distinct models", () => {
    for (let id = 1; id <= 21; id++) {
      const values = defaultValues(id),
        a = buildLesson(id, values),
        b = buildLesson(id, values, true);
      expect(JSON.stringify(a.scene)).not.toBe(JSON.stringify(b.scene));
      for (const t of [...a.tasks, ...b.tasks])
        expect(t.answer).not.toBe("NaN");
      if (b.scene.type === "pieces") {
        for (const [kind] of shapeCounts[id])
          expect(b.scene.pieces.filter((p) => p.kind === kind).length).toBe(
            Number(b.tasks.find((t) => t.focus === kind)!.answer),
          );
      }
    }
  });
  it("rejects impossible quantities, unaffordable promotion plans and fractional inputs", () => {
    expect(validate(14, { a: 5, b: 6 })).not.toEqual([]);
    expect(validate(7, { total: 5, target: 6 })).not.toEqual([]);
    expect(validate(13, { a: 2.5, b: 3 })).not.toEqual([]);
    expect(validate(16, { ...defaultValues(16), discount: 40 })).not.toEqual(
      [],
    );
    expect(validate(17, { ...defaultValues(17), threshold: 200 })).not.toEqual(
      [],
    );
    expect(validate(16, { ...defaultValues(16), threshold: 200 })).not.toEqual(
      [],
    );
  });
  it("a large selection cannot exploit negative counts or blank numeric answers", () => {
    const l = buildLesson(21);
    expect(checkTask(l, l.tasks[0], "44", [], [-1, 0, 2])).toBe(false);
    const n = buildLesson(7, { total: 3, target: 1 });
    expect(checkTask(n, n.tasks[0], "", [], [])).toBe(false);
  });
  it("full demonstration plans satisfy every shopping condition", () => {
    for (let id = 16; id <= 21; id++)
      for (const variant of [false, true]) {
        const l = buildLesson(id, defaultValues(id), variant);
        if (l.scene.type !== "shop") throw Error("shop");
        for (const t of l.tasks) {
          const counts = demonstrationCounts(l.scene, t);
          const total = l.scene.items.reduce(
            (a, item, i) => a + item.price! * counts[i],
            0,
          );
          const answer =
            t.answer === "dynamic"
              ? String(total - l.scene.discount!)
              : t.answer;
          expect(checkTask(l, t, answer, [], counts)).toBe(true);
        }
      }
  });
  it("promotion transfers change prices used in fixed calculation questions", () => {
    for (const id of [16, 17]) {
      const a = buildLesson(id),
        b = buildLesson(id, defaultValues(id), true);
      expect(b.tasks.slice(0, 2).map((t) => t.answer)).not.toEqual(
        a.tasks.slice(0, 2).map((t) => t.answer),
      );
    }
  });
  it("practice after a full explanation never reuses the independent assessment", () => {
    for (let id = 1; id <= 21; id++) {
      const v = defaultValues(id),
        retry = buildRetryLesson(id, v),
        transfer = buildLesson(id, v, true);
      expect(JSON.stringify(retry.scene)).not.toBe(
        JSON.stringify(transfer.scene),
      );
      expect(JSON.stringify(retry.tasks[0])).not.toBe(
        JSON.stringify(transfer.tasks[0]),
      );
    }
  });
  it("separate retry models remain available for valid boundary edits and boolean threshold crossings", () => {
    for (let id = 1; id <= 21; id++)
      for (const f of defaults(id))
        for (const n of [f.min, f.max]) {
          const values = { ...defaultValues(id), [f.key]: n };
          if (validate(id, values).length) continue;
          const retry = buildRetryLesson(id, values),
            transfer = buildLesson(id, values, true);
          expect(JSON.stringify(retry.scene)).not.toBe(
            JSON.stringify(transfer.scene),
          );
        }
    const values = { ...defaultValues(17), p0: 12 };
    expect(buildLesson(17, values).tasks[0].answer).toBe("不够");
    expect(buildLesson(17, values, true).tasks[0].answer).toBe("够");
    expect(buildRetryLesson(17, values).tasks[0].answer).not.toBe("dynamic");
  });
});
