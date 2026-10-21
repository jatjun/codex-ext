import { describe, it, expect } from "vitest";
import {
  defaultQueue,
  defaults,
  queueCatalog,
  validateSettings,
} from "../src/questions/models";
import {
  solveQueue,
  queueFrames,
  transferQueue,
  validateQueue,
  matchesAnswer,
} from "../src/questions/queue";
import {
  buildLevel,
  buildQueueLevel,
  makeAnimals,
  makePatterns,
} from "../src/questions/builders";
import { makeStoryboards } from "../src/animation/storyboards";
describe("queue mathematics", () => {
  it.each([
    ["total", 12],
    ["reverse", 11],
    ["between", 4],
    ["missing", 14],
    ["rectangle", 80],
    ["same-direction", 7],
    ["change", 6],
    ["swap", 11],
  ] as const)("%s default has the expected answer", (kind, answer) => {
    const c = defaultQueue(kind);
    expect(validateQueue(c)).toEqual([]);
    expect(solveQueue(c)[0].answer).toBe(answer);
    const l = buildQueueLevel(c);
    expect(l.model?.queue?.kind).toBe(kind);
    expect(l.transferModel?.queue).not.toEqual(c);
    expect(queueFrames(c).length).toBeGreaterThan(3);
    expect(l.transfer).toHaveLength(1);
  });
  it("models solid 8x10 rather than a square or a border", () => {
    const c = defaultQueue("rectangle"),
      s = solveQueue(c)[0];
    expect(c.numbers.left + c.numbers.right - 1).toBe(10);
    expect(c.numbers.frontRank + c.numbers.backRank - 1).toBe(8);
    expect(s.total).toBe(80);
    expect(s.ming).toBe(26);
    expect(buildQueueLevel(c).questions.map((q) => q.answer)).toEqual([
      "10",
      "8",
      "80",
    ]);
  });
  it("finds both valid queue lengths instead of silently assuming order", () => {
    const c = defaultQueue("missing");
    c.numbers.front = 8;
    c.numbers.back = 8;
    c.numbers.gap = 3;
    expect(
      solveQueue(c)
        .map((s) => s.total)
        .sort((a, b) => a - b),
    ).toEqual([11, 19]);
    for (const s of solveQueue(c)) {
      expect(Math.abs(s.ming - s.hong!) - 1).toBe(3);
      expect(s.total - s.ming + 1).toBe(8);
    }
    expect(solveQueue({ ...c, order: "red-first" })).toHaveLength(1);
    expect(solveQueue({ ...c, order: "ming-first" })[0].total).toBe(11);
    const q = buildQueueLevel(c).questions[0];
    expect(q.answerKind).toBe("set");
    expect(matchesAnswer(q.answer, "19、11", true)).toBe(true);
    expect(matchesAnswer(q.answer, "19", true)).toBe(false);
  });
  it("rejects impossible reverse ordering, coincident people, fractions and invalid limits", () => {
    const missing = defaultQueue("missing");
    missing.order = "ming-first";
    expect(validateQueue(missing).length).toBeGreaterThan(0);
    const c = defaultQueue("between");
    c.numbers.back = 11;
    expect(validateQueue(c).length).toBeGreaterThan(0);
    c.numbers.back = 3;
    c.numbers.front = 16;
    expect(validateQueue(c).length).toBeGreaterThan(0);
    c.numbers.front = 1.5;
    expect(validateQueue(c).length).toBeGreaterThan(0);
    const changed = defaultQueue("change");
    changed.numbers.leave = changed.numbers.front + changed.numbers.join;
    expect(validateQueue(changed).length).toBeGreaterThan(0);
    const zero = defaultQueue("change");
    zero.numbers.join = 0;
    zero.numbers.leave = 1;
    expect(validateQueue(zero)).toEqual([]);
    expect(queueFrames(zero).find((f) => f.kind === "join")?.text).toContain(
      "没有新朋友",
    );
  });
  it("counts exclusive gaps for either ordering, including adjacent people", () => {
    for (let total = 2; total <= 25; total++)
      for (let front = 1; front <= Math.min(15, total); front++)
        for (let back = 1; back <= Math.min(15, total); back++) {
          const c = defaultQueue("between");
          Object.assign(c.numbers, { total, front, back });
          const hong = total - back + 1;
          if (hong === front) continue;
          expect(validateQueue(c)).toEqual([]);
          const s = solveQueue(c)[0],
            inside = Array.from({ length: total }, (_, i) => i + 1).filter(
              (i) => i > Math.min(front, hong) && i < Math.max(front, hong),
            );
          expect(s.answer).toBe(inside.length);
        }
  });
  it("solves all valid small unknown-length cases with no missing alternatives", () => {
    for (let a = 1; a <= 9; a++)
      for (let b = 1; b <= 9; b++)
        for (let gap = 0; gap <= 5; gap++) {
          const c = defaultQueue("missing");
          Object.assign(c.numbers, { front: a, back: b, gap });
          const brute = [];
          for (let total = 1; total <= 32; total++) {
            const ming = total - b + 1;
            if (
              a <= total &&
              ming >= 1 &&
              ming <= total &&
              ming !== a &&
              Math.abs(a - ming) - 1 === gap
            )
              brute.push(total);
          }
          expect(
            solveQueue(c)
              .map((s) => s.total)
              .sort((x, y) => x - y),
          ).toEqual(brute);
        }
  });
  it("uses new validated transfer numbers in every queue topic", () => {
    for (const entry of queueCatalog) {
      const c = defaultQueue(entry.kind),
        next = transferQueue(c);
      expect(next).not.toEqual(c);
      expect(validateQueue(next)).toEqual([]);
      expect(solveQueue(next).map((s) => s.answer)).not.toEqual(
        solveQueue(c).map((s) => s.answer),
      );
    }
  });
});
describe("previous levels use the same generated model for questions and objects", () => {
  it("updates shopping text, answers, narration and equal groups together", () => {
    const settings = structuredClone(defaults);
    settings.shop = { count: 4, price: 6, groups: 3 };
    const l = buildLevel("shop", settings);
    expect(l.questions.map((q) => q.answer)).toEqual([
      "24",
      "24元是3只玩具的总价",
      "8",
    ]);
    expect(makeStoryboards(l.model!).shop).toHaveLength(6);
    expect(makeStoryboards(l.model!).shop[4].text).toContain("24");
    expect(
      validateSettings("shop", { count: 3, price: 3, groups: 2 }).length,
    ).toBeGreaterThan(0);
  });
  it("updates graph values and both operations", () => {
    const settings = structuredClone(defaults);
    settings.shapes = {
      stars: 3,
      starValue: 7,
      triangles: 4,
      triangleValue: 5,
    };
    expect(
      buildLevel("shapes", settings).questions.map((q) => q.answer),
    ).toEqual(["7", "5", "12", "35"]);
    expect(
      validateSettings("shapes", {
        stars: 5,
        starValue: 8,
        triangles: 4,
        triangleValue: 4,
      }).length,
    ).toBeGreaterThan(0);
  });
  it("conserves arbitrary animal and pattern counts deterministically", () => {
    const s = { butterflies: 5, dragonflies: 4, fish: 3, patternCount: 9 };
    expect(makeAnimals(s)).toHaveLength(12);
    expect(new Set(makeAnimals(s).map((a) => a.id)).size).toBe(12);
    for (const count of [6, 9, 12, 15, 18]) {
      const p = makePatterns(count);
      expect(p).toHaveLength(count);
      for (const key of ["color", "form"] as const)
        for (const v of new Set(p.map((p) => p[key])))
          expect(p.filter((p) => p[key] === v)).toHaveLength(count / 3);
    }
  });
  it("updates solid square side, area, direction steps and transfer without mutating defaults", () => {
    const settings = structuredClone(defaults);
    settings.square.rank = 4;
    const l = buildLevel("square", settings);
    expect(l.questions.map((q) => q.answer)).toEqual(["7", "49"]);
    expect(makeStoryboards(l.model!).square).toHaveLength(7 + 4 * 4 + 7 + 1);
    expect(l.transfer[0].answer).toBe("25");
    expect(defaults.square.rank).toBe(3);
  });
});
