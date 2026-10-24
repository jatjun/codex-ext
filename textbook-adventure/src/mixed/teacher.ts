import { model, type Kind, type Numbers } from "./model";
export const fieldLabels: Record<Kind, string[]> = {
  bus: ["原有人数", "下车人数", "上车人数"],
  yogurt: ["每组个数", "组数", "零散个数"],
  peaches: ["第一篮个数", "第二篮个数", "每盒个数"],
  paper: ["总张数", "第一天张数", "第二天张数"],
  flowers: ["甲的数量", "乙比甲少", "丙是乙的几倍"],
  beads: ["红珠颗数", "黄珠颗数", "每条颗数"],
};
export function diagnose(k: Kind, n: Numbers, value: number, final: boolean) {
  const m = model(k, n);
  if (final && value === m.first)
    return {
      code: "intermediate",
      text:
        k === "beads" || k === "peaches"
          ? "你求出了实物个数。问题问的是条数或盒数，还要看每组装几个。"
          : "这是第一步找到的中间数量。最后的问题还需要做一次什么动作？",
    };
  if (k === "flowers" && value === n.a * n.c)
    return {
      code: "wrong_reference",
      text: "你可能用了甲的数量。题目说丙是乙的几倍，先找乙有多少。",
    };
  if (k === "yogurt" && value === (n.a + n.c) * n.b)
    return {
      code: "extra_repeated",
      text: "零散部分只出现一次，不能把它加进每一组。先找相同的几组。",
    };
  if (k === "paper" && value === n.a - (n.b - n.c))
    return {
      code: "subtraction_sign",
      text: "两天都剪好了窗花，两部分都要从未完成的数量中移走。",
    };
  if (k === "bus" && value === n.a - n.b - n.c)
    return {
      code: "action_sign",
      text: "最后是上车，不是下车。人上车以后，车里会更多还是更少？",
    };
  return {
    code: "calculation",
    text: "动作已经分清了吗？把这一步的两个数量分别找出来，再用实物或数量条检查计算。",
  };
}
