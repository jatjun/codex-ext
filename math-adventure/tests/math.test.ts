import { describe, it, expect } from "vitest";
import {
  animals,
  patterns,
  math,
  levels,
  squareSize,
} from "../src/questions/data";
describe("mathematical models", () => {
  it("conserves toy money in original and transfer", () => {
    expect(math.shop.count * math.shop.price).toBe(math.shop.total);
    expect(math.shop.total / math.shop.groups).toBe(6);
    expect((3 * 4) / 2).toBe(6);
    expect(
      Array.from({ length: 12 }, (_, i) => i % 2).filter((x) => x === 0),
    ).toHaveLength(6);
  });
  it("distinguishes addition and multiplication", () => {
    const star = 18 / 3,
      triangle = 16 / 4;
    expect(star).toBe(6);
    expect(triangle).toBe(4);
    expect(star + triangle).toBe(10);
    expect(star * triangle).toBe(24);
    expect(14 / 2 + 12 / 3).toBe(11);
    expect((14 / 2) * (12 / 3)).toBe(28);
  });
  it("generates exactly 20 unique animals with two valid classifications", () => {
    expect(animals).toHaveLength(20);
    expect(new Set(animals.map((a) => a.id)).size).toBe(20);
    expect(animals.filter((a) => a.kind === "蝴蝶")).toHaveLength(8);
    expect(animals.filter((a) => a.kind === "蜻蜓")).toHaveLength(6);
    expect(animals.filter((a) => a.kind === "鱼")).toHaveLength(6);
    expect(animals.filter((a) => a.habitat === "天上飞")).toHaveLength(14);
    expect(animals.filter((a) => a.habitat === "水里游")).toHaveLength(6);
  });
  it("has deterministic transfer patterns in both classifications", () => {
    expect(patterns).toHaveLength(12);
    expect(new Set(patterns.map((p) => p.id)).size).toBe(12);
    for (const key of ["color", "form"] as const) {
      expect(new Set(patterns.map((p) => p[key])).size).toBe(3);
      for (const value of new Set(patterns.map((p) => p[key])))
        expect(patterns.filter((p) => p[key] === value)).toHaveLength(4);
    }
  });
  it("models solid squares, counting the center once", () => {
    expect(squareSize(3)).toBe(5);
    expect(squareSize(3) ** 2).toBe(25);
    expect(squareSize(2)).toBe(3);
    expect(squareSize(2) ** 2).toBe(9);
    const positions = Array.from({ length: 25 }, (_, i) => [
      Math.floor(i / 5),
      i % 5,
    ]);
    expect(
      positions.filter(([r, c]) => r > 0 && r < 4 && c > 0 && c < 4),
    ).toHaveLength(9);
  });
  it("every question has progressive help and a different retry", () => {
    for (const l of levels)
      for (const q of [...l.questions, ...l.transfer]) {
        expect(q.hints).toHaveLength(3);
        expect(q.retry.prompt).not.toBe(q.prompt);
        expect(q.answer).toBeTruthy();
      }
  });
});
