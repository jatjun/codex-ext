/** A polyline with equal rigid segments, folded right-to-left around successive midpoints. */
export function foldPoints(
  length: number,
  folds: number,
  progress: number,
): [number, number][] {
  const parts = 2 ** folds;
  return Array.from({ length: parts + 1 }, (_, i) => {
    let x = (i * length) / parts,
      y = 0;
    for (let j = 0; j < folds; j++) {
      const hinge = length / 2 ** (j + 1),
        q = Math.max(0, Math.min(1, progress * folds - j));
      if (x > hinge + 1e-8) {
        const dx = x - hinge,
          angle = Math.PI * q;
        const nextX = hinge + dx * Math.cos(angle) - y * Math.sin(angle);
        y = dx * Math.sin(angle) + y * Math.cos(angle);
        x = nextX;
      }
    }
    return [x, y];
  });
}
