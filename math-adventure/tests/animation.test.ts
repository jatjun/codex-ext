import { describe, it, expect } from "vitest";
import { Timeline } from "../src/animation/timeline";
describe("animation clock and step barriers", () => {
  it("freezes exactly at pause and resumes without accumulated time", () => {
    const t = new Timeline([1000, 1000]);
    t.tick(400);
    t.paused = true;
    t.tick(20000);
    expect(t.snapshot()).toEqual({ frame: 0, progress: 0.4, complete: false });
    t.paused = false;
    t.tick(100);
    expect(t.snapshot().progress).toBe(0.5);
  });
  it("does not cross the narration barrier automatically", () => {
    const t = new Timeline([100, 100]);
    t.tick(10000);
    expect(t.frame).toBe(0);
    t.advance();
    expect(t.frame).toBe(1);
    t.advance();
    expect(t.frame).toBe(1);
    expect(t.complete).toBe(false);
  });
  it("replay resets instead of adding objects; paused Next does nothing", () => {
    const t = new Timeline([100, 100]);
    t.tick(100);
    t.paused = true;
    t.advance();
    expect(t.frame).toBe(0);
    t.paused = false;
    t.advance();
    t.tick(100);
    t.advance();
    expect(t.complete).toBe(true);
    t.reset();
    expect(t.snapshot()).toEqual({ frame: 0, progress: 0, complete: false });
  });
});
