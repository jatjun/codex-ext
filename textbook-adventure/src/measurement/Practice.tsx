import { useEffect, useRef, useState } from "react";
import {
  readVisibility,
  saveVisibility,
} from "../../../learning-home/visibility-model.js";
import { questions, type Q } from "./practice";
import {
  initial,
  transition,
  readRows,
  updateRow,
  writeRows,
  download,
  type Row,
} from "./teaching";
export function Practice({ onRecords }: { onRecords: () => void }) {
  const [selected, setSelected] = useState<Q | null>(null),
    [value, setValue] = useState(""),
    [state, setState] = useState(initial),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState(""),
    [hidden, setHidden] = useState(readVisibility),
    [all, setAll] = useState(false),
    [page, setPage] = useState(0),
    [line, setLine] = useState(10),
    [saved, setSaved] = useState(true),
    [note, setNote] = useState(() => {
      try {
        return (
          localStorage.getItem(
            "textbook-adventure.measurement.reflection.v1",
          ) || ""
        );
      } catch {
        return "";
      }
    });
  const session = useRef(""),
    gate = useRef(state),
    started = useRef(Date.now()),
    attemptSeconds = useRef(0),
    last = useRef(Date.now()),
    memory = useRef(readRows());
  useEffect(() => {
    if (!selected) return;
    const timer = setInterval(() => {
      if (!document.hidden && Date.now() - last.current < 60000)
        attemptSeconds.current++;
    }, 1000);
    return () => clearInterval(timer);
  }, [selected]);
  function elapsed() {
    return attemptSeconds.current;
  }
  function select(q: Q) {
    session.current = crypto.randomUUID();
    started.current = Date.now();
    last.current = Date.now();
    attemptSeconds.current = 0;
    setSelected(q);
    setValue("");
    setMessage("先自己做，需要时再使用提示。");
    setLine(10);
    const s = transition(initial, { type: "transfer" });
    gate.current = s;
    setState(s);
  }
  function save(s: typeof state, answer?: string, correct?: boolean) {
    if (!selected) return;
    const fresh: Row = {
      id: session.current,
      lesson: "practice-bank",
      questionId: selected.id,
      question: selected.text,
      phase: "bank",
      started: new Date(started.current).toISOString(),
      firstAnswer: null,
      firstCorrect: null,
      attempts: [],
      hints: s.hints,
      replays: 0,
      explained: s.explained,
      assisted: s.assisted,
      complete: s.correct,
      activeSeconds: elapsed(),
      errorType: s.mistakes ? "单位或数量关系待复习" : "",
    };
    memory.current = updateRow(
      memory.current,
      fresh,
      answer === undefined
        ? undefined
        : { answer, correct: !!correct, time: new Date().toISOString() },
    );
    setSaved(writeRows(memory.current));
  }
  function submit(raw: string) {
    if (!selected || gate.current.correct) return;
    if (raw.trim() === "" || !Number.isFinite(Number(raw))) {
      setMessage("先输入一个数字。");
      return;
    }
    const wrongDrawing =
      selected.diagram === "line" && line !== selected.answer;
    const ok = Number(raw) === selected.answer && !wrongDrawing,
      s = transition(gate.current, { type: "answer", correct: ok });
    gate.current = s;
    setState(s);
    save(
      s,
      selected.diagram === "line" ? `${raw}（画线${line}毫米）` : raw,
      ok,
    );
    setMessage(
      ok
        ? "想法正确！再试一道同类题。"
        : wrongDrawing && Number(raw) === selected.answer
          ? "计算正确了，请把线段端点也拖到相应刻度，再提交。"
          : s.hints >= 3
            ? selected.explain
            : selected.hint,
    );
  }
  function help() {
    if (!selected) return;
    const s = transition(gate.current, { type: "help" });
    gate.current = s;
    setState(s);
    save(s);
    setMessage(s.hints >= 3 ? selected.explain : selected.hint);
  }
  const filtered = questions.filter(
    (q) =>
      (all || !hidden[`textbook:measure:bank:${q.id}`]) &&
      `${q.text} ${q.page}`.includes(search),
  );
  const safePage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 12) - 1),
  );
  return (
    <div
      onPointerDown={() => (last.current = Date.now())}
      onKeyDown={() => (last.current = Date.now())}
    >
      <h1>测量练习与小讲堂</h1>
      <p>{questions.length}个练习入口 · 保留首次答案 · 开放调查不自动评分</p>
      {!saved && (
        <p role="alert">
          浏览器保存失败。请先
          <button onClick={() => download(memory.current)}>导出当前记录</button>
          再离开。
        </p>
      )}
      {selected ? (
        <section className="paper">
          <button onClick={() => setSelected(null)}>返回练习列表</button>
          <span className="badge">
            第{selected.page}页 · 原题或注明的教学练习
          </span>
          <h2>{selected.text}</h2>
          {selected.diagram === "line" && (
            <>
              <p>
                拖动端点画线。虚拟尺每一小格是1毫米，屏幕大小不代表实际尺寸。
              </p>
              <svg
                viewBox="0 0 600 140"
                role="img"
                aria-label={`已画${line}毫米`}
              >
                <rect width="600" height="140" rx="12" fill="#f7edcc" />
                {Array.from({ length: 101 }, (_, i) => (
                  <g key={i}>
                    <path
                      d={`M${50 + i * 5} 70v${i % 10 ? 12 : 25}`}
                      stroke="#314d4a"
                    />
                    {i % 10 === 0 && (
                      <text
                        x={50 + i * 5}
                        y="120"
                        textAnchor="middle"
                        fontSize="17"
                      >
                        {i}
                      </text>
                    )}
                  </g>
                ))}
                <path
                  d={`M50 45H${50 + line * 5}`}
                  stroke="#277f68"
                  strokeWidth="8"
                />
              </svg>
              <label>
                线段长（毫米）
                <input
                  type="range"
                  aria-label="画线长度"
                  min="0"
                  max="100"
                  value={line}
                  onChange={(e) => setLine(Number(e.target.value))}
                />
              </label>
              <p>已画{line}毫米。请在下方输入你认为正确的长度。</p>
            </>
          )}
          {selected.diagram === "rings" && state.hints >= 2 && (
            <svg
              viewBox="0 0 600 180"
              role="img"
              aria-label="三个铁环，两处连接，每处少两个厚度"
            >
              <g fill="none" stroke="#75928b" strokeWidth="18">
                <rect x="40" y="50" width="180" height="80" rx="40" />
                <rect x="190" y="50" width="180" height="80" rx="40" />
                <rect x="340" y="50" width="180" height="80" rx="40" />
              </g>
              <g stroke="#c7644e" strokeWidth="3">
                <path d="M190 35v110M220 35v110M340 35v110M370 35v110" />
              </g>
              <text x="300" y="170" textAnchor="middle" fontSize="18">
                红线间：每个连接处重叠两个厚度（示意图）
              </text>
            </svg>
          )}
          <p className="current-task">
            <strong>当前问题：</strong>
            {selected.text}
            <br />
            {selected.diagram === "line"
              ? "先拖动线段端点，再在这里填答案并点“检查答案”。"
              : selected.choices
                ? "请在这里选择你的答案。"
                : "请填写下面的答案，再点“检查答案”。"}
          </p>
          {selected.choices ? (
            <div className="actions">
              {selected.choices.map((ch, i) => (
                <button
                  key={ch}
                  disabled={state.correct}
                  onClick={() => submit(String(i))}
                >
                  {ch}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(value);
              }}
            >
              <label>
                我的答案
                <input
                  aria-label="练习答案"
                  type="number"
                  inputMode="decimal"
                  value={value}
                  disabled={state.correct}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <span>{selected.unit}</span>
              <button className="primary" disabled={state.correct}>
                检查答案
              </button>
            </form>
          )}
          <p role="status" className="feedback">
            {message}
          </p>
          {!state.correct && <button onClick={help}>给我一点提示</button>}
          {state.hints >= 3 && !state.correct && (
            <p>讲解后再自己输入一次，首次答题记录不会被覆盖。</p>
          )}
          {state.correct && (
            <button
              onClick={() =>
                select(
                  questions[
                    (questions.indexOf(selected) + 1) % questions.length
                  ],
                )
              }
            >
              下一道练习
            </button>
          )}
          <button onClick={onRecords}>查看学习记录</button>
        </section>
      ) : (
        <>
          <div className="paper">
            <label>
              搜索题目或页码
              <input
                aria-label="搜索测量练习"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <button onClick={() => setAll(!all)}>
              {all ? "只看显示的题目" : "查看全部（含隐藏）"}
            </button>
            <p>
              当前{filtered.length}题，第{safePage + 1}页
            </p>
          </div>
          <section className="measure-cards">
            {filtered.slice(safePage * 12, safePage * 12 + 12).map((q) => (
              <article className="paper" key={q.id}>
                <label className="visibility">
                  <input
                    type="checkbox"
                    checked={!hidden[`textbook:measure:bank:${q.id}`]}
                    onChange={(e) => {
                      const h = saveVisibility(
                        hidden,
                        [`textbook:measure:bank:${q.id}`],
                        e.target.checked,
                      );
                      if (h) setHidden(h);
                      else setSaved(false);
                    }}
                  />
                  显示这题
                </label>
                <button className="lesson-card" onClick={() => select(q)}>
                  <small>第{q.page}页</small>
                  <p>{q.text}</p>
                </button>
              </article>
            ))}
          </section>
          <div className="actions">
            <button
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              上一页
            </button>
            <button
              disabled={(safePage + 1) * 12 >= filtered.length}
              onClick={() => setPage(safePage + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
      <details className="paper">
        <summary>小讲堂与我的调查记录</summary>
        <h2>先说清采用什么标准</h2>
        <p>
          估计路程前可以量自己的步长；模拟中的步长和速度不是每个人的固定值。猜动物质量、调查篮球场、称自家物品，都没有脱离实际条件的唯一答案。
        </p>
        <p>
          教材采用的现代市制：1公斤＝1千克＝2斤，1斤＝10两＝500克。“半斤八两”采用旧制一斤16两。不要混用；其他地区的“斤、两”可能不同。
        </p>
        <p>
          测一捆铁丝可分段量后相加；也可测同规格铁丝一段的长度和质量，再根据整捆质量估算。后一方法需要铁丝粗细均匀并扣除包装，不能只凭线圈外观猜数。
        </p>
        <p>
          用200克盐袋掂量只能估计。浮盆替换需保持同一浮盆、同一水槽及水量，保持物品干燥且不漏水，回到同一水线后比较载荷。模拟不能替代真实称量。
        </p>
        <label>
          我采用的标准、过程和发现
          <textarea
            aria-label="我的调查发现"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            try {
              localStorage.setItem(
                "textbook-adventure.measurement.reflection.v1",
                note,
              );
              setSaved(true);
            } catch {
              setSaved(false);
            }
          }}
        >
          保存自查作品
        </button>
        <p>只保存到本浏览器，不自动评价文字内容，也不作为答题正确率。</p>
      </details>
    </div>
  );
}
