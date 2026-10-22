import type { Task } from "../pdf/model";
export type Values = Record<string, number>;
export type Field = {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  choices?: string[];
};
export type Panel =
  | { kind: "stack"; block: number; cube: number; cylinder: number }
  | { kind: "transfer"; white: number; give: number; multiple: number }
  | {
      kind: "clock";
      minutes: number;
      elapsed?: number;
      draw?: boolean;
      wrongDial?: boolean;
      offset?: number;
      seconds?: boolean;
    }
  | {
      kind: "divide";
      total: number;
      size: number;
      icon: string;
      mode: "each" | "groups";
      unit: string;
    }
  | {
      kind: "objects";
      rows: { label: string; count: number; icon: string; value?: number }[];
      compare?: boolean;
    }
  | {
      kind: "line";
      start: number;
      jump: number;
      times: number;
      tree?: boolean;
      ends?: number;
    }
  | {
      kind: "direction";
      facing: number;
      turns: number[];
      north: number;
      places: { name: string; x: number; y: number }[];
      route?: number[];
    }
  | {
      kind: "sort";
      items: {
        icon: string;
        frame?: number;
        shape: number;
        color: number;
        size: number;
        extra: number;
      }[];
      criterion:
        | "shape"
        | "color"
        | "size"
        | "extra"
        | "extraShape"
        | "shapeExtra";
      labels: string[];
    }
  | {
      kind: "segments";
      points: [number, number][];
      edges: [number, number][];
      curves?: boolean;
      connect?: boolean;
    }
  | { kind: "ribbon"; span: number; extra: number; inverse: boolean }
  | {
      kind: "measure";
      rows: { label: string; start: number; length: number }[];
      unit: string;
      vertical?: boolean;
    }
  | { kind: "pattern"; a: number; b: number; index: number }
  | { kind: "seat"; rows: number[]; sold: number[]; people?: number }
  | { kind: "border"; perSide: number }
  | {
      kind: "cards";
      cards: { label: string; value: number }[];
      operation: string;
      result: number;
    };
export type WorkbookScene = {
  type: "workbook";
  panels: Panel[];
  frames: { text: string; duration: number }[];
};
export type Definition = {
  book: number;
  n: number;
  id: string;
  title: string;
  topic: string;
  fields: Field[];
  note?: string;
  pending?: string;
  make: (v: Values) => {
    story: string;
    panels: Panel[];
    tasks: Task[];
    summary: string;
  };
  valid?: (v: Values) => string[];
};
