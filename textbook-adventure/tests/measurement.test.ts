import { describe, it, expect } from "vitest";
import {
  lessons,
  validate,
  target,
  steps,
  routes,
} from "../src/measurement/model";
import { questions } from "../src/measurement/practice";
import {
  initial,
  transition,
  updateRow,
  type Row,
} from "../src/measurement/teaching";
describe("measurement mathematics", () => {
  it("checks the nine independent source results", () => {
    expect(lessons.map((l) => target(l.id, l.seed))).toEqual([
      50, 3, 10, 145, 1000, 1, 1820, 50, 1000,
    ]);
  });
  it("validates every source, remedial and independent variant", () => {
    for (const l of lessons)
      for (const n of [l.seed, l.easy, l.practice, l.transfer]) {
        expect(validate(l.id, n), l.id + JSON.stringify(n)).toBe("");
        for (const s of steps(l.id, n)) {
          expect(Number.isFinite(s.answer)).toBe(true);
          expect(s.answer).toBeGreaterThanOrEqual(0);
        }
      }
  });
  it("rejects invalid rulers, partial groups and unsupported readings", () => {
    expect(validate("ruler", { a: 30, b: 80, c: 0 })).not.toBe("");
    expect(validate("fold", { a: 23, b: 3, c: 0 })).not.toBe("");
    expect(validate("overlap", { a: 20, b: 40, c: 20 })).not.toBe("");
    expect(validate("boat", { a: 1000, b: 300, c: 0 })).not.toBe("");
    expect(validate("scale", { a: 200, b: 201, c: 0 })).not.toBe("");
    expect(validate("units", { a: NaN, b: 0, c: 0 })).not.toBe("");
  });
  it("counts all simple route options, including an indirect route when changed", () => {
    expect(routes({ a: 500, b: 600, c: 920 })).toEqual([
      2000, 2000, 1820, 2820,
    ]);
    // Cross-check shortest path with an independent Dijkstra calculation over edited examples.
    for (const a of [100, 500, 1000])
      for (const b of [100, 600, 1000])
        for (const c of [100, 920, 1000]) {
          const edges = [
              [0, 1, a],
              [1, 2, 600],
              [2, 5, 900],
              [0, 3, b],
              [3, 2, 500],
              [3, 4, c],
              [4, 5, 300],
            ],
            dist = [0, Infinity, Infinity, Infinity, Infinity, Infinity];
          for (let r = 0; r < 6; r++)
            for (const [u, v, w] of edges) {
              dist[v] = Math.min(dist[v], dist[u] + w);
              dist[u] = Math.min(dist[u], dist[v] + w);
            }
          expect(Math.min(...routes({ a, b, c }))).toBe(dist[5]);
        }
  });
  it("distinguishes pool round trips from running laps", () => {
    expect(target("track", { a: 50, b: 10, c: 1 })).toBe(1000);
    expect(target("track", { a: 400, b: 5, c: 0 })).toBe(2000);
  });
  it("converts thousand units without pretending they are ten", () => {
    expect(steps("units", { a: 3, b: 3, c: 0 })[1].answer).toBe(3000);
    expect(steps("units", { a: 2, b: 5, c: 0 })[1].answer).toBe(2000);
  });
  it("keeps unique bank IDs and exact source answers", () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const q of questions) {
      expect(Number.isFinite(q.answer)).toBe(true);
      if (q.choices) expect(q.choices[q.answer]).toBeTruthy();
    }
    for (const [id, answer] of [
      ["rings", 100],
      ["draw58", 58],
      ["draw65", 65],
      ["swim", 10],
      ["halfjin", 8],
      ["modern-half", 5],
      ["boards", 145],
      ["coach", 320],
    ] as const)
      expect(questions.find((q) => q.id === id)!.answer).toBe(answer);
  });
});
describe("teaching barriers and original records", () => {
  it("requires observation before answering and increases support without auto completion", () => {
    let s = transition(initial, { type: "start" });
    expect(transition(s, { type: "answer", correct: true }).correct).toBe(
      false,
    );
    s = transition(s, { type: "observed" });
    s = transition(s, { type: "answer", correct: false });
    expect(s.stage).toBe("HINT_1");
    s = transition(s, { type: "answer", correct: false });
    expect(s.stage).toBe("HINT_2");
    s = transition(s, { type: "answer", correct: false });
    expect(s.stage).toBe("EXPLAIN");
    expect(s.correct).toBe(false);
    s = transition(s, { type: "retry" });
    s = transition(s, { type: "answer", correct: true });
    expect(s.assisted).toBe(true);
    expect(s.explained).toBe(true);
    expect(transition(s, { type: "transfer" }).correct).toBe(false);
  });
  it("never replaces a first wrong answer with the later correct answer", () => {
    const row: Row = {
      id: "x",
      lesson: "ruler",
      questionId: "r1",
      question: "长度",
      phase: "practice",
      started: "today",
      firstAnswer: null,
      firstCorrect: null,
      attempts: [],
      hints: 0,
      replays: 0,
      explained: false,
      assisted: false,
      complete: false,
      activeSeconds: 2,
      errorType: "",
    };
    let rows = updateRow([], row, { answer: "60", correct: false, time: "1" });
    rows = updateRow(
      rows,
      { ...row, hints: 1, assisted: true, complete: true },
      { answer: "50", correct: true, time: "2" },
    );
    expect(rows[0].firstAnswer).toBe("60");
    expect(rows[0].firstCorrect).toBe(false);
    expect(rows[0].attempts).toHaveLength(2);
    expect(rows[0].complete).toBe(true);
    rows = updateRow(rows, { ...rows[0], replays: 2 });
    expect(rows[0].firstAnswer).toBe("60");
    rows = updateRow(
      rows,
      { ...row, hints: 0, assisted: false, replays: 0 },
      { answer: "50", correct: true, time: "3" },
    );
    expect(rows[0].assisted).toBe(true);
    expect(rows[0].hints).toBe(1);
    expect(rows[0].replays).toBe(2);
  });
});
