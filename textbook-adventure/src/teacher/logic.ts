export type Stage =
  | "INTRO"
  | "OBSERVE"
  | "QUESTION"
  | "HINT_1"
  | "HINT_2"
  | "EXPLAIN"
  | "RETRY"
  | "TRANSFER"
  | "COMPLETE";
export function feedback(
  kind: "view" | "net",
  attempts: number,
  value: string,
) {
  if (attempts === 1)
    return kind === "view"
      ? "先找观察者的位置：他正对哪个面？" +
          (value === "5"
            ? "你可能把上面和前面混在一起了。上面和前面不是同一个方向。"
            : "先沿着观察方向，找到正对着的面。")
      : value === "3" || value === "4"
        ? "你可能找到了相邻面。相邻面共用一条边，“相对”是面对面。"
        : "先想一想：“相对”是面对面，还是共用一条边？试着用手比一比。";
  if (attempts === 2)
    return kind === "view"
      ? `你选了${value}。点击方向按钮，观察正对的面；留意物体并没有转动。`
      : "把展开滑块慢慢拉回，观察中央面和最远端的面是否面对面。";
  return kind === "view"
    ? "现在一起检查观察方向与面上的数字，再用一道新题重新尝试。"
    : "现在完整折叠检查。相对面配成三组，每组的两个面不相邻。再做一道新题。";
}
// Future server-side adapter only. The local rule engine always owns conditions and answers.
export interface TeacherAdapter {
  explain(input: Readonly<{ lesson: string; error: string }>): Promise<string>;
}
export const localTeacher: TeacherAdapter = {
  async explain(input) {
    return `我们一起检查：${input.error}`;
  },
};

export function canAdvance(step: number, answered: boolean) {
  return step < 4 && (step < 2 || answered);
}
export function stageAfterAnswer(attempts: number): Stage {
  return attempts === 1 ? "HINT_1" : attempts === 2 ? "HINT_2" : "EXPLAIN";
}

export const stageLabels: Record<Stage, string> = {
  INTRO: "故事时间",
  OBSERVE: "一起观察",
  QUESTION: "先猜一猜",
  HINT_1: "小提示",
  HINT_2: "动手看看",
  EXPLAIN: "一起验证",
  RETRY: "重新尝试",
  TRANSFER: "换题挑战",
  COMPLETE: "探索完成",
};
