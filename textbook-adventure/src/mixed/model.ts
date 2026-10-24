export type Kind = "bus" | "yogurt" | "peaches" | "paper" | "flowers" | "beads";
export type Numbers = { a: number; b: number; c: number };
export type Lesson = {
  id: Kind;
  title: string;
  page: number;
  icon: string;
  unit: string;
  seed: Numbers;
  practice: Numbers;
  transfer: Numbers;
  purpose: string;
};
export const lessons: Lesson[] = [
  {
    id: "bus",
    title: "公交站：先下后上",
    page: 6,
    icon: "🚌",
    unit: "人",
    seed: { a: 24, b: 13, c: 18 },
    practice: { a: 26, b: 12, c: 9 },
    transfer: { a: 32, b: 14, c: 7 },
    purpose: "把上下车动作与加减法一一对应，同级运算从左到右。",
  },
  {
    id: "yogurt",
    title: "酸奶工坊：整组与零散",
    page: 7,
    icon: "🥛",
    unit: "盒",
    seed: { a: 6, b: 3, c: 4 },
    practice: { a: 4, b: 3, c: 5 },
    transfer: { a: 5, b: 4, c: 3 },
    purpose: "先算相同的几组，再加零散部分；乘法写在后面也要先算。",
  },
  {
    id: "peaches",
    title: "桃子装盒：括号的任务",
    page: 8,
    icon: "🍑",
    unit: "盒",
    seed: { a: 25, b: 15, c: 8 },
    practice: { a: 12, b: 18, c: 6 },
    transfer: { a: 16, b: 8, c: 4 },
    purpose: "先合并两篮，再按每盒数量分组；括号表示先做的整体。",
  },
  {
    id: "paper",
    title: "窗花作坊：两种办法",
    page: 12,
    icon: "✂️",
    unit: "张",
    seed: { a: 96, b: 14, c: 15 },
    practice: { a: 40, b: 12, c: 8 },
    transfer: { a: 60, b: 16, c: 14 },
    purpose: "分别减去两次完成的量，或先合计完成量再减。",
  },
  {
    id: "flowers",
    title: "花朵花园：谁是谁的几倍",
    page: 13,
    icon: "🌼",
    unit: "朵",
    seed: { a: 8, b: 3, c: 2 },
    practice: { a: 9, b: 4, c: 3 },
    transfer: { a: 12, b: 5, c: 2 },
    purpose: "先找到比较后的中间数量，再求它的几倍。",
  },
  {
    id: "beads",
    title: "串珠工坊：颗与条",
    page: 14,
    icon: "🔴",
    unit: "条",
    seed: { a: 72, b: 56, c: 8 },
    practice: { a: 40, b: 24, c: 8 },
    transfer: { a: 36, b: 24, c: 6 },
    purpose: "多出的珠子每组8颗，才能换成手链条数。",
  },
];
export function validate(k: Kind, n: Numbers): string {
  if (Object.values(n).some((x) => !Number.isInteger(x) || x < 1 || x > 100))
    return "请使用1～100的整数。";
  const { a, b, c } = n;
  if (
    (k === "yogurt" && (a > 10 || b > 6)) ||
    (k === "flowers" && (a - b > 10 || c > 6))
  )
    return "分组演示每组最多10个、最多6组，请缩小数字。";
  if (
    (k === "peaches" || k === "beads") &&
    (c > 10 || (k === "peaches" ? (a + b) / c : (a - b) / c) > 10)
  )
    return "分组演示每组最多10个、最多10组，请缩小数字。";
  if (["bus", "paper", "flowers", "beads"].includes(k) && a <= b)
    return "第一个数量应大于第二个数量。";
  if (k === "paper" && a < b + c) return "剪好的总张数不能超过原有张数。";
  if (k === "yogurt" && a * b + c > 100)
    return "本次实物演示最多100个，请减小数字。";
  if (k === "flowers" && (a - b) * c > 100) return "花朵总数不能超过100。";
  if (k === "bus" && a - b + c > 100) return "车上总人数不能超过100。";
  if (k === "peaches" && (a + b > 100 || (a + b) % c !== 0))
    return "两篮合计应不超过100，且能按每盒数量恰好装完。";
  if (k === "beads" && (a % c !== 0 || b % c !== 0))
    return "两种珠子都应能按每条数量恰好分完。";
  return "";
}
export function model(k: Kind, n: Numbers) {
  const { a, b, c } = n;
  const first = k === "yogurt" ? a * b : k === "peaches" ? a + b : a - b;
  const total =
    k === "bus" || k === "yogurt"
      ? first + c
      : k === "paper"
        ? first - c
        : k === "flowers"
          ? first * c
          : first / c;
  const op1 = k === "yogurt" ? "×" : k === "peaches" ? "+" : "−";
  const op2 =
    k === "paper"
      ? "−"
      : k === "flowers"
        ? "×"
        : k === "peaches" || k === "beads"
          ? "÷"
          : "+";
  return {
    first,
    total,
    op1,
    op2,
    firstExpression: `${a}${op1}${b}`,
    expression:
      k === "peaches" || k === "flowers" || k === "beads"
        ? `(${a}${op1}${b})${op2}${c}`
        : `${a}${op1}${b}${op2}${c}`,
    alternative:
      k === "paper"
        ? `${a}−(${b}+${c})`
        : k === "beads"
          ? `${a}÷${c}−${b}÷${c}`
          : k === "yogurt"
            ? `${c}+${a}×${b}`
            : null,
  };
}
export function story(k: Kind, n: Numbers, transfer = false) {
  const { a, b, c } = n;
  if (k === "bus")
    return transfer
      ? `书架原有${a}本书，借走${b}本，又归还${c}本。现在有多少本？`
      : `车上原有${a}人，下车${b}人，上车${c}人。现在有多少人？`;
  if (k === "yogurt")
    return `有${b}组${transfer ? "积木" : "酸奶"}，每组${a}${transfer ? "块" : "盒"}，另外还有${c}${transfer ? "块" : "盒"}。一共有多少${transfer ? "块" : "盒"}？`;
  if (k === "peaches")
    return `两${transfer ? "袋糖果" : "篮桃子"}分别有${a}个和${b}个，每盒装${c}个。一共能装几盒？`;
  if (k === "paper")
    return `一共${a}${transfer ? "本书" : "张窗花"}，第一次${transfer ? "卖出" : "剪好"}${b}，第二次${transfer ? "卖出" : "剪好"}${c}。还剩多少？`;
  if (k === "flowers")
    return `甲有${a}${transfer ? "块积木" : "朵花"}，乙比甲少${b}，丙的数量是乙的${c}倍。丙有多少？`;
  return `红${transfer ? "积木" : "珠子"}${a}个，黄的${b}个，每${c}个同色${transfer ? "装一盒" : "串一条"}。红色比黄色多${transfer ? "装几盒" : "串几条"}？`;
}
export function instruction(k: Kind, step: number, n: Numbers) {
  const m = model(k, n);
  if (step === 0)
    return k === "yogurt"
      ? `先把${n.b}组、每组${n.a}个合起来看。`
      : k === "peaches"
        ? `把第二篮${n.b}个加入第一篮。`
        : `先从${n.a}个中移出${n.b}个，找到中间数量。`;
  return k === "paper"
    ? `再移出${n.c}个，留下未完成的。`
    : k === "flowers"
      ? `以刚找到的${m.first}个为一组，再复制成${n.c}组。`
      : k === "beads" || k === "peaches"
        ? `每${n.c}个圈成一组，数的是组数。`
        : `再加入${n.c}个。`;
}
export function reason(k: Kind) {
  return k === "yogurt"
    ? "先算相同的几组，再加零散的"
    : k === "peaches"
      ? "先合并总数，再按每盒数量分组"
      : k === "flowers"
        ? "先求乙的数量，丙是乙的几倍"
        : k === "beads"
          ? "先找多出的颗数，再换成条数"
          : k === "paper"
            ? "先求第一次后剩下的，再减去第二次"
            : "下车使人数减少，上车使人数增加";
}
export const easier: Record<Kind, Numbers> = {
  bus: { a: 10, b: 4, c: 2 },
  yogurt: { a: 2, b: 3, c: 1 },
  peaches: { a: 6, b: 6, c: 3 },
  paper: { a: 12, b: 3, c: 2 },
  flowers: { a: 5, b: 2, c: 2 },
  beads: { a: 12, b: 6, c: 3 },
};
