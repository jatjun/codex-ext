export type TeachingState =
  | "INTRO"
  | "OBSERVE"
  | "QUESTION"
  | "HINT_1"
  | "HINT_2"
  | "EXPLAIN"
  | "RETRY"
  | "TRANSFER"
  | "COMPLETE";
export type Teaching = {
  state: TeachingState;
  index: number;
  transfer: boolean;
  wrong: number;
  solved: boolean;
};
export type Event = {
  type:
    | "START"
    | "OBSERVED"
    | "CORRECT"
    | "WRONG"
    | "HELP"
    | "RETRY"
    | "RETRIED"
    | "NEXT";
  mainCount?: number;
  transferCount?: number;
};
export const initialTeaching: Teaching = {
  state: "INTRO",
  index: 0,
  transfer: false,
  wrong: 0,
  solved: false,
};
export function teachingReducer(s: Teaching, e: Event): Teaching {
  if (e.type === "START" && s.state === "INTRO")
    return { ...s, state: "OBSERVE" };
  if (e.type === "OBSERVED" && s.state === "OBSERVE")
    return { ...s, state: "QUESTION" };
  if (e.type === "RETRY" && s.state === "EXPLAIN")
    return { ...s, state: "RETRY" };
  if (e.type === "RETRIED" && s.state === "RETRY")
    return { ...s, state: s.transfer ? "TRANSFER" : "QUESTION", wrong: 0 };
  if (
    e.type === "CORRECT" &&
    !["INTRO", "OBSERVE", "COMPLETE", "EXPLAIN", "RETRY"].includes(s.state)
  )
    return { ...s, solved: true };
  if (
    (e.type === "WRONG" || e.type === "HELP") &&
    !s.solved &&
    ["QUESTION", "TRANSFER", "HINT_1", "HINT_2"].includes(s.state)
  ) {
    const wrong = Math.min(3, s.wrong + 1);
    return {
      ...s,
      wrong,
      state: wrong === 1 ? "HINT_1" : wrong === 2 ? "HINT_2" : "EXPLAIN",
    };
  }
  if (e.type === "NEXT" && s.solved) {
    if (s.index + 1 < (s.transfer ? e.transferCount! : e.mainCount!))
      return {
        ...s,
        index: s.index + 1,
        wrong: 0,
        solved: false,
        state: s.transfer ? "TRANSFER" : "QUESTION",
      };
    if (!s.transfer)
      return {
        ...s,
        index: 0,
        wrong: 0,
        solved: false,
        transfer: true,
        state: "TRANSFER",
      };
    return { ...s, state: "COMPLETE" };
  }
  return s;
}
