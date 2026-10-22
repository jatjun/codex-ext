import { describe, it, expect } from "vitest";
import {
  books,
  catalog,
  defaults,
  validate,
  build,
  variant,
  operatorSolutions,
  timeText,
} from "../src/workbooks/model";
import {
  allAddresses,
  fields,
  valuesFor,
  validate as oldValidate,
  build as oldBuild,
  variant as oldVariant,
} from "../src/notebooks/model";
describe("eight scanned workbooks", () => {
  it("preserves all 177 source addresses exactly once", () => {
    expect(catalog).toHaveLength(177);
    expect(new Set(catalog.map((d) => d.id)).size).toBe(177);
    books.forEach((b, i) =>
      expect(catalog.filter((d) => d.book === i + 1).map((d) => d.n)).toEqual(
        Array.from({ length: b.count }, (_, i) => i + 1),
      ),
    );
  });
  for (const d of catalog.filter((d) => !d.pending))
    it(`${d.id}: valid data, independent transfer, retry and editable model`, () => {
      const v = defaults(d);
      expect(validate(d, v), d.id).toEqual([]);
      const base = build(d, v),
        transfer = variant(d, v),
        retry = variant(d, v, [transfer]);
      expect(base.tasks.length).toBeGreaterThan(0);
      expect(JSON.stringify([transfer.scene, transfer.tasks])).not.toBe(
        JSON.stringify([base.scene, base.tasks]),
      );
      expect(JSON.stringify([retry.scene, retry.tasks])).not.toBe(
        JSON.stringify([transfer.scene, transfer.tasks]),
      );
      for (const l of [base, transfer, retry]) {
        expect(l.scene.type).toBe("workbook");
        if (l.scene.type !== "workbook") throw Error();
        expect(l.scene.panels.length).toBeGreaterThan(0);
        for (const t of l.tasks) {
          expect(l.scene.panels[Number(t.focus)]).toBeTruthy();
          expect(t.answer).not.toMatch(/NaN|Infinity|undefined/);
          expect(t.prompt).not.toMatch(/undefined/);
          if (t.options) expect(t.options).toContain(t.answer);
        }
        for (const p of l.scene.panels) {
          if (p.kind === "divide") {
            expect(p.total % p.size).toBeLessThan(p.size);
            expect(p.total).toBeGreaterThan(0);
          }
          if (p.kind === "objects")
            p.rows.forEach((r) => expect(Number.isInteger(r.count)).toBe(true));
        }
      }
      for (const f of d.fields) {
        let changed = false;
        for (let x = f.min; x <= f.max; x++) {
          const next = { ...v, [f.key]: x };
          if (x === v[f.key] || validate(d, next).length) continue;
          if (JSON.stringify(build(d, next)) !== JSON.stringify(base)) {
            changed = true;
            break;
          }
        }
        if (!changed) {
          for (const other of d.fields.filter((o) => o.key !== f.key)) {
            for (let x = f.min; x <= f.max && !changed; x++) {
              if (x === v[f.key]) continue;
              for (let y = other.min; y <= other.max && !changed; y++) {
                const next = { ...v, [f.key]: x, [other.key]: y };
                if (
                  !validate(d, next).length &&
                  JSON.stringify(build(d, next)) !== JSON.stringify(base)
                )
                  changed = true;
              }
            }
          }
        }
        expect(
          changed,
          `${d.id} field ${f.key} must affect the lesson, allowing linked conditions`,
        ).toBe(true);
      }
    });
  it("does not invent a task for an image with missing instructions", () => {
    expect(catalog.filter((d) => d.pending).map((d) => [d.book, d.n])).toEqual([
      [7, 14],
    ]);
  });
  it("corrects remainder boundaries, equal-money price and shared corner count", () => {
    const answers = (b: number, n: number) => {
      const d = catalog.find((d) => d.book === b && d.n === n)!;
      return build(d, defaults(d)).tasks.map((t) => t.answer);
    };
    expect(answers(5, 2)).toEqual(["7", "27"]);
    expect(answers(6, 1)).toEqual(["5", "47"]);
    expect(answers(3, 3)).toEqual(["8"]);
    expect(answers(3, 21)).toEqual(["18"]);
    expect(answers(7, 8)).toEqual(["12"]);
    expect(answers(8, 2)).toEqual(["48"]);
    expect(answers(6, 17)).toEqual(["15", "15"]);
  });
  it("uses actual clock faces rather than contradictory answer text", () => {
    const d = catalog.find((d) => d.book === 2 && d.n === 5)!;
    expect(build(d, defaults(d)).tasks.map((t) => t.answer)).toEqual([
      "1:50",
      "3:40",
      "2:05",
      "5:35",
    ]);
    expect(timeText(720)).toBe("12:00");
    expect(timeText(450)).toBe("7:30");
    expect(operatorSolutions([12, 4, 9, 3, 6, 6])).toContain("÷+×-");
  });
});
describe("previous 50 questions: condition audit", () => {
  for (const a of allAddresses)
    it(`${a.id} has working settings and new practice`, () => {
      const v = valuesFor(a.book, a.number),
        base = oldBuild(a.book, a.number, v);
      expect(oldValidate(a.book, a.number, v)).toEqual([]);
      expect(fields(a.book, a.number).length).toBeGreaterThan(0);
      const t = oldVariant(a.book, a.number, v);
      expect(JSON.stringify([base.scene, base.tasks])).not.toBe(
        JSON.stringify([t.scene, t.tasks]),
      );
      for (const f of fields(a.book, a.number)) {
        let changed = false;
        for (let x = f.min; x <= f.max; x += f.step ?? 1) {
          if (x === v[f.key]) continue;
          const next = { ...v, [f.key]: x };
          if (oldValidate(a.book, a.number, next).length) continue;
          const l = oldBuild(a.book, a.number, next);
          if (
            JSON.stringify([base.scene, base.tasks]) !==
            JSON.stringify([l.scene, l.tasks])
          ) {
            changed = true;
            break;
          }
        }
        if (!changed && a.book === "b" && a.number === 6 && f.key === "n") {
          const next = { ...v, a: 30, b: 18, n: 6 };
          expect(oldValidate(a.book, a.number, next)).toEqual([]);
          changed =
            JSON.stringify(oldBuild(a.book, a.number, next)) !==
            JSON.stringify(base);
        }
        expect(changed, `${a.id} setting ${f.key}`).toBe(true);
      }
    });
});

describe("independent source-answer checks", () => {
  const answers = (b: number, n: number) => {
    const d = catalog.find((d) => d.book === b && d.n === n)!;
    return build(d, defaults(d)).tasks.map((t) => t.answer);
  };
  it("known numerical relationships remain correct", () => {
    expect(answers(1, 6)).toEqual(["7"]);
    expect(answers(1, 7)).toEqual(["5", "5", "2"]);
    expect(answers(1, 9)).toEqual(["6"]);
    expect(answers(1, 16)).toEqual(["6"]);
    expect(answers(1, 17)).toEqual(["8"]);
    expect(answers(1, 19)).toEqual(["22"]);
    expect(answers(3, 9)).toEqual(["9"]);
    expect(answers(3, 10)).toEqual(["1", "57", "4", "19"]);
    expect(answers(3, 11)).toEqual(["8", "47"]);
    expect(answers(3, 18)).toEqual(["2", "2"]);
    expect(answers(3, 19)).toEqual(["2", "2"]);
    expect(answers(4, 16)).toEqual(["27"]);
    expect(answers(6, 15)).toEqual(["3", "1", "4", "1"]);
    expect(answers(7, 12)).toEqual(["11", "19"]);
    expect(answers(7, 20)).toEqual(["18"]);
    expect(answers(8, 25)).toEqual(["5", "15", "5", "10"]);
  });
});

describe("explanation mathematics", () => {
  it("does not use zero as a placeholder answer in conceptual explanations", () => {
    const span = catalog.find((d) => d.book === 1 && d.n === 3)!,
      equation = catalog.find((d) => d.book === 7 && d.n === 23)!;
    expect(build(span, defaults(span)).tasks.map((t) => t.answer)).toEqual([
      "每一拃长度不同",
    ]);
    const l = build(equation, defaults(equation));
    if (l.scene.type !== "workbook") throw Error();
    const p = l.scene.panels[0];
    if (p.kind !== "cards") throw Error();
    expect(p.result).toBe(12);
    expect(p.operation).toBe("12÷4＋9＝3×6－6");
  });
});
