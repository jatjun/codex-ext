import type { Face, PatternKind, Voxel, View } from "./geometry";
export type Expr = number | { op: "+" | "-" | "×" | "÷"; a: Expr; b: Expr };
export type Batch = {
  label: string;
  icon: string;
  per: number;
  copies: number;
  value: number;
  color: string;
};
export type AdvancedSpec =
  | { kind: "ruler"; mm: number }
  | {
      kind: "mass";
      mode:
        | "convert"
        | "compare"
        | "equal"
        | "bags"
        | "bottle"
        | "units"
        | "estimate";
      values: {
        label: string;
        amount: number;
        unit: "g" | "kg" | "t";
        icon: string;
      }[];
      target?: number;
      cupCount?: number;
      bagCount?: number;
    }
  | {
      kind: "groups";
      batches: Batch[];
      distribution: "copies" | "mixed" | "separate" | "compare";
      groups: number;
      difference: boolean;
      methods: string[];
      unit: string;
    }
  | { kind: "bus"; before: number; off: number; on: number }
  | { kind: "race"; distance: number; a: number; b: number; seconds: number }
  | {
      kind: "operations";
      expressions: Expr[];
      captions: string[];
      working?: string[];
    }
  | {
      kind: "solids";
      counts: { kind: string; count: number }[];
      construction: 1 | 2;
    }
  | {
      kind: "net";
      nets: Face[][];
      length: number;
      short: number;
      yaw: number;
      question: 16 | 17 | 18;
    }
  | { kind: "view"; voxels: Voxel[]; target: View; yaw: number }
  | {
      kind: "motion";
      objects: {
        label: string;
        icon:
          | "fan"
          | "window"
          | "elevator"
          | "clock"
          | "block"
          | "wheel"
          | "top";
        rotation: number;
        dx: number;
        dy: number;
      }[];
    }
  | { kind: "symmetry"; patterns: PatternKind[]; angle: number; size: number }
  | {
      kind: "roses";
      target: { angle: number; size: number; mirror: boolean };
      options: { angle: number; size: number; mirror: boolean }[];
    };
export type ExtensionScene = {
  type: "extension";
  spec: AdvancedSpec;
  frames: { text: string; duration: number }[];
};
export type Field = {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
};
export type Book = "a" | "b";
export type Address = { book: Book; number: number };
export const bookNames = { a: "质量与应用", b: "运算与空间" };
export function evaluate(e: Expr): number {
  if (typeof e === "number") return e;
  const a = evaluate(e.a),
    b = evaluate(e.b);
  if (e.op === "+") return a + b;
  if (e.op === "-") return a - b;
  if (e.op === "×") return a * b;
  if (b === 0) throw Error("Division by zero");
  return a / b;
}
export function exprText(e: Expr): string {
  if (typeof e === "number") return String(e);
  const part = (child: Expr) =>
    typeof child === "number" ? String(child) : `（${exprText(child)}）`;
  return part(e.a) + e.op + part(e.b);
}
export const op = (symbol: "+" | "-" | "×" | "÷", a: Expr, b: Expr): Expr => ({
  op: symbol,
  a,
  b,
});
export function toGrams(n: number, u: "g" | "kg" | "t") {
  return n * (u === "g" ? 1 : u === "kg" ? 1000 : 1000000);
}
export const unitName = { g: "克", kg: "千克", t: "吨" };
