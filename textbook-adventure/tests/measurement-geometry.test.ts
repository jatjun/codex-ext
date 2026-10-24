import { it, expect } from "vitest";
import { foldPoints } from "../src/measurement/geometry";
it("all moving rope segments retain length throughout one to three folds", () => {
  for (let folds = 1; folds <= 3; folds++)
    for (let frame = 0; frame <= 120; frame++) {
      const points = foldPoints(440, folds, frame / 120);
      for (let i = 1; i < points.length; i++)
        expect(
          Math.hypot(
            points[i][0] - points[i - 1][0],
            points[i][1] - points[i - 1][1],
          ),
        ).toBeCloseTo(440 / 2 ** folds, 7);
    }
});
it("each completed fold halves the span and aligns the ends", () => {
  for (let folds = 1; folds <= 3; folds++) {
    const points = foldPoints(440, folds, 1),
      xs = points.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(440 / 2 ** folds, 7);
    expect(points[0][0]).toBeCloseTo(points.at(-1)![0], 7);
    expect(Math.max(...points.map((p) => Math.abs(p[1])))).toBeLessThan(1e-8);
  }
});
