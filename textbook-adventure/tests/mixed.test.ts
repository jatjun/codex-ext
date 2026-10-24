import { it, expect } from "vitest";
import { lessons, model, validate } from "../src/mixed/model";
it("all six original results match screenshots", () => {
  expect(lessons.map((l) => model(l.id, l.seed).total)).toEqual([
    29, 22, 5, 67, 10, 2,
  ]);
});
it("all independent variants retain integer valid conditions", () => {
  for (const l of lessons)
    for (const n of [l.seed, l.practice, l.transfer]) {
      expect(validate(l.id, n)).toBe("");
      expect(Number.isInteger(model(l.id, n).total)).toBe(true);
    }
});
it("rejects impossible removal and noninteger grouping", () => {
  expect(validate("paper", { a: 10, b: 8, c: 5 })).not.toBe("");
  expect(validate("peaches", { a: 25, b: 14, c: 8 })).not.toBe("");
  expect(validate("beads", { a: 72, b: 55, c: 8 })).not.toBe("");
});
import { parse, calculate, trace, exercises } from "../src/mixed/arithmetic";
import { problems } from "../src/mixed/problems";
import { diagnose } from "../src/mixed/teacher";
it("parses precedence, parentheses and same-level left-to-right without eval", () => {
  for (const [e, n] of [
    ["15÷5×7", 21],
    ["18÷3×3", 18],
    ["18÷(3×3)", 2],
    ["25+15÷8", 26.875],
    ["(25+15)÷8", 5],
    ["4×9-5×3", 21],
  ] as const)
    expect(calculate(parse(e))).toBe(n);
  expect(trace(parse("4×9-5×3")).map((x) => x.result)).toEqual([36, 15, 21]);
});
it("rejects executable and malformed input", () => {
  for (const e of ["alert(1)", "2**4", "(2+3", "4/0", "2+"])
    expect(() => calculate(parse(e))).toThrow();
});
it("all source exercises are finite, integer, nonnegative", () => {
  for (const q of [...exercises, ...problems]) {
    expect(calculate(parse(q.expression)), q.expression).toBeGreaterThanOrEqual(
      0,
    );
    expect(Number.isInteger(calculate(parse(q.expression))), q.expression).toBe(
      true,
    );
  }
});
it("recognizes meaning errors separately from arithmetic errors", () => {
  expect(diagnose("beads", { a: 72, b: 56, c: 8 }, 16, true).code).toBe(
    "intermediate",
  );
  expect(diagnose("flowers", { a: 8, b: 3, c: 2 }, 16, true).code).toBe(
    "wrong_reference",
  );
  expect(diagnose("yogurt", { a: 6, b: 3, c: 4 }, 30, true).code).toBe(
    "extra_repeated",
  );
});
import { bestTickets } from "../src/mixed/Explore";
import { easier } from "../src/mixed/model";
it("ticket comparison includes mixed group and individual purchases", () => {
  expect(bestTickets(4, 5)).toBe(63);
  expect(bestTickets(0, 5)).toBe(25);
  expect(bestTickets(6, 0)).toBe(48);
});
it("remedial numbers are smaller valid models, not changed answers to the same question", () => {
  for (const l of lessons) {
    expect(validate(l.id, easier[l.id])).toBe("");
    expect(model(l.id, easier[l.id]).total).toBeGreaterThanOrEqual(0);
  }
});
