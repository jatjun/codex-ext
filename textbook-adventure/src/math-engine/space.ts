export const faces = ["前", "右", "后", "左", "上", "下"] as const;
export type Face = (typeof faces)[number];
export type Labels = Record<Face, number>;
export const original: Labels = { 前: 1, 右: 3, 后: 6, 左: 4, 上: 5, 下: 2 };
export const transfer: Labels = { 前: 2, 右: 1, 后: 5, 左: 6, 上: 4, 下: 3 };
export const opposite: Record<Face, Face> = {
  前: "后",
  后: "前",
  左: "右",
  右: "左",
  上: "下",
  下: "上",
};
export const camera: Record<Face, [number, number]> = {
  前: [0, 0],
  右: [0, -90],
  后: [0, -180],
  左: [0, 90],
  上: [-90, 0],
  下: [90, 0],
};
export function answer(labels: Labels, face: Face) {
  return labels[face];
}
export function validLabels(labels: Labels) {
  return (
    new Set(Object.values(labels)).size === 6 &&
    faces.every(
      (f) => Number.isInteger(labels[f]) && labels[f] >= 1 && labels[f] <= 6,
    ) &&
    faces.every((f) => labels[f] + labels[opposite[f]] === 7)
  );
}
export function unfoldFaces(t: number) {
  const p = Math.max(0, Math.min(1, t));
  return {
    front: 0,
    left: -90 * (1 - p),
    right: 90 * (1 - p),
    top: 90 * (1 - p),
    bottom: -90 * (1 - p),
    back: 90 * (1 - p),
  };
}
export function check(
  kind: "view" | "net",
  phase: "guided" | "practice" | "transfer",
  value: string,
  labels: Labels,
) {
  const target: Face =
    kind === "view"
      ? phase === "guided"
        ? "前"
        : phase === "practice"
          ? "后"
          : "左"
      : phase === "guided"
        ? "后"
        : phase === "practice"
          ? "下"
          : "左";
  return {
    correct: Number(value) === answer(labels, target),
    target,
    expected: answer(labels, target),
  };
}
