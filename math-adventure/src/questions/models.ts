export type ShopNumbers = { count: number; price: number; groups: number };
export type ShapeNumbers = {
  stars: number;
  starValue: number;
  triangles: number;
  triangleValue: number;
};
export type DetectiveNumbers = {
  butterflies: number;
  dragonflies: number;
  fish: number;
  patternCount: number;
};
export type Settings = {
  shop: ShopNumbers;
  shapes: ShapeNumbers;
  detective: DetectiveNumbers;
  square: { rank: number };
};
export type QueueKind =
  | "total"
  | "reverse"
  | "between"
  | "missing"
  | "rectangle"
  | "same-direction"
  | "change"
  | "swap";
export type QueueOrder = "unspecified" | "red-first" | "ming-first";
export type QueueNumbers = {
  total: number;
  front: number;
  back: number;
  otherFront: number;
  gap: number;
  left: number;
  right: number;
  frontRank: number;
  backRank: number;
  join: number;
  leave: number;
};
export type QueueConfig = {
  kind: QueueKind;
  numbers: QueueNumbers;
  order: QueueOrder;
};
export type LessonModel = Settings & { queue?: QueueConfig };
export const defaults: Settings = {
  shop: { count: 4, price: 3, groups: 2 },
  shapes: { stars: 3, starValue: 6, triangles: 4, triangleValue: 4 },
  detective: { butterflies: 8, dragonflies: 6, fish: 6, patternCount: 12 },
  square: { rank: 3 },
};
export const queueDefaults: QueueNumbers = {
  total: 15,
  front: 5,
  back: 6,
  otherFront: 11,
  gap: 3,
  left: 6,
  right: 5,
  frontRank: 3,
  backRank: 6,
  join: 2,
  leave: 1,
};
export const queueCatalog: {
  kind: QueueKind;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    kind: "total",
    title: "两头数，求总人数",
    description: "同一个人，为什么要减掉一次？",
    icon: "↔",
  },
  {
    kind: "reverse",
    title: "换个方向排第几",
    description: "知道总人数，找另一头的名次。",
    icon: "⇄",
  },
  {
    kind: "between",
    title: "两人中间有几人",
    description: "先统一方向，再找真正的中间。",
    icon: "⋯",
  },
  {
    kind: "missing",
    title: "知道间隔，求总人数",
    description: "两人的先后顺序，有时会带来两种答案。",
    icon: "？",
  },
  {
    kind: "rectangle",
    title: "四个方向，求总人数",
    description: "先求每行、每列，再铺满整个队列。",
    icon: "▦",
  },
  {
    kind: "same-direction",
    title: "同方向的两人间隔",
    description: "两人的名次都从同一头数。",
    icon: "⋮",
  },
  {
    kind: "change",
    title: "加入、离开后的名次",
    description: "人真的走进、走出，名次也会变。",
    icon: "＋",
  },
  {
    kind: "swap",
    title: "交换位置后的名次",
    description: "两个人走到对方的位置，再从两头数。",
    icon: "⇆",
  },
];
export function defaultQueue(kind: QueueKind): QueueConfig {
  const numbers = { ...queueDefaults };
  if (kind === "total") numbers.back = 8;
  if (kind === "missing") {
    numbers.front = 8;
    numbers.back = 3;
  }
  if (kind === "same-direction") {
    numbers.front = 4;
    numbers.otherFront = 12;
  }
  return { kind, numbers, order: "unspecified" };
}
export type Field = {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
};
export const settingFields: Record<keyof Settings, Field[]> = {
  shop: [
    { key: "count", label: "阳阳买几只玩具", min: 2, max: 6 },
    { key: "price", label: "每只玩具几元", min: 1, max: 6 },
    { key: "groups", label: "乐乐买几只玩具", min: 2, max: 4 },
  ],
  shapes: [
    { key: "stars", label: "星星的个数", min: 2, max: 5 },
    { key: "starValue", label: "每颗星星的能量", min: 2, max: 8 },
    { key: "triangles", label: "三角形的个数", min: 2, max: 5 },
    { key: "triangleValue", label: "每个三角形的能量", min: 2, max: 8 },
  ],
  detective: [
    { key: "butterflies", label: "蝴蝶的数量", min: 1, max: 10 },
    { key: "dragonflies", label: "蜻蜓的数量", min: 1, max: 10 },
    { key: "fish", label: "鱼的数量", min: 1, max: 10 },
    { key: "patternCount", label: "迁移图案总数", min: 6, max: 18, step: 3 },
  ],
  square: [{ key: "rank", label: "中间的人从每个方向排第几", min: 1, max: 5 }],
};
const totalField: Field = {
  key: "total",
  label: "队伍总人数",
  min: 2,
  max: 30,
};
const frontField: Field = {
  key: "front",
  label: "小明从前排第几",
  min: 1,
  max: 15,
};
const backField: Field = { key: "back", label: "从后排第几", min: 1, max: 15 };
const otherField: Field = {
  key: "otherFront",
  label: "小红从前排第几",
  min: 1,
  max: 30,
};
export const queueFields: Record<QueueKind, Field[]> = {
  total: [frontField, backField],
  reverse: [totalField, frontField],
  between: [totalField, frontField, { ...backField, label: "小红从后排第几" }],
  missing: [
    { ...frontField, label: "小红从前排第几", max: 12 },
    { ...backField, label: "小明从后排第几", max: 12 },
    { key: "gap", label: "两人中间有几人", min: 0, max: 8 },
  ],
  rectangle: [
    { key: "left", label: "从左排第几", min: 1, max: 8 },
    { key: "right", label: "从右排第几", min: 1, max: 8 },
    { key: "frontRank", label: "从前排第几", min: 1, max: 8 },
    { key: "backRank", label: "从后排第几", min: 1, max: 8 },
  ],
  "same-direction": [totalField, frontField, otherField],
  change: [
    totalField,
    frontField,
    { key: "join", label: "先在队首加入几人", min: 0, max: 6 },
    { key: "leave", label: "再从队首离开几人", min: 0, max: 6 },
  ],
  swap: [totalField, frontField, otherField],
};
export function validateSettings(
  id: keyof Settings,
  values: Settings[typeof id],
): string[] {
  const v = values as unknown as Record<string, number>,
    errors: string[] = [];
  for (const f of settingFields[id])
    if (
      !Number.isInteger(v[f.key]) ||
      v[f.key] < f.min ||
      v[f.key] > f.max ||
      (f.step && v[f.key] % f.step !== 0)
    )
      errors.push(
        f.label +
          "需要是" +
          f.min +
          "～" +
          f.max +
          "之间" +
          (f.step ? "、且是" + f.step + "的倍数的" : "的") +
          "整数。",
      );
  if (errors.length) return errors;
  if (id === "shop") {
    const s = values as ShopNumbers;
    if (s.count * s.price > 24) errors.push("为方便逐枚操作，总钱数最多24元。");
    if ((s.count * s.price) % s.groups !== 0)
      errors.push(
        "这组钱不能整元平均分，请调整数字，让总价能被乐乐的玩具数整除。",
      );
  }
  if (id === "shapes") {
    const s = values as ShapeNumbers;
    if (s.stars * s.starValue > 30 || s.triangles * s.triangleValue > 30)
      errors.push("每组图形的总能量最多30点。");
  }
  return errors;
}
