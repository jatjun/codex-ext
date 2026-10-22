import { useEffect, useState } from "react";
import type { Kind, Task } from "./types";
import { Drawing, Person } from "./Art";
export function useClock(paused: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let id = 0,
      last = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      const d = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (!paused && !document.hidden && !reduced) setT((v) => v + d / 7000);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused]);
  return t;
}
export const guides: Record<Kind, { lines: string[]; en: string[] }> = {
  word: {
    lines: [
      "看一看：画面里是谁，或是什么物品？",
      "观察它的样子，再听完整的英语单词。",
      "轮到你：把图片、意思和字母联系起来。",
    ],
    en: ["Look and listen.", "Say the word.", "Your turn!"],
  },
  greeting: {
    lines: [
      "两位小伙伴走近，见面时互相问好。",
      "介绍自己，可以用I’m加上名字。",
      "离开时挥手告别，问好与告别的场景不同。",
    ],
    en: ["Hello!", "I am Pip.", "Goodbye!"],
  },
  listen: {
    lines: [
      "小耳朵准备好！先听完整单词或句子。",
      "想想关键词，再比较所有图片。",
      "题目的画面不会替你展示答案。需要时可以主动看文字。",
    ],
    en: ["Listen carefully.", "Think about the words.", "Choose a picture."],
  },
  letters: {
    lines: [
      "同一个字母也有大写和小写，先看清形状。",
      "一个一个点，选中的字母会留下标记。",
      "检查没有重复或遗漏，再写出自己的数量。",
    ],
    en: ["Look at the letters.", "Touch one at a time.", "Count and check."],
  },
  phonics: {
    lines: [
      "听完整单词，再留意开头的声音。",
      "字母的名字和它在单词里的声音可能不同。",
      "浏览器朗读单词；孤立音标请结合老师的示范来练。",
    ],
    en: ["Listen to the word.", "Listen again.", "Now you try."],
  },
  sentence: {
    lines: [
      "词卡像一列小火车，先找到句首。",
      "按意思把每一节车厢接起来。",
      "把整句读一遍，再检查末尾的标点。",
    ],
    en: [
      "Find the first word.",
      "Put the words together.",
      "Read the sentence.",
    ],
  },
  playground: {
    lines: [
      "来到操场，看小伙伴跑步、踢球和跳绳。",
      "可以放活动印章，也可以用手指画自己的故事。",
      "把画面介绍出来：I like…，或She likes…。",
    ],
    en: ["Look at the playground.", "Draw your picture.", "I like running."],
  },
  timetable: {
    lines: [
      "五天，每天五节课，一共25个课程格。",
      "先选择一门课程，再点格子安排。课程可以重复。",
      "选一门最喜欢的课，再说说喜欢它的理由。",
    ],
    en: ["Plan your week.", "Choose a subject.", "I like English best."],
  },
  schoolbag: {
    lines: [
      "打开书包，看看里面放了什么。",
      "亲手放进物品，也可以自己画；一个和多个要分清。",
      "This is说一个，These are说多个，介绍要和画面一致。",
    ],
    en: ["Open the schoolbag.", "Put in a book.", "This is my book."],
  },
};
export default function Scene({
  kind,
  task,
  step,
  progress,
  paused,
  observing,
  showTarget,
  selected,
  toggle,
}: {
  kind: Kind;
  task: Task;
  step: number;
  progress: number;
  paused: boolean;
  observing: boolean;
  showTarget: boolean;
  selected: number[];
  toggle: (i: number) => void;
}) {
  const t = useClock(paused),
    p = observing ? progress : t % 1,
    masked = !!task.listen && !showTarget,
    letters = task.letters;
  return (
    <section className="scene">
      <div className="scene-top">
        <span>
          {observing
            ? "METHOD STUDIO / 方法示例"
            : masked
              ? "LISTENING STUDIO / 小耳朵工作室"
              : "STORY STUDIO / 故事观察窗"}
        </span>
        <i>✦</i>
      </div>
      <svg
        viewBox="0 0 720 390"
        role="img"
        aria-label={
          masked
            ? "听英语后选择图片，主画面不展示答案"
            : task.mode === "count"
              ? "字母泡泡，用下面的按钮逐个选择"
              : "英语故事动画"
        }
        data-testid="scene"
        data-progress={Math.round(progress * 1000) / 1000}
      >
        <defs>
          <linearGradient id="sceneSky" x2="0" y2="1">
            <stop stopColor="#dcecf5" />
            <stop offset="1" stopColor="#f6f5e8" />
          </linearGradient>
          <linearGradient id="hill" x2="0" y2="1">
            <stop stopColor="#b8d5bd" />
            <stop offset="1" stopColor="#9ebeb0" />
          </linearGradient>
        </defs>
        <rect width="720" height="390" rx="20" fill="url(#sceneSky)" />
        <circle cx="606" cy="73" r="31" fill="#f4d18c" />
        <g
          fill="#fff"
          opacity=".76"
          transform={`translate(${observing ? p * 12 : Math.sin(t) * 5},0)`}
        >
          <path d="M53 72q0-22 24-20q18-29 42-4q31-5 30 24Z" />
          <path d="M414 47q2-18 23-14q17-23 35 0q30-4 30 14Z" />
        </g>
        <path d="M0 305Q165 263 344 308T720 293V390H0" fill="url(#hill)" />
        <path
          d="M100 390Q260 280 578 320"
          stroke="#e9ddbd"
          strokeWidth="51"
          fill="none"
        />
        {masked ? (
          <>
            <g transform="translate(255,95) scale(1.3)">
              <Drawing name="owl" p={p} />
            </g>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${467 + i * 25} ${139 - i * 12}q${22 + Math.sin(t * 10 + i) * 5} 35 0 ${58 + i * 20}`}
                fill="none"
                stroke="#82aac0"
                strokeWidth="5"
                opacity={0.35 + i * 0.2}
              />
            ))}
            <text
              x="360"
              y="355"
              textAnchor="middle"
              fontSize="23"
              fill="#4f7488"
            >
              Listen. Think. Choose.
            </text>
          </>
        ) : kind === "letters" && letters ? (
          <>
            {letters.map((letter, i) => {
              const x = 85 + (i % 5) * 133,
                y =
                  90 +
                  Math.floor(i / 5) * 130 +
                  (observing ? Math.sin(p * Math.PI * 2 + i) * 10 : 0);
              return (
                <g
                  key={i}
                  transform={`translate(${x},${y})`}
                  data-letter-index={i}
                >
                  <circle
                    r="44"
                    fill={selected.includes(i) ? "#f6d68f" : "#fdf9ec"}
                    stroke={selected.includes(i) ? "#dba357" : "#b9d2de"}
                    strokeWidth="4"
                  />
                  <text
                    y="16"
                    textAnchor="middle"
                    fontSize="51"
                    fill="#52748a"
                    fontFamily="Georgia,serif"
                  >
                    {letter}
                  </text>
                  {selected.includes(i) && (
                    <circle cx="31" cy="-30" r="10" fill="#72a897" />
                  )}
                </g>
              );
            })}
            <text
              x="360"
              y="355"
              textAnchor="middle"
              fontSize="21"
              fill="#517688"
            >
              Find{" "}
              {task.target === task.target?.toUpperCase() ? "capital" : "small"}{" "}
              {task.target}
            </text>
          </>
        ) : kind === "greeting" ||
          (["word", "listen"].includes(kind) &&
            ["hello", "bye", "self", "play"].includes(task.scene)) ? (
          <>
            <path d="M587 135v172h83V132Z" fill="#9fb5c6" />
            <rect
              x="600"
              y="153"
              width="53"
              height="153"
              rx="7"
              fill="#dfeaf0"
            />
            <g
              transform={`translate(${task.scene === "bye" && !observing ? 290 + p * 160 : 60 + (observing ? progress : Math.sin(t) * 0.1) * 95},132)`}
            >
              <Person colour="#e9ad7f" wave={Math.sin(p * 12) * 18} />
            </g>
            <g transform="translate(414,134)">
              <Person colour="#94b9c9" wave={Math.sin(p * 12 + 1) * 15} />
            </g>
            <path
              d="M144 79h186q13 0 13 12v44q0 12-13 12H213l-22 16 3-16h-50q-13 0-13-12V91q0-12 13-12"
              fill="#fffaf0"
            />
            <text
              x="237"
              y="120"
              fontSize="21"
              textAnchor="middle"
              fill="#52758b"
            >
              {observing
                ? guides[kind].en[step]
                : showTarget && task.mode === "say"
                  ? task.listen?.[0]
                  : "What would you say?"}
            </text>
            {task.id === "names" && (
              <g>
                <text
                  x="150"
                  y="339"
                  fontSize="22"
                  textAnchor="middle"
                  fill="#526d83"
                >
                  Sarah
                </text>
                <text
                  x="360"
                  y="339"
                  fontSize="22"
                  textAnchor="middle"
                  fill="#526d83"
                >
                  Chen Jie
                </text>
                <text
                  x="558"
                  y="339"
                  fontSize="22"
                  textAnchor="middle"
                  fill="#526d83"
                >
                  John
                </text>
                <g transform="translate(300,141) scale(.85)">
                  <Person colour="#b1a0cb" wave={p * 12} />
                </g>
              </g>
            )}
          </>
        ) : kind === "sentence" ? (
          <>
            <g transform="translate(240,110) scale(1.15)">
              <Drawing name="play" p={p} />
            </g>
            <path d="M110 316h500" stroke="#9badbc" strokeWidth="6" />
            {[0, 1, 2].map((i) => (
              <g
                key={i}
                transform={`translate(${110 + i * 180 + (observing ? (1 - progress) * 20 : 0)},264)`}
              >
                <rect
                  width="145"
                  height="55"
                  rx="12"
                  fill={["#f3d697", "#b4d2dd", "#ccbddd"][i]}
                />
                <circle cx="30" cy="63" r="9" fill="#7f96a7" />
                <circle cx="113" cy="63" r="9" fill="#7f96a7" />
                <text
                  x="72"
                  y="35"
                  textAnchor="middle"
                  fontSize="23"
                  fill="#4c6a80"
                >
                  {["First", "Then", "Last"][i]}
                </text>
              </g>
            ))}
          </>
        ) : kind === "playground" ? (
          <>
            <g transform={`translate(${65 + p * 90},127)`}>
              <Drawing name="running" p={p} />
            </g>
            <g transform="translate(317,136)">
              <Drawing name="football" p={p} />
            </g>
            <g transform="translate(510,123)">
              <Drawing name="rope" p={p} />
            </g>
            <text
              x="360"
              y="354"
              textAnchor="middle"
              fontSize="23"
              fill="#4d7285"
            >
              Move. Draw. Say.
            </text>
          </>
        ) : kind === "timetable" ? (
          <>
            <g transform="translate(62,107) scale(1.2)">
              <Drawing name="school" p={p} />
            </g>
            {Array.from({ length: 25 }, (_, i) => (
              <rect
                key={i}
                x={300 + (i % 5) * 63}
                y={99 + Math.floor(i / 5) * 42}
                width="52"
                height="32"
                rx="6"
                fill={
                  ["#f5ddb0", "#b8d4dc", "#c6bddc", "#b9d0b1", "#e6b9aa"][
                    (i + Math.floor(p * 5)) % 5
                  ]
                }
              />
            ))}
            <text
              x="470"
              y="338"
              textAnchor="middle"
              fontSize="23"
              fill="#4d7285"
            >
              5 days × 5 lessons
            </text>
          </>
        ) : kind === "schoolbag" ? (
          <>
            <path
              d="M300 135q0-51 59-51q60 0 60 51"
              fill="none"
              stroke="#7d9fb3"
              strokeWidth="17"
            />
            <rect
              x="271"
              y="128"
              width="181"
              height="190"
              rx="32"
              fill="#8aafc2"
            />
            <rect
              x="292"
              y="211"
              width="140"
              height="88"
              rx="17"
              fill="#aac9d5"
            />
            <path d="M300 234h120" stroke="#e8d4a3" strokeWidth="6" />
            <g
              transform={`translate(${135 + progress * 160},${100 + progress * 50}) scale(.75)`}
            >
              <Drawing name="book" p={p} />
            </g>
          </>
        ) : (
          <>
            <ellipse
              cx="360"
              cy="294"
              rx="146"
              ry="22"
              fill="#466f80"
              opacity=".12"
            />
            <g
              transform={`translate(${235 + Math.sin(p * 6) * 5},${79 + Math.sin(p * 6) * 4}) scale(1.6)`}
              data-art={task.scene}
            >
              <Drawing name={task.scene} p={p} />
            </g>
            {kind === "phonics" && (
              <>
                <path
                  d="M590 147q25 33 0 66m-25-54q14 22 0 43"
                  fill="none"
                  stroke="#a18dbf"
                  strokeWidth="6"
                />
                <text
                  x="360"
                  y="358"
                  textAnchor="middle"
                  fontSize="24"
                  fill="#53758b"
                >
                  A letter name is not always its sound.
                </text>
              </>
            )}
            {showTarget && task.label && (
              <text
                x="360"
                y="353"
                textAnchor="middle"
                fontSize="26"
                fill="#527589"
              >
                {task.label}
              </text>
            )}
          </>
        )}
      </svg>
      {kind === "letters" && letters && !observing && (
        <div className="letter-picks" role="group" aria-label="选择字母">
          {letters.map((l, i) => (
            <button
              key={i}
              disabled={paused}
              aria-label={`第${i + 1}个字母 ${l}`}
              aria-pressed={selected.includes(i)}
              onClick={() => toggle(i)}
            >
              {l}
              <small>{i + 1}</small>
            </button>
          ))}
        </div>
      )}
      <div className="scene-foot">
        <span>
          {masked ? "题目画面不展示目标答案" : "原创插画 · 看见单词的意思"}
        </span>
        <span>✦ ENGLISH ADVENTURE</span>
      </div>
    </section>
  );
}
