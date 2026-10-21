import type { Frame } from "../animation/timeline";
import { queueFields, type QueueConfig, type QueueKind } from "./models";
export type QueueSolution = {
  total: number;
  ming: number;
  hong?: number;
  answer: number;
  equation: string;
};
export function solveQueue(c: QueueConfig): QueueSolution[] {
  const n = c.numbers,
    a = n.front,
    b = n.back;
  switch (c.kind) {
    case "total":
      return [
        {
          total: a + b - 1,
          ming: a,
          answer: a + b - 1,
          equation: `${a}＋${b}－1＝${a + b - 1}`,
        },
      ];
    case "reverse":
      return [
        {
          total: n.total,
          ming: a,
          answer: n.total - a + 1,
          equation: `${n.total}－${a}＋1＝${n.total - a + 1}`,
        },
      ];
    case "between": {
      const h = n.total - b + 1;
      return [
        {
          total: n.total,
          ming: a,
          hong: h,
          answer: Math.abs(h - a) - 1,
          equation: `小红从前第${h}；|${h}－${a}|－1＝${Math.abs(h - a) - 1}`,
        },
      ];
    }
    case "same-direction":
      return [
        {
          total: n.total,
          ming: a,
          hong: n.otherFront,
          answer: Math.abs(n.otherFront - a) - 1,
          equation: `|${n.otherFront}－${a}|－1＝${Math.abs(n.otherFront - a) - 1}`,
        },
      ];
    case "missing": {
      const options: QueueSolution[] = [];
      if (c.order !== "ming-first")
        options.push({
          total: a + b + n.gap,
          ming: a + n.gap + 1,
          hong: a,
          answer: a + b + n.gap,
          equation: `小红在前：${a}＋${n.gap}＋${b}＝${a + b + n.gap}`,
        });
      const total = a + b - n.gap - 2,
        ming = a - n.gap - 1;
      if (
        c.order !== "red-first" &&
        total >= Math.max(a, b) &&
        ming >= 1 &&
        ming <= total
      )
        options.push({
          total,
          ming,
          hong: a,
          answer: total,
          equation: `小明在前：${a}＋${b}－${n.gap}－2＝${total}`,
        });
      return options;
    }
    case "rectangle": {
      const cols = n.left + n.right - 1,
        rows = n.frontRank + n.backRank - 1;
      return [
        {
          total: cols * rows,
          ming: (n.frontRank - 1) * cols + n.left,
          answer: cols * rows,
          equation: `每行${cols}人，${rows}行：${cols}×${rows}＝${cols * rows}`,
        },
      ];
    }
    case "change":
      return [
        {
          total: n.total + n.join - n.leave,
          ming: a + n.join - n.leave,
          answer: a + n.join - n.leave,
          equation: `名次：${a}＋${n.join}－${n.leave}＝${a + n.join - n.leave}`,
        },
      ];
    case "swap":
      return [
        {
          total: n.total,
          ming: n.otherFront,
          hong: a,
          answer: n.otherFront,
          equation: `小明走到小红原来的位置，从前排第${n.otherFront}，从后排第${n.total - n.otherFront + 1}`,
        },
      ];
  }
}
export function validateQueue(c: QueueConfig): string[] {
  const n = c.numbers as unknown as Record<string, number>,
    errors: string[] = [];
  if (!queueFields[c.kind]) return ["请先选择有效题型。"];
  for (const f of queueFields[c.kind])
    if (!Number.isInteger(n[f.key]) || n[f.key] < f.min || n[f.key] > f.max)
      errors.push(f.label + "需要是" + f.min + "～" + f.max + "之间的整数。");
  if (!["unspecified", "red-first", "ming-first"].includes(c.order))
    errors.push("请选择有效的先后顺序。");
  if (errors.length) return errors;
  if (
    ["reverse", "between", "same-direction", "change", "swap"].includes(
      c.kind,
    ) &&
    c.numbers.front > c.numbers.total
  )
    errors.push("从前的名次不能超过队伍总人数。");
  if (c.kind === "between" && c.numbers.back > c.numbers.total)
    errors.push("从后的名次不能超过队伍总人数。");
  if (
    ["same-direction", "swap"].includes(c.kind) &&
    c.numbers.otherFront > c.numbers.total
  )
    errors.push("小红的名次不能超过总人数。");
  if (["between", "same-direction", "swap"].includes(c.kind)) {
    const h =
      c.kind === "between"
        ? c.numbers.total - c.numbers.back + 1
        : c.numbers.otherFront;
    if (h === c.numbers.front)
      errors.push("小明和小红是两个人，不能占同一个位置。");
  }
  if (c.kind === "change") {
    if (c.numbers.total + c.numbers.join > 32)
      errors.push("加入后的队伍最多32人。");
    if (c.numbers.leave >= c.numbers.front + c.numbers.join)
      errors.push("这会让小明也离队，请减少离开的人数。");
    if (c.numbers.join === 0 && c.numbers.leave === 0)
      errors.push("至少加入或离开1人，才能观察名次变化。");
  }
  if (
    c.kind === "rectangle" &&
    (c.numbers.left + c.numbers.right - 1 > 12 ||
      c.numbers.frontRank + c.numbers.backRank - 1 > 12)
  )
    errors.push("为了看清每个站位，每行和每列最多12人。");
  if (!errors.length && !solveQueue(c).length)
    errors.push("这组名次、间隔和先后顺序不能同时成立，请调整数字或顺序。");
  return errors;
}
export function queueStory(c: QueueConfig): string {
  const n = c.numbers;
  const stories: Record<QueueKind, string> = {
    total: `小明从前数排第${n.front}，从后数排第${n.back}。这条队伍有多少人？`,
    reverse: `一条队伍有${n.total}人，小明从前数排第${n.front}，从后数排第几？`,
    between: `一条队伍有${n.total}人。小明从前排第${n.front}，小红从后排第${n.back}。他们中间有几人？`,
    missing: `小红从前排第${n.front}，小明从后排第${n.back}，他们中间有${n.gap}人。${c.order === "red-first" ? "小红在小明前面。" : c.order === "ming-first" ? "小明在小红前面。" : "题目没有说明谁在前。"}队伍有多少人？有几种可能？`,
    rectangle: `小明从左排第${n.left}、从右排第${n.right}，从前排第${n.frontRank}、从后排第${n.backRank}。这支实心队列共有多少人？`,
    "same-direction": `队伍共有${n.total}人。从前数，小明第${n.front}、小红第${n.otherFront}。他们中间有几人？`,
    change: `队伍原有${n.total}人，小明从前排第${n.front}。先在队首加入${n.join}人，再从队首离开${n.leave}人（小明留在队中）。小明现在从前排第几？`,
    swap: `队伍共有${n.total}人，小明从前排第${n.front}，小红从前排第${n.otherFront}。两人交换位置，小明现在从前、从后各排第几？`,
  };
  return stories[c.kind];
}
export type QueueFrame = Frame & {
  kind:
    | "enter"
    | "front"
    | "back"
    | "left"
    | "right"
    | "between"
    | "row"
    | "join"
    | "leave"
    | "swap"
    | "finish";
  count?: number;
};
export function queueFrames(c: QueueConfig): QueueFrame[] {
  const s = solveQueue(c)[0],
    n = c.numbers;
  const frames: QueueFrame[] = [
    {
      kind: "enter",
      text: "让每位小朋友走到自己的位置。前后方向要先看清。",
      duration: 1600,
    },
  ];
  const add = (kind: QueueFrame["kind"], to: number, text: string) => {
    for (let k = 1; k <= to; k++)
      frames.push({
        kind,
        count: k,
        text: text + "：" + k + "。",
        duration: 480,
      });
  };
  if (c.kind === "rectangle") {
    add("left", n.left, "从左往右数");
    add("right", n.right, "从右往左数");
    add("front", n.frontRank, "从前往后数");
    add("back", n.backRank, "从后往前数");
    add("row", n.frontRank + n.backRank - 1, "这一行也站满了小朋友");
  } else {
    if (c.kind === "change") {
      frames.push(
        {
          kind: "join",
          text:
            n.join === 0
              ? "这次没有新朋友加入，队伍先保持不变。"
              : "新朋友走到队首，原来的小朋友依次往后移动。",
          duration: 1800,
        },
        {
          kind: "leave",
          text:
            n.leave === 0
              ? "这次没有人离开，当前的位置保持不变。"
              : "队首的小朋友离开，其余朋友向前补位。",
          duration: 1800,
        },
      );
    }
    if (c.kind === "swap")
      frames.push({
        kind: "swap",
        text: "小明和小红同时走到对方的位置。其他人保持原位。",
        duration: 2200,
      });
    add("front", c.kind === "missing" ? s.hong! : s.ming, "从前往后数");
    if (
      c.kind === "total" ||
      c.kind === "reverse" ||
      c.kind === "missing" ||
      c.kind === "swap" ||
      c.kind === "between"
    )
      add(
        "back",
        c.kind === "between" ? n.back : s.total - s.ming + 1,
        "从后往前数",
      );
    if (["between", "same-direction", "missing"].includes(c.kind))
      frames.push({
        kind: "between",
        text: "只看两个人中间的朋友，不把两位端点算进去。",
        duration: 1700,
      });
  }
  frames.push({
    kind: "finish",
    text: "现在请你动手数一遍，再说说每个数代表什么。",
    duration: 900,
  });
  return frames;
}
export function transferQueue(c: QueueConfig): QueueConfig {
  // Deterministic nearby variants, validated before use; never guess a valid random problem.
  const candidates: QueueConfig[] = [];
  for (const delta of [1, -1, 2, -2])
    for (const key of queueFields[c.kind].map((f) => f.key)) {
      const numbers = {
        ...c.numbers,
        [key]: (c.numbers as unknown as Record<string, number>)[key] + delta,
      };
      candidates.push({ ...c, numbers });
    }
  const signature = (v: QueueConfig) =>
    solveQueue(v)
      .map((s) => s.answer)
      .sort((a, b) => a - b)
      .join(",");
  const valid = candidates.filter((v) => validateQueue(v).length === 0);
  return valid.find((v) => signature(v) !== signature(c)) ?? valid[0] ?? c;
}
export function matchesAnswer(
  expected: string,
  input: string,
  set = false,
): boolean {
  if (!set) return expected === input.trim();
  const parse = (s: string) =>
    s
      .trim()
      .split(/[、,，或\s]+/)
      .filter(Boolean);
  const values = parse(input);
  if (!values.length || values.some((v) => !/^\d+$/.test(v))) return false;
  return (
    [...new Set(values.map(Number))].sort((a, b) => a - b).join(",") ===
    [...new Set(parse(expected).map(Number))].sort((a, b) => a - b).join(",")
  );
}
