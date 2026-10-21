import { describe, it, expect } from "vitest";
import {
  allAddresses,
  build,
  fields,
  valuesFor,
  validate,
  variant,
} from "../src/notebooks/model";
import {
  project3,
  foldNet,
  netAnalysis,
  cubeNets,
  cuboidNets,
  symmetryAxes,
  canTranslate,
  voxelView,
  type Face,
} from "../src/notebooks/geometry";
import { evaluate, op, toGrams } from "../src/notebooks/types";
import { checkTask } from "../src/pdf/model";
describe("two notebook models", () => {
  it("preserves all 50 source addresses and generates valid independent and retry models", () => {
    expect(allAddresses).toHaveLength(50);
    expect(new Set(allAddresses.map((a) => a.id)).size).toBe(50);
    for (const a of allAddresses) {
      const v = valuesFor(a.book, a.number);
      expect(validate(a.book, a.number, v), a.id).toEqual([]);
      const l = build(a.book, a.number, v),
        t = variant(a.book, a.number, v),
        r = variant(a.book, a.number, v, [t]);
      expect(l.tasks.length).toBeGreaterThan(0);
      expect(new Set(l.tasks.map((t) => t.id)).size).toBe(l.tasks.length);
      expect(JSON.stringify(t.scene)).not.toBe(JSON.stringify(l.scene));
      expect(JSON.stringify(r.scene)).not.toBe(JSON.stringify(t.scene));
      expect(JSON.stringify(l)).not.toContain("NaN");
    }
  });
  it("matches all mass conversion source answers", () => {
    const answers = (n: number) => build("a", n).tasks.map((t) => t.answer);
    expect(answers(2)).toEqual(["2000", "1200"]);
    expect(answers(3)).toEqual(["750", "150"]);
    expect(answers(4)[0]).toMatch(/^C/);
    expect(answers(5)[0]).toMatch(/^C/);
    expect(answers(6)).toEqual(["5000", "500", "8", "3"]);
    expect(answers(7)).toEqual(["6060"]);
    expect(answers(8)).toEqual(["7000", "4"]);
    expect(answers(9)).toEqual(["20"]);
    expect(answers(10)).toEqual(["2500", "7", "80"]);
    expect(answers(12)).toEqual(["一样重"]);
    expect(answers(14)).toEqual(["30名学生"]);
    expect(answers(15)).toEqual(["千克", "克", "吨", "千克"]);
  });
  it("uses actual repeated counts and the two correct methods", () => {
    for (const [n, answer] of [
      [17, 15],
      [18, 30],
      [19, 8],
      [20, 40],
      [21, 1],
      [22, 9],
    ]) {
      const l = build("a", n);
      expect(l.tasks.at(-1)!.answer).toBe(String(answer));
      if (l.scene.type === "extension" && l.scene.spec.kind === "groups")
        expect(
          l.scene.spec.batches.reduce((sum, b) => sum + b.per * b.copies, 0),
        ).toBe(
          n === 17
            ? 55
            : n === 18
              ? 30
              : n === 19
                ? 48
                : n === 20
                  ? 40
                  : n === 21
                    ? 54
                    : 36,
        );
    }
  });
  it("shares duplicate models without changing either original address", () => {
    for (let n = 1; n <= 3; n++)
      expect(build("a", n + 22).scene).toEqual(build("b", n).scene);
    expect(build("a", 16).tasks.map((t) => t.answer)).toEqual([
      "8",
      "11",
      "2",
      "3",
      "2",
      "长方体4",
    ]);
  });
  it("distinguishes all tickets, equal price differences, closure and remaining distance", () => {
    expect(build("b", 1).tasks.at(-1)!.answer).toBe("39");
    expect(build("b", 2).tasks.at(-1)!.answer).toBe("24");
    expect(build("b", 3).tasks.map((t) => t.answer)).toContain("5");
    expect(build("b", 3).tasks.at(-1)!.answer).toBe("35");
    expect(build("b", 4).tasks.at(-1)!.answer).toBe("20");
    expect(
      build("b", 5)
        .tasks.slice(1)
        .map((t) => t.answer),
    ).toEqual(["88", "12"]);
    expect(build("b", 6).tasks.at(-1)!.answer).toBe("8");
    expect(build("b", 7).tasks.map((t) => t.answer)).toEqual(["17", "35"]);
  });
  it("computes arithmetic trees without eval and respects same-level order and brackets", () => {
    expect(evaluate(op("+", op("÷", 72, 9), op("×", 7, 7)))).toBe(57);
    expect(build("b", 8).tasks.at(-1)!.answer).toBe("57");
    expect(build("b", 9).tasks.map((t) => t.answer)).toEqual(["<", ">", "<"]);
    expect(build("b", 10).tasks.at(-1)!.answer).toBe("2");
    expect(build("b", 11).tasks[0].answer).toMatch(/^B/);
    expect(build("b", 12).tasks.map((t) => t.answer)).toEqual(["加法", "41"]);
    expect(build("b", 13).tasks.at(-1)!.answer).toBe("3");
  });
  it("matches both solid reconstructions and actual structured counts", () => {
    expect(build("b", 14).tasks.map((t) => t.answer)).toEqual([
      "2",
      "5",
      "3",
      "4",
    ]);
    expect(build("b", 15).tasks.map((t) => t.answer)).toEqual([
      "4",
      "2",
      "1",
      "4",
    ]);
  });
  it("computes source fold, perspective, symmetry and orientation selections", () => {
    expect(build("b", 16).tasks[0].pick).toEqual(["option-0"]);
    expect(build("b", 17).tasks[0].pick).toEqual(["option-0", "option-1"]);
    expect(build("b", 18).tasks[0].pick).toEqual(["option-3"]);
    expect(build("b", 19).tasks.map((t) => t.answer)).toEqual(["上", "4"]);
    expect(build("b", 20).tasks.map((t) => t.answer)).toEqual([
      "旋转",
      "平移",
      "平移",
      "旋转",
    ]);
    expect(build("b", 21).tasks.map((t) => t.answer)).toEqual([
      "是",
      "不是",
      "是",
      "不是",
    ]);
    expect(build("b", 22).tasks[0].answer).toBe("是");
    expect(build("b", 23).tasks[0].pick).toEqual([
      "option-0",
      "option-2",
      "option-3",
      "option-6",
    ]);
    expect(build("b", 24).tasks[0].pick).toEqual([
      "option-0",
      "option-2",
      "option-3",
    ]);
    expect(build("b", 25).tasks[0].pick).toEqual(["option-2"]);
  });
  it("rejects impossible, non-integer and ambiguous configurations", () => {
    for (const [b, n, v] of [
      ["a", 3, { bottle: 250, cups: 7, total: 1 }],
      ["a", 9, { tons: 1, bag: 60 }],
      ["a", 21, { grades: 6, a: 31, b: 24 }],
      ["b", 5, { distance: 50, a: 6, b: 5, seconds: 8 }],
      ["b", 7, { before: 10, off: 15, on: 2 }],
      ["b", 10, { quotient: 5, divisor: 7, times: 3, last: 9 }],
    ] as const)
      expect(validate(b, n, v)).not.toEqual([]);
    expect(validate("a", 2, { tons: 1.5, left: 200 })).not.toEqual([]);
  });
  it("updated numbers change the model, answers and source-independent record data", () => {
    const l = build("a", 3, { bottle: 200, cups: 5, total: 1 });
    expect(l.tasks.at(-1)!.answer).toBe("160");
    expect(
      build("b", 3, { price: 12, discount: 2, friends: 3 }).tasks.at(-1)!
        .answer,
    ).toBe("40");
    expect(
      build("b", 16, { edge: 3, scheme: 1, yaw: 20 }).tasks[0].pick,
    ).toEqual(["option-2"]);
    expect(build("b", 22, { dx: 120, dy: 20, angle: 60 }).tasks[0].answer).toBe(
      "不是",
    );
  });
  it("accepts all mathematically identical visible perspectives after edits", () => {
    const l = build("b", 19, { length: 3, height: 1, view: 2, yaw: 30 }),
      q = l.tasks[0];
    expect(q.accepted!.length).toBeGreaterThan(1);
    for (const answer of q.accepted!)
      expect(checkTask(l, q, answer, [], [])).toBe(true);
  });
  it("keeps integer arithmetic results and valid retries at valid edited boundaries", () => {
    for (const a of allAddresses)
      for (const field of fields(a.book, a.number))
        for (const value of [field.min, field.max]) {
          const v = { ...valuesFor(a.book, a.number), [field.key]: value };
          if (validate(a.book, a.number, v).length) continue;
          const t = variant(a.book, a.number, v);
          expect(JSON.stringify(t)).not.toContain("NaN");
        }
  });
});
describe("geometric correctness", () => {
  it("folds source nets from coordinates, not stored A/B/C answers", () => {
    expect(cubeNets(16).map((n) => netAnalysis(n).valid)).toEqual([
      false,
      true,
      true,
    ]);
    expect(cubeNets(17).map((n) => netAnalysis(n).valid)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    for (let l = 1; l <= 5; l++)
      for (let s = 1; s <= l; s++)
        expect(cuboidNets(l, s).map((n) => netAnalysis(n).valid)).toEqual([
          true,
          true,
          true,
          false,
        ]);
  });
  it("starts exactly flat and rotates actual face bases at intermediate angles", () => {
    const n = cubeNets(16)[1],
      flat = foldNet(n, 0),
      partial = foldNet(n, Math.PI / 4),
      full = foldNet(n, Math.PI / 2);
    for (let i = 0; i < n.length; i++)
      expect(flat[i].center).toEqual([
        n[i].x + n[i].w / 2,
        n[i].y + n[i].h / 2,
        0,
      ]);
    expect(
      partial.some((f) => Math.abs(f.n[2]) < 0.99 && Math.abs(f.n[2]) > 0.01),
    ).toBe(true);
    expect(
      new Set(full.map((f) => f.n.map((n) => Math.round(n)).join(","))).size,
    ).toBe(6);
  });
  it("finds exactly eleven cube nets among all 35 free hexominoes", () => {
    const key = (cells: number[][]) => {
      const keys: string[] = [];
      for (let mirror = 0; mirror < 2; mirror++)
        for (let turn = 0; turn < 4; turn++) {
          let pts = cells.map(([x, y]) => [mirror ? -x : x, y]);
          for (let i = 0; i < turn; i++) pts = pts.map(([x, y]) => [-y, x]);
          const x0 = Math.min(...pts.map((p) => p[0])),
            y0 = Math.min(...pts.map((p) => p[1]));
          keys.push(
            pts
              .map(([x, y]) => [x - x0, y - y0])
              .sort((a, b) => a[0] - b[0] || a[1] - b[1])
              .map((p) => p.join(","))
              .join(";"),
          );
        }
      return keys.sort()[0];
    };
    let polys = new Map<string, number[][]>([["0,0", [[0, 0]]]]);
    for (let size = 2; size <= 6; size++) {
      const next = new Map<string, number[][]>();
      for (const cells of polys.values())
        for (const [x, y] of cells)
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ])
            if (!cells.some((p) => p[0] === x + dx && p[1] === y + dy)) {
              const candidate = [...cells, [x + dx, y + dy]];
              next.set(key(candidate), candidate);
            }
      polys = next;
    }
    expect(polys.size).toBe(35);
    const valid = [...polys.values()].filter(
      (cells) =>
        netAnalysis(
          cells.map(([x, y], i) => ({ id: String(i), x, y, w: 1, h: 1 })),
        ).valid,
    );
    expect(valid).toHaveLength(11);
  });
  it("distinguishes reflection from rotational symmetry and translation from a flipped rose", () => {
    expect(symmetryAxes("star")).toContain(90);
    expect(symmetryAxes("rings")).toEqual([90]);
    expect(symmetryAxes("windmill")).toEqual([]);
    expect(symmetryAxes("aperture")).toEqual([]);
    expect(symmetryAxes("scale")).toContain(90);
    expect(
      canTranslate(
        { angle: 0, size: 100, mirror: false },
        { angle: 360, size: 100, mirror: false },
      ),
    ).toBe(true);
    expect(
      canTranslate(
        { angle: 0, size: 100, mirror: true },
        { angle: 0, size: 100, mirror: false },
      ),
    ).toBe(false);
  });
  it("counts projections without double-counting hidden cubes", () => {
    const voxels: Array<[number, number, number]> = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [2, 1, 0],
      [0, 0, 1],
    ];
    expect(voxelView(voxels, "上")).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ]);
    expect(voxelView(voxels, "前")).toHaveLength(4);
    expect(toGrams(1, "t")).toBe(1000000);
    expect(toGrams(1000, "kg")).toBe(1000000);
  });
  it("top and front cameras have correct orthographic projection axes", () => {
    const a = project3([1, 2, 0], 0, 90),
      b = project3([1, 2, 5], 0, 90);
    expect(a[0]).toBeCloseTo(b[0]);
    expect(a[1]).toBeCloseTo(b[1]);
    const c = project3([1, 0, 3], 0, 0),
      d = project3([1, 5, 3], 0, 0);
    expect(c[0]).toBeCloseTo(d[0]);
    expect(c[1]).toBeCloseTo(d[1]);
  });
  it("edited choices vary position while preserving the mathematical answer", () => {
    const a = build("a", 7),
      b = build("a", 7, { tons: 7, kg: 60 });
    expect(a.tasks[0].options![0]).toBe("6060");
    expect(b.tasks[0].options!.indexOf("7060")).not.toBe(0);
    const working = build("b", 11, { scheme: 1, factor: 4 });
    expect(working.tasks[0].answer).not.toMatch(/^B/);
    expect(working.tasks[0].explanation[0]).toBe(working.tasks[0].answer[0]);
    expect(
      checkTask(working, working.tasks[0], working.tasks[0].answer, [], []),
    ).toBe(true);
  });
  it("translation transfer uses a clearly visible turn rather than a one-degree visual trap", () => {
    const values = valuesFor("b", 22),
      lesson = variant("b", 22, values);
    expect(validate("b", 22, { ...values, angle: 1 })).not.toEqual([]);
    expect(validate("b", 22, { ...values, angle: 45 })).toEqual([]);
    if (
      lesson.scene.type !== "extension" ||
      lesson.scene.spec.kind !== "motion"
    )
      throw Error("motion");
    expect(lesson.scene.spec.objects[0].rotation).toBeGreaterThanOrEqual(15);
    expect(lesson.tasks[0].answer).toBe("不是");
  });
});
