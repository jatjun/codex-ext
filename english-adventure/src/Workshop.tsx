import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Answer, Art } from "./types";
import Icon, { Drawing } from "./Art";
const activities: { art: Art; word: string }[] = [
  { art: "running", word: "running" },
  { art: "football", word: "playing football" },
  { art: "tennis", word: "playing tennis" },
  { art: "rope", word: "jumping rope" },
];
export const subjects = ["Chinese", "Maths", "English", "Art", "Music", "PE"];
export function Canvas({
  answer,
  setAnswer,
  paused,
  bag = false,
}: {
  answer: Answer;
  setAnswer: Dispatch<SetStateAction<Answer>>;
  paused: boolean;
  bag?: boolean;
}) {
  const [tool, setTool] = useState<Art | "pen">("pen"),
    [colour, setColour] = useState("#668ea5"),
    drawing = useRef(false),
    svg = useRef<SVGSVGElement>(null);
  const point = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(640, ((e.clientX - r.x) / r.width) * 640)),
      y: Math.max(0, Math.min(300, ((e.clientY - r.y) / r.height) * 300)),
    };
  };
  return (
    <div className="drawing-workshop">
      <div className="drawing-tools">
        <button
          disabled={paused}
          aria-pressed={tool === "pen"}
          onClick={() => setTool("pen")}
        >
          ✎ 自己画
        </button>
        {(bag
          ? [
              { art: "pencil" as Art, word: "pencil" },
              { art: "book" as Art, word: "book" },
              { art: "case" as Art, word: "pencil case" },
            ]
          : activities
        ).map((x) => (
          <button
            disabled={paused}
            key={x.art}
            aria-pressed={tool === x.art}
            onClick={() => setTool(x.art)}
          >
            {x.word}
          </button>
        ))}
      </div>
      <p className="small-note">
        选印章后点画布放置；选“自己画”后用手指或鼠标画。画布外仍可正常滑动页面。
      </p>
      <svg
        ref={svg}
        viewBox="0 0 640 300"
        className="drawing-canvas"
        role="img"
        aria-label="我的英语画布"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (paused) return;
          e.preventDefault();
          const pos = point(e);
          if (tool !== "pen") {
            setAnswer((a) => ({
              ...a,
              stamps: [
                ...a.stamps,
                { id: crypto.randomUUID(), art: tool, ...pos },
              ],
            }));
            return;
          }
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setAnswer((a) => ({
            ...a,
            strokes: [...a.strokes, { points: [pos], colour }],
          }));
        }}
        onPointerMove={(e) => {
          if (!drawing.current || paused) return;
          const pos = point(e);
          setAnswer((a) => ({
            ...a,
            strokes: a.strokes.map((s, i) =>
              i === a.strokes.length - 1
                ? { ...s, points: [...s.points, pos] }
                : s,
            ),
          }));
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      >
        <rect width="640" height="300" rx="18" fill="#fffdf5" />
        <path
          d="M0 246Q180 208 330 248T640 239V300H0"
          fill={bag ? "#e2ebed" : "#deead8"}
        />
        {answer.stamps.map((s) => (
          <g
            key={s.id}
            transform={`translate(${s.x - 38},${s.y - 56}) scale(.5)`}
            pointerEvents="none"
          >
            <Drawing name={s.art} />
          </g>
        ))}
        {answer.strokes.map((s, i) => (
          <polyline
            key={i}
            points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={s.colour}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ))}
      </svg>
      <div className="canvas-footer">
        <div className="colours">
          {["#668ea5", "#cc8b77", "#83a780", "#a495bf"].map((c) => (
            <button
              key={c}
              disabled={paused}
              aria-label={`画笔颜色 ${c}`}
              aria-pressed={colour === c}
              onClick={() => setColour(c)}
              style={{ background: c }}
            />
          ))}
        </div>
        <button
          disabled={paused || (!answer.strokes.length && !answer.stamps.length)}
          onClick={() =>
            setAnswer((a) =>
              a.strokes.length
                ? { ...a, strokes: a.strokes.slice(0, -1) }
                : { ...a, stamps: a.stamps.slice(0, -1) },
            )
          }
        >
          撤销一笔／印章
        </button>
      </div>
    </div>
  );
}
export function Timetable({
  answer,
  setAnswer,
  paused,
}: {
  answer: Answer;
  setAnswer: Dispatch<SetStateAction<Answer>>;
  paused: boolean;
}) {
  const [subject, setSubject] = useState("English");
  return (
    <div className="timetable">
      <div className="subject-tools">
        {subjects.map((s) => (
          <button
            disabled={paused}
            aria-pressed={subject === s}
            key={s}
            onClick={() => setSubject(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="small-note">
        已选择 <b>{subject}</b>，点课程格安排这一门课。已安排{" "}
        {answer.cells.filter(Boolean).length}/25 格。
      </p>
      <div className="week" role="group" aria-label="我的五天课程表">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <strong key={d}>{d}</strong>
        ))}
        {answer.cells.map((s, i) => (
          <button
            disabled={paused}
            key={i}
            aria-label={`星期${(i % 5) + 1}第${Math.floor(i / 5) + 1}节 ${s || "未安排"}`}
            onClick={() =>
              setAnswer((a) => ({
                ...a,
                cells: a.cells.map((x, j) => (j === i ? subject : x)),
              }))
            }
          >
            {s || "＋"}
          </button>
        ))}
      </div>
    </div>
  );
}
export function Schoolbag({
  answer,
  setAnswer,
  paused,
}: {
  answer: Answer;
  setAnswer: Dispatch<SetStateAction<Answer>>;
  paused: boolean;
}) {
  const items: { art: Art; word: string; plural: string }[] = [
    { art: "pencil", word: "pencil", plural: "pencils" },
    { art: "book", word: "book", plural: "books" },
    { art: "case", word: "pencil case", plural: "pencil cases" },
  ];
  return (
    <div className="bag-workshop">
      <div className="bag-tools">
        {items.map((x) => (
          <button
            disabled={paused || answer.bag.length >= 12}
            key={x.art}
            onClick={() => setAnswer((a) => ({ ...a, bag: [...a.bag, x.art] }))}
          >
            <Icon name={x.art} />
            <span>＋ {x.word}</span>
          </button>
        ))}
      </div>
      <div className="bag-inside" aria-label="书包里的物品">
        {answer.bag.map((art, i) => (
          <button
            className="bag-item"
            disabled={paused}
            key={i}
            aria-label={`取出第${i + 1}个 ${art}`}
            onClick={() =>
              setAnswer((a) => ({ ...a, bag: a.bag.filter((_, j) => j !== i) }))
            }
          >
            <Icon name={art} />
          </button>
        ))}
        {answer.bag.length === 0 && <span>点上面的物品，把它放进书包。</span>}
      </div>
      <p className="small-note">
        已有 {answer.bag.length}{" "}
        件物品；点物品可以取出。以下句子按当前数量生成，是表达辅助。
      </p>
      <div className="bag-language">
        {items.map((x) => {
          const n = answer.bag.filter((i) => i === x.art).length;
          return n ? (
            <p key={x.art}>
              {n === 1 ? `This is my ${x.word}.` : `These are my ${x.plural}.`}{" "}
              <small>（{n}件）</small>
            </p>
          ) : null;
        })}
      </div>
      <details>
        <summary>我也想自己画书包里的东西</summary>
        <Canvas answer={answer} setAnswer={setAnswer} paused={paused} bag />
      </details>
    </div>
  );
}
