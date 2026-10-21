import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "./Scenes";
import { queueFrames, solveQueue, type QueueFrame } from "../questions/queue";
const list = (n: number) => Array.from({ length: n }, (_, i) => i);
const blend = (a: number, b: number, t: number) =>
  a + (b - a) * Math.max(0, Math.min(1, t));
function Avatar({
  ming = false,
  hong = false,
}: {
  ming?: boolean;
  hong?: boolean;
}) {
  return (
    <svg viewBox="0 0 48 70" aria-hidden="true">
      <circle cx="24" cy="17" r="10" fill="#edc29f" />
      <path
        d="M14 14 Q15 2 25 5 Q36 6 35 15"
        fill={hong ? "#785c4c" : "#514c43"}
      />
      <path
        d="M11 35 Q24 23 37 35 L39 53 H9Z"
        fill={ming ? "#df9874" : hong ? "#b696d0" : "#779da1"}
      />
      <path
        d="M17 53V66 M31 53V66"
        stroke="#52696b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {ming && <path d="M18 38H30M24 32V44" stroke="#fff2ce" strokeWidth="3" />}
    </svg>
  );
}
export function QueueScene(p: SceneProps) {
  const config = p.model.queue!;
  const solutions = solveQueue(config),
    n = config.numbers;
  const [scenario, setScenario] = useState(0),
    [direction, setDirection] = useState<"front" | "back" | "left" | "right">(
      "front",
    ),
    [manual, setManual] = useState(0),
    [clicked, setClicked] = useState<number[]>([]),
    [notice, setNotice] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setScenario(0);
    setManual(0);
    setClicked([]);
    setNotice("");
  }, [p.question.id, p.transfer, p.observing, p.guiding]);
  const solution = solutions[Math.min(scenario, solutions.length - 1)],
    board = queueFrames(config);
  const automatic = p.observing || p.guiding;
  const step: QueueFrame = automatic
    ? board[
        Math.max(
          0,
          Math.min(board.length - 1, p.animation.frame - (p.guiding ? 1 : 0)),
        )
      ]
    : { kind: "finish", text: "", duration: 0 };
  const tween = automatic ? p.animation.progress : 1;
  const count = automatic ? (step.count ?? 0) : manual;
  const scan = automatic ? step.kind : direction;
  const rectangle = config.kind === "rectangle";
  const cols = n.left + n.right - 1,
    rows = n.frontRank + n.backRank - 1;
  const total = solution.total;
  const equation =
    p.question.id === "queue-columns"
      ? n.left + "＋" + n.right + "－1＝" + cols
      : p.question.id === "queue-rows"
        ? n.frontRank + "＋" + n.backRank + "－1＝" + rows
        : config.kind === "swap" && p.question.id !== "queue-swap-back"
          ? "交换后，小明从前排第" + solution.ming
          : solution.equation;
  const active = scan === "back" ? total - count : count - 1;
  useEffect(() => {
    if (!rectangle && automatic && count > 0 && scroll.current)
      scroll.current.scrollLeft = Math.max(
        0,
        active * 58 - scroll.current.clientWidth / 2,
      );
  }, [automatic, count, active, rectangle]);
  const addCount = (d: typeof direction) => {
    if (p.paused || automatic) return;
    setDirection(d);
    const max = rectangle
      ? d === "front" || d === "back"
        ? rows
        : cols
      : total;
    setManual((v) => (d === direction ? Math.min(max, v + 1) : 1));
  };
  const isBetween = (rank: number) =>
    solution.hong !== undefined &&
    rank > Math.min(solution.ming, solution.hong) &&
    rank < Math.max(solution.ming, solution.hong);
  const countPerson = (rank: number) => {
    if (p.paused || automatic) return;
    if (
      ["between", "same-direction", "missing"].includes(config.kind) &&
      !isBetween(rank)
    ) {
      setNotice("我们只数两个人之间的朋友，不包括两位端点。");
      return;
    }
    setNotice("");
    setClicked((prev) =>
      prev.includes(rank) ? prev.filter((x) => x !== rank) : [...prev, rank],
    );
  };
  let people = list(config.kind === "change" ? n.total + n.join : total).map(
    (i) => ({
      id: "p" + i,
      initial: i,
      slot: i,
      x: i * 58 + 8,
      y: 0,
      opacity: 1,
      ming:
        i + 1 ===
        (config.kind === "swap" || config.kind === "change"
          ? n.front
          : solution.ming),
      hong: i + 1 === (config.kind === "swap" ? n.otherFront : solution.hong),
      visible: true,
    }),
  );
  if (config.kind === "swap")
    people = people.map((person) => {
      const final = person.ming
        ? n.otherFront - 1
        : person.hong
          ? n.front - 1
          : person.initial;
      const progress =
        step.kind === "enter" ? 0 : step.kind === "swap" ? tween : 1;
      return {
        ...person,
        slot: progress === 1 ? final : person.initial,
        x: blend(person.initial * 58 + 8, final * 58 + 8, progress),
        y: person.ming
          ? -Math.sin(progress * Math.PI) * 30
          : person.hong
            ? Math.sin(progress * Math.PI) * 30
            : 0,
      };
    });
  if (config.kind === "change")
    people = people.map((person) => {
      const original = person.initial < n.total,
        j = person.initial - n.total,
        before = original ? person.initial + n.join : j;
      if (step.kind === "enter")
        return { ...person, visible: original, slot: person.initial };
      if (step.kind === "join")
        return {
          ...person,
          ming: original && person.initial + 1 === n.front,
          slot: before,
          x: original
            ? blend(person.initial * 58 + 8, before * 58 + 8, tween)
            : blend(-120 - j * 58, before * 58 + 8, tween),
          opacity: original ? 1 : tween,
        };
      if (step.kind === "leave")
        return {
          ...person,
          ming: original && person.initial + 1 === n.front,
          slot: before - n.leave,
          x:
            before < n.leave
              ? blend(before * 58 + 8, -120, tween)
              : blend(before * 58 + 8, (before - n.leave) * 58 + 8, tween),
          opacity: before < n.leave ? 1 - tween : 1,
        };
      return {
        ...person,
        ming: original && person.initial + 1 === n.front,
        slot: before - n.leave,
        x: (before - n.leave) * 58 + 8,
        visible: before >= n.leave,
      };
    });
  if (step.kind === "enter" && !rectangle)
    people = people.map((person) => ({
      ...person,
      x: blend(
        -110,
        person.x,
        Math.max(
          0,
          Math.min(
            1,
            tween * (1 + people.length * 0.05) - person.initial * 0.05,
          ),
        ),
      ),
      opacity: Math.max(
        0,
        Math.min(1, tween * (1 + people.length * 0.05) - person.initial * 0.05),
      ),
    }));
  return (
    <div className="scene queue-scene">
      <div className="scene-top">
        <span className="scene-label">
          {rectangle ? "实心队列操场" : "排队观察站"}
        </span>
        <span className="pill">
          {rectangle ? "每个站位都有人" : "前在左边 · 后在右边"}
        </span>
      </div>
      <div className="queue-legend">
        <span className="ming-dot" /> 小明 <span className="hong-dot" /> 小红{" "}
        <span className="between-dot" /> 中间的人
      </div>
      {config.kind === "missing" && (
        <div className="order-note">
          <p>
            题目
            {config.order === "unspecified"
              ? "没有说明谁在前，检查所有能成立的顺序。"
              : "已指定先后顺序。"}
          </p>
          {solutions.length > 1 && (
            <div className="button-row">
              {solutions.map((s, i) => (
                <button
                  key={i}
                  disabled={p.paused || automatic}
                  aria-pressed={scenario === i}
                  onClick={() => {
                    setScenario(i);
                    setManual(0);
                    setClicked([]);
                  }}
                >
                  {s.hong! < s.ming
                    ? "小红在前，小明在后"
                    : "小明在前，小红在后"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {rectangle ? (
        <div className="rectangle-board">
          <p className="scene-math-readout">
            左右名次：{n.left}、{n.right} · 前后名次：{n.frontRank}、
            {n.backRank}
          </p>
          <p className="scene-caption">
            {rows === cols
              ? "行数与每行人数一样，是正方形队列。"
              : "行数和每行人数可以不同，这是实心长方形队列。"}
          </p>
          <svg
            viewBox={"0 0 640 " + (Math.max(340, rows * 44) + 70)}
            className="math-svg"
            aria-label="实心二维队列"
          >
            <rect
              x="20"
              y="25"
              width="600"
              height={Math.max(340, rows * 44) + 20}
              rx="20"
              fill="#e6efdf"
            />
            {list(rows * cols).map((i) => {
              const r = Math.floor(i / cols),
                c = i % cols,
                x = 55 + (c * 530) / Math.max(1, cols - 1),
                y = 55 + (r * Math.max(280, rows * 40)) / Math.max(1, rows - 1);
              const target = r === n.frontRank - 1 && c === n.left - 1;
              const mark =
                scan === "left" && r === n.frontRank - 1 && c < count
                  ? c + 1
                  : scan === "right" &&
                      r === n.frontRank - 1 &&
                      cols - c <= count
                    ? cols - c
                    : scan === "front" && c === n.left - 1 && r < count
                      ? r + 1
                      : scan === "back" && c === n.left - 1 && rows - r <= count
                        ? rows - r
                        : 0;
              const phase =
                step.kind === "enter"
                  ? Math.max(0, Math.min(1, tween * (1 + rows * 0.1) - r * 0.1))
                  : 1;
              const rowGlow =
                step.kind === "row" && r === (step.count ?? 1) - 1;
              return (
                <g
                  key={i}
                  data-queue-position={r + "," + c}
                  transform={
                    "translate(" +
                    blend(-30, x, phase) +
                    " " +
                    blend(0, y, phase) +
                    ")"
                  }
                  opacity={phase}
                >
                  {(mark > 0 || rowGlow || clicked.includes(r + 1)) && (
                    <rect
                      x="-21"
                      y="-25"
                      width="42"
                      height="64"
                      rx="10"
                      fill="#f7d984"
                    />
                  )}
                  <circle cy="-10" r="8" fill="#edc29f" />
                  <path
                    d="M-9 3Q0 -2 9 3L11 21H-11Z"
                    fill={target ? "#df9874" : "#779da1"}
                  />
                  <path
                    d="M-5 21V30M5 21V30"
                    stroke="#52696b"
                    strokeWidth="4"
                  />
                  {target && (
                    <text y="47" textAnchor="middle" fontSize="15">
                      小明
                    </text>
                  )}
                  {mark > 0 && (
                    <g>
                      <circle cx="14" cy="-20" r="13" fill="#456b60" />
                      <text
                        x="14"
                        y="-14"
                        textAnchor="middle"
                        fill="white"
                        fontSize="18"
                      >
                        {mark}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="button-row">
            {list(rows).map((r) => (
              <button
                key={r}
                disabled={p.paused || automatic}
                aria-pressed={clicked.includes(r + 1)}
                onClick={() =>
                  setClicked((prev) =>
                    prev.includes(r + 1)
                      ? prev.filter((x) => x !== r + 1)
                      : [...prev, r + 1],
                  )
                }
              >
                第{r + 1}行
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="queue-scroll-note">
            ← 队首　左右滑动看完整队伍　队尾 →
          </p>
          <div
            className="queue-scroll"
            ref={scroll}
            tabIndex={0}
            aria-label="横向滚动的排队场景"
          >
            <div
              className="queue-strip"
              style={{
                width:
                  (config.kind === "change"
                    ? Math.max(total, n.total + n.join)
                    : total) *
                    58 +
                  24,
              }}
            >
              {people
                .filter((v) => v.visible)
                .map((person) => {
                  const rank = person.slot + 1,
                    frontScan = scan === "front" && rank <= count && rank >= 1,
                    backScan =
                      scan === "back" && total - rank < count && rank <= total;
                  const highlighted =
                    frontScan ||
                    backScan ||
                    (step.kind === "between" && isBetween(rank)) ||
                    clicked.includes(rank);
                  const label = frontScan
                    ? rank
                    : backScan
                      ? total - rank + 1
                      : null;
                  return (
                    <button
                      key={person.id}
                      data-queue-person={person.id}
                      data-rank={rank}
                      className={
                        "queue-person " +
                        (highlighted ? "counted " : "") +
                        (person.ming ? "ming " : person.hong ? "hong " : "")
                      }
                      disabled={p.paused || automatic}
                      style={{
                        left: person.x,
                        top: 38 + person.y,
                        opacity: person.opacity,
                      }}
                      aria-label={
                        (person.ming ? "小明" : person.hong ? "小红" : "同学") +
                        "，当前位置" +
                        rank
                      }
                      onClick={() => countPerson(rank)}
                    >
                      <span className="rank-badge">
                        {label ?? (clicked.includes(rank) ? "✓" : "·")}
                      </span>
                      <Avatar ming={person.ming} hong={person.hong} />
                      <span className="person-name">
                        {person.ming ? "小明" : person.hong ? "小红" : ""}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
      <p className="scene-math-readout" aria-live="polite">
        {count > 0
          ? (
              {
                front: "从前数",
                back: "从后数",
                left: "从左数",
                right: "从右数",
                row: "逐行检查",
              } as Record<string, string>
            )[scan] +
            "：" +
            list(count)
              .map((i) => i + 1)
              .join(" → ")
          : "方向看清楚，同一个人只算一次。"}
      </p>
      {!automatic && (
        <div className="queue-count-controls">
          <p>自己一步一步数，或者点中间的同学做标记。</p>
          <div className="button-row">
            <button disabled={p.paused} onClick={() => addCount("front")}>
              从前数一步
            </button>
            <button disabled={p.paused} onClick={() => addCount("back")}>
              从后数一步
            </button>
            {rectangle && (
              <>
                <button disabled={p.paused} onClick={() => addCount("left")}>
                  从左数一步
                </button>
                <button disabled={p.paused} onClick={() => addCount("right")}>
                  从右数一步
                </button>
              </>
            )}
            <button
              disabled={p.paused}
              onClick={() => {
                setManual(0);
                setClicked([]);
                setNotice("");
              }}
            >
              清空计数标记
            </button>
          </div>
          <p>
            我已标记 {clicked.length} {rectangle ? "行" : "人"}。{notice}
          </p>
        </div>
      )}
      {(p.solved || p.explaining) && (
        <p className="earned-equation">
          {equation}
          {config.kind === "missing" && solutions.length > 1
            ? "；另一种顺序也成立，需要写出两个答案。"
            : ""}
        </p>
      )}
    </div>
  );
}
