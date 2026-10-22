import { describe, it, expect } from "vitest";
import {
  original,
  transfer,
  faces,
  opposite,
  validLabels,
  camera,
  check,
  unfoldFaces,
} from "../src/math-engine/space";
import { feedback, canAdvance, stageAfterAnswer } from "../src/teacher/logic";
import { result, type Row } from "../src/progress/store";
describe("six face invariant", () => {
  it("validates original and new labels, opposite pairs always sum to 7", () => {
    for (const labels of [original, transfer]) {
      expect(validLabels(labels)).toBe(true);
      for (const f of faces) {
        expect(opposite[opposite[f]]).toBe(f);
        expect(labels[f] + labels[opposite[f]]).toBe(7);
      }
    }
  });
  it("rejects duplicates or altered opposite conditions", () => {
    expect(validLabels({ ...original, 后: 1 })).toBe(false);
    expect(validLabels({ ...original, 前: 3, 右: 1 })).toBe(false);
  });
  it("uses distinct camera orientations for each face", () => {
    expect(new Set(Object.values(camera).map((x) => x.join())).size).toBe(6);
    expect(camera.前).toEqual([0, 0]);
    expect(camera.上).toEqual([-90, 0]);
  });
  it("each exercise checks a model answer, not DOM object counting", () => {
    for (const kind of ["view", "net"] as const)
      for (const phase of ["guided", "practice", "transfer"] as const) {
        const l = phase === "transfer" ? transfer : original;
        const outcomes = [1, 2, 3, 4, 5, 6].map((n) =>
          check(kind, phase, String(n), l),
        );
        expect(outcomes.filter((x) => x.correct)).toHaveLength(1);
        expect(outcomes[0].expected).toBe(l[outcomes[0].target]);
      }
  });
  it("keeps six panels throughout unfolding, clamps bounds", () => {
    for (const p of [-1, 0, 0.25, 0.5, 1, 2]) {
      const f = unfoldFaces(p);
      expect(Object.keys(f)).toHaveLength(6);
      expect(Object.values(f).every((a) => Math.abs(a) <= 90)).toBe(true);
    }
    expect(unfoldFaces(0).top).toBe(90);
    expect(unfoldFaces(1).top).toBe(0);
  });
  it("original and changed conditions have different correct answers", () => {
    expect(check("net", "guided", "6", original).correct).toBe(true);
    expect(check("view", "transfer", "6", transfer).correct).toBe(true);
    expect(check("net", "practice", "2", original).correct).toBe(true);
  });
});
describe("controlled teacher", () => {
  it("does not reveal target numbers in first hint", () => {
    for (const k of ["view", "net"] as const) {
      const t = feedback(k, 1, "2");
      expect(t).not.toMatch(/是[1-6]|答案|正确答案/);
    }
  });
  it("provides different second and complete explanations", () => {
    for (const k of ["view", "net"] as const) {
      expect(feedback(k, 1, "2")).not.toBe(feedback(k, 2, "2"));
      expect(feedback(k, 2, "2")).not.toBe(feedback(k, 3, "2"));
    }
  });
  it("does not classify final correctness alone as mastery", () => {
    const r = {
      finalCorrect: true,
      independent: false,
      explanation: true,
    } as Row;
    expect(result(r)).toBe("讲解后正确");
    expect(result({ ...r, finalCorrect: false })).toBe("尚未完成");
    expect(result({ ...r, explanation: false })).toBe("提示后正确");
  });
});

it("teaching gate blocks skipping the key question, then unlocks later observation", () => {
  expect(canAdvance(1, false)).toBe(true);
  expect(canAdvance(2, false)).toBe(false);
  expect(canAdvance(2, true)).toBe(true);
  expect(canAdvance(4, true)).toBe(false);
  expect([1, 2, 3].map(stageAfterAnswer)).toEqual([
    "HINT_1",
    "HINT_2",
    "EXPLAIN",
  ]);
});
it("first hint distinguishes adjacent-face and direction confusion", () => {
  expect(feedback("net", 1, "3")).toContain("相邻面");
  expect(feedback("view", 1, "5")).toContain("上面和前面");
  expect(feedback("net", 1, "3")).not.toEqual(feedback("net", 1, "2"));
});
