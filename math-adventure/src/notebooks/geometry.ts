/** Geometry is computed from faces/voxels, not inferred from answer letters. */
export type V3 = [number, number, number];
export type Face = { id: string; x: number; y: number; w: number; h: number };
export type FoldedFace = {
  id: string;
  center: V3;
  u: V3;
  v: V3;
  n: V3;
  w: number;
  h: number;
  vertices: V3[];
};
const add = (a: V3, b: V3): V3 => a.map((n, i) => n + b[i]) as V3;
const mul = (a: V3, k: number): V3 => a.map((n) => n * k) as V3;
const blend = (a: V3, b: V3, c: number, s: number): V3 =>
  add(mul(a, c), mul(b, s));
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
function adjacency(
  a: Face,
  b: Face,
): "right" | "left" | "bottom" | "top" | undefined {
  if (near(a.y, b.y) && near(a.h, b.h)) {
    if (near(a.x + a.w, b.x)) return "right";
    if (near(b.x + b.w, a.x)) return "left";
  }
  if (near(a.x, b.x) && near(a.w, b.w)) {
    if (near(a.y + a.h, b.y)) return "bottom";
    if (near(b.y + b.h, a.y)) return "top";
  }
}
export function foldNet(faces: Face[], angle: number): FoldedFace[] {
  if (!faces.length) return [];
  const placed = new Map<string, Omit<FoldedFace, "vertices">>();
  const root = faces[0];
  placed.set(root.id, {
    id: root.id,
    center: [root.x + root.w / 2, root.y + root.h / 2, 0],
    u: [1, 0, 0],
    v: [0, 1, 0],
    n: [0, 0, 1],
    w: root.w,
    h: root.h,
  });
  const queue = [root];
  const c = Math.cos(angle),
    s = Math.sin(angle);
  while (queue.length) {
    const a = queue.shift()!,
      p = placed.get(a.id)!;
    for (const b of faces) {
      if (placed.has(b.id)) continue;
      const d = adjacency(a, b);
      if (!d) continue;
      let u = p.u,
        v = p.v,
        n = p.n,
        center: V3;
      if (d === "right" || d === "left") {
        const sign = d === "right" ? 1 : -1;
        u = blend(p.u, p.n, c, -sign * s);
        n = blend(p.n, p.u, c, sign * s);
        center = add(
          add(p.center, mul(p.u, (sign * a.w) / 2)),
          mul(u, (sign * b.w) / 2),
        );
      } else {
        const sign = d === "bottom" ? 1 : -1;
        v = blend(p.v, p.n, c, -sign * s);
        n = blend(p.n, p.v, c, sign * s);
        center = add(
          add(p.center, mul(p.v, (sign * a.h) / 2)),
          mul(v, (sign * b.h) / 2),
        );
      }
      placed.set(b.id, { id: b.id, center, u, v, n, w: b.w, h: b.h });
      queue.push(b);
    }
  }
  return faces
    .filter((f) => placed.has(f.id))
    .map((f) => {
      const p = placed.get(f.id)!;
      return {
        ...p,
        vertices: [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ].map(([x, y]) =>
          add(add(p.center, mul(p.u, (x * p.w) / 2)), mul(p.v, (y * p.h) / 2)),
        ),
      };
    });
}
export function netAnalysis(faces: Face[]) {
  const folded = foldNet(faces, Math.PI / 2);
  const normals = folded.map((f) => f.n.map((n) => Math.round(n)).join(","));
  const overlap = folded
    .filter((_, i) => normals.some((n, j) => j !== i && n === normals[i]))
    .map((f) => f.id);
  const points = folded.flatMap((f) => f.vertices),
    mins = [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k]))),
    maxs = [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k])));
  const coversBox = folded.every((f) => {
    const axis = f.n.findIndex((n) => Math.abs(n) > 0.9);
    if (axis < 0) return false;
    const plane = f.center[axis];
    if (!near(plane, mins[axis]) && !near(plane, maxs[axis])) return false;
    return [0, 1, 2]
      .filter((k) => k !== axis)
      .every(
        (k) =>
          near(Math.min(...f.vertices.map((p) => p[k])), mins[k]) &&
          near(Math.max(...f.vertices.map((p) => p[k])), maxs[k]),
      );
  });
  return {
    valid:
      faces.length === 6 &&
      folded.length === 6 &&
      new Set(normals).size === 6 &&
      coversBox,
    overlap,
    folded,
  };
}
const faces = (cells: number[][], unit = 1): Face[] =>
  cells.map(([x, y], i) => ({
    id: "face-" + i,
    x: x * unit,
    y: y * unit,
    w: unit,
    h: unit,
  }));
export function cubeNets(question: 16 | 17, unit = 1): Face[][] {
  const cells =
    question === 16
      ? [
          [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [0, 1],
            [3, 1],
          ],
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [3, 1],
            [0, 2],
          ],
          [
            [1, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [3, 1],
            [3, 2],
          ],
        ]
      : [
          [
            [1, 0],
            [2, 0],
            [1, 1],
            [0, 2],
            [1, 2],
            [0, 3],
          ],
          [
            [1, 0],
            [1, 1],
            [1, 2],
            [0, 3],
            [1, 3],
            [2, 3],
          ],
          [
            [0, 0],
            [0, 1],
            [0, 2],
            [1, 2],
            [2, 2],
            [0, 3],
          ],
          [
            [0, 0],
            [1, 0],
            [2, 0],
            [0, 1],
            [0, 2],
            [0, 3],
          ],
        ];
  return cells.map((c) => faces(c, unit));
}
export function cuboidNets(l = 2, s = 1): Face[][] {
  const f = (r: number[][]) =>
    r.map(([x, y, w, h], i) => ({ id: "face-" + i, x, y, w, h }));
  const vertical = [0, 1, 2, 3].map((i) => [s, i * s, l, s]);
  return [
    f([...vertical, [0, 0, s, s], [s + l, 0, s, s]]),
    f([
      [0, s, s, s],
      [s, s, l, s],
      [s + l, s, s, s],
      [2 * s + l, s, l, s],
      [s, 0, l, s],
      [s, 2 * s, l, s],
    ]),
    f([...vertical, [0, s, s, s], [s + l, s, s, s]]),
    f([
      [0, 0, s, s],
      [s, 0, l, s],
      [s + l, 0, s, s],
      [2 * s + l, 0, l, s],
      [s, s, l, s],
      [s, 2 * s, l, s],
    ]),
  ];
}
export function project3(
  p: V3,
  yaw = 30,
  pitch = 25,
): [number, number, number] {
  const a = (yaw * Math.PI) / 180,
    b = (pitch * Math.PI) / 180;
  const x = p[0] * Math.cos(a) - p[1] * Math.sin(a),
    depth = p[0] * Math.sin(a) + p[1] * Math.cos(a);
  return [
    x,
    depth * Math.sin(b) - p[2] * Math.cos(b),
    depth * Math.cos(b) - p[2] * Math.sin(b),
  ];
}
export type Voxel = [number, number, number];
export type View = "上" | "前" | "左" | "右";
export function voxelView(voxels: Voxel[], view: View): number[][] {
  const cells = voxels.map(([x, y, z]) =>
    view === "上"
      ? [x, y]
      : view === "前"
        ? [x, -z]
        : view === "左"
          ? [-y, -z]
          : [y, -z],
  );
  const x0 = Math.min(...cells.map((c) => c[0])),
    y0 = Math.min(...cells.map((c) => c[1]));
  return [
    ...new Map(
      cells.map(([x, y]) => [`${x - x0},${y - y0}`, [x - x0, y - y0]]),
    ).values(),
  ].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
export type PatternKind =
  | "star"
  | "aperture"
  | "rings"
  | "windmill"
  | "scale"
  | "cross";
export type Pattern = {
  polygons: number[][][];
  circles: { x: number; y: number; r: number }[];
  lines: number[][][];
};
const rotate = (p: number[], degrees: number) => {
  const a = (degrees * Math.PI) / 180;
  return [
    p[0] * Math.cos(a) - p[1] * Math.sin(a),
    p[0] * Math.sin(a) + p[1] * Math.cos(a),
  ];
};
export function pattern(kind: PatternKind): Pattern {
  const result: Pattern = { polygons: [], circles: [], lines: [] };
  if (kind === "star") {
    result.polygons = [
      Array.from({ length: 6 }, (_, i) =>
        rotate([0, -(i % 2 ? 19 : 62)], i * 60),
      ),
    ];
    result.circles = [{ x: 0, y: 0, r: 65 }];
  }
  if (kind === "rings")
    result.circles = [
      [-60, 16],
      [-30, -14],
      [0, 16],
      [30, -14],
      [60, 16],
    ].map(([x, y]) => ({ x, y, r: 26 }));
  if (kind === "windmill" || kind === "aperture") {
    const n = kind === "windmill" ? 4 : 6;
    for (let i = 0; i < n; i++)
      result.polygons.push(
        [
          [0, 0],
          [0, -62],
          [30, -62],
          [18, -38],
        ].map((p) => rotate(p, (i * 360) / n)),
      );
    result.circles = [{ x: 0, y: 0, r: kind === "windmill" ? 13 : 22 }];
  }
  if (kind === "scale") {
    result.polygons = [
      [
        [-8, 55],
        [0, -30],
        [8, 55],
      ],
      [
        [-83, -35],
        [83, -35],
        [71, -25],
        [-71, -25],
      ],
    ];
    result.lines = [
      [
        [-53, -25],
        [-41, 1],
        [-21, 1],
        [-9, -25],
      ],
      [
        [9, -25],
        [21, 1],
        [41, 1],
        [53, -25],
      ],
    ];
    result.circles = [{ x: 0, y: 0, r: 6 }];
  }
  if (kind === "cross") {
    result.polygons = [
      [
        [-48, -25],
        [48, -25],
        [48, 25],
        [-48, 25],
      ],
    ];
    result.lines = [
      [
        [0, -70],
        [0, 70],
      ],
    ];
  }
  return result;
}
function edges(p: Pattern) {
  return [
    ...p.polygons.flatMap((poly) =>
      poly.map((a, i) => [a, poly[(i + 1) % poly.length]]),
    ),
    ...p.lines.flatMap((line) => line.slice(1).map((b, i) => [line[i], b])),
  ];
}
const pointKey = (p: number[]) =>
  p.map((n) => Math.round(n * 1000) / 1000).join(",");
export function symmetricAbout(p: Pattern, axisDegrees: number): boolean {
  const reflect = (pt: number[]) => {
    const r = rotate(pt, -axisDegrees);
    return rotate([r[0], -r[1]], axisDegrees);
  };
  const key = (edge: number[][]) => edge.map(pointKey).sort().join("|");
  const e = edges(p),
    set = new Set(e.map(key));
  const cset = new Set(p.circles.map((c) => pointKey([c.x, c.y]) + ":" + c.r));
  return (
    e.every((e) => set.has(key(e.map(reflect)))) &&
    p.circles.every((c) => cset.has(pointKey(reflect([c.x, c.y])) + ":" + c.r))
  );
}
const axesCache = new Map<PatternKind, number[]>();
export function symmetryAxes(kind: PatternKind) {
  if (axesCache.has(kind)) return axesCache.get(kind)!;
  const p = pattern(kind),
    axes = Array.from({ length: 180 }, (_, i) => i).filter((i) =>
      symmetricAbout(p, i),
    );
  axesCache.set(kind, axes);
  return axes;
}
export function canTranslate(
  a: { angle: number; mirror: boolean; size: number },
  b: { angle: number; mirror: boolean; size: number },
) {
  return (
    (((a.angle - b.angle) % 360) + 360) % 360 === 0 &&
    a.mirror === b.mirror &&
    near(a.size, b.size)
  );
}
