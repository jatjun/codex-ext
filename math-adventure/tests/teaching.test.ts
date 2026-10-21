import { describe, it, expect } from "vitest";
import {
  initialTeaching,
  teachingReducer as reduce,
  type Teaching,
} from "../src/teaching/machine";
import { answerEntry, newEntry, report } from "../src/records/store";
describe("teaching state machine", () => {
  const question = (): Teaching =>
    reduce(reduce(initialTeaching, { type: "START" }), { type: "OBSERVED" });
  it("cannot skip a question with Next", () => {
    expect(
      reduce(question(), { type: "NEXT", mainCount: 3, transferCount: 1 }),
    ).toEqual(question());
    expect(reduce(initialTeaching, { type: "CORRECT" })).toEqual(
      initialTeaching,
    );
  });
  it("uses a gentle hint before visual help and full explanation", () => {
    let s = question();
    s = reduce(s, { type: "WRONG" });
    expect(s.state).toBe("HINT_1");
    s = reduce(s, { type: "WRONG" });
    expect(s.state).toBe("HINT_2");
    s = reduce(s, { type: "WRONG" });
    expect(s.state).toBe("EXPLAIN");
    expect(reduce(s, { type: "CORRECT" }).solved).toBe(false);
    s = reduce(s, { type: "RETRY" });
    expect(s.state).toBe("RETRY");
    s = reduce(s, { type: "RETRIED" });
    expect(s.state).toBe("QUESTION");
    expect(s.solved).toBe(false);
  });
  it("requires transfer before completion and resists double Next", () => {
    let s = reduce(question(), { type: "CORRECT" });
    s = reduce(s, { type: "NEXT", mainCount: 1, transferCount: 1 });
    expect(s.state).toBe("TRANSFER");
    expect(s.solved).toBe(false);
    expect(reduce(s, { type: "NEXT", mainCount: 1, transferCount: 1 })).toEqual(
      s,
    );
    s = reduce(s, { type: "CORRECT" });
    s = reduce(s, { type: "NEXT", mainCount: 1, transferCount: 1 });
    expect(s.state).toBe("COMPLETE");
  });
  it("help uses the same progressive ladder without punishment", () => {
    expect(reduce(question(), { type: "HELP" }).state).toBe("HINT_1");
  });
});
describe("immutable first-attempt records", () => {
  it("preserves first wrong answer after explanation and success", () => {
    let r = newEntry("session", "shop", "share", false);
    r = answerEntry(r, "12", false, "混淆总价与单价");
    r = { ...r, hints: 3, watchedExplanation: true };
    r = answerEntry(r, "6", true, "");
    expect(r.firstAnswer).toBe("12");
    expect(r.firstCorrect).toBe(false);
    expect(r.attempts).toBe(2);
    expect(r.correct).toBe(true);
    expect(report([r]).first).toEqual({ correct: 0, total: 1 });
    expect(report([r]).helped).toEqual({ correct: 1, total: 1 });
  });
  it("does not classify a helped answer as independent success", () => {
    let r = newEntry("session", "shop", "transfer", true);
    r = answerEntry(r, "需要帮助", false, "", "help");
    r = answerEntry(r, "6", true, "");
    expect(r.firstAnswer).toBe("需要帮助");
    expect(r.transferResult).toBe(false);
    expect(report([r]).transfer).toEqual({ correct: 0, total: 1 });
  });
  it("retry practice does not overwrite original result or attempts", () => {
    let r = answerEntry(
      newEntry("s", "shapes", "sum", false),
      "12",
      false,
      "加法",
    );
    r = answerEntry(r, "8", true, "", "retry");
    expect(r.firstAnswer).toBe("12");
    expect(r.attempts).toBe(1);
    expect(r.correct).toBe(false);
    expect(r.events).toHaveLength(2);
  });
});
