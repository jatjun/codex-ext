import { Alternative } from "./Alternative";
import { diagnose, fieldLabels } from "./teacher";
import { useEffect, useRef, useState } from "react";
import {
  lessons,
  easier,
  model,
  validate,
  story,
  instruction,
  reason,
  type Lesson,
  type Numbers,
} from "./model";
import { Scene } from "./Scene";
import "./mixed.css";
type RecordRow = {
  id: string;
  lesson: string;
  question: string;
  questionId?: string;
  completed?: boolean;
  phase: string;
  firstAnswer: string;
  firstCorrect: boolean;
  attempts: { answer: string; correct: boolean }[];
  hints: number;
  assisted: boolean;
  time: string;
};
const KEY = "textbook-adventure.mixed.v1";
function read(): RecordRow[] {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(x)
      ? x.filter(
          (r) => r && typeof r.id === "string" && Array.isArray(r.attempts),
        )
      : [];
  } catch {
    return [];
  }
}
export function Mixed() {
  const [lesson, setLesson] = useState<Lesson | null>(null),
    [n, setN] = useState<Numbers>({ a: 24, b: 13, c: 18 }),
    [step, setStep] = useState(0),
    [phase, setPhase] = useState<"learn" | "practice" | "transfer">("learn"),
    [gate, setGate] = useState<
      "intro" | "order" | "animate" | "calculate" | "reason" | "done"
    >("intro"),
    [p, setP] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [bars, setBars] = useState(false),
    [input, setInput] = useState(""),
    [feedback, setFeedback] = useState(""),
    [errors, setErrors] = useState(0),
    [hints, setHints] = useState(0),
    [assisted, setAssisted] = useState(false),
    [rows, setRows] = useState(read),
    [report, setReport] = useState(false),
    [storageError, setStorageError] = useState(false),
    [muted, setMuted] = useState(true);
  const needsSupport = useRef(false);
  const epoch = useRef(0),
    attemptId = useRef("");
  const m = lesson ? model(lesson.id, n) : null;
  function quiet() {
    epoch.current++;
    window.speechSynthesis?.cancel();
  }
  function say(text: string) {
    quiet();
    if (!muted && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      speechSynthesis.resume();
      speechSynthesis.speak(u);
    }
  }
  function fresh() {
    setErrors(0);
    setHints(0);
    setAssisted(false);
    setInput("");
    setFeedback("");
    attemptId.current = `${Date.now()}-${Math.random()}`;
  }
  function open(l: Lesson) {
    needsSupport.current = false;
    quiet();
    setPlaying(false);
    setLesson(l);
    setN({ ...l.seed });
    setStep(0);
    setPhase("learn");
    setGate("intro");
    setP(0);
    setReport(false);
    fresh();
  }
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () => setP((v) => Math.min(1, v + 0.025 * speed)),
      100,
    );
    return () => clearInterval(t);
  }, [playing, speed]);
  useEffect(() => {
    if (p === 1 && playing) {
      if (phase !== "learn" && step === 0) {
        setStep(1);
        setP(0);
        return;
      }
      setPlaying(false);
      setGate("calculate");
      setFeedback("操作完成。请用数字说出现在的数量。");
    }
  }, [p, playing, phase, step]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setPlaying(false);
        window.speechSynthesis?.pause();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.speechSynthesis?.cancel();
    };
  }, []);
  function record(answer: string, correct: boolean) {
    const prev = rows.find((r) => r.id === attemptId.current + "-" + gate);
    const row: RecordRow = {
      id: attemptId.current + "-" + gate,
      questionId: `${lesson!.id}-${phase}-${step}-${gate}`,
      completed: correct && gate === "reason" && phase === "transfer",
      lesson: lesson!.id,
      question:
        phase === "learn"
          ? `${m!.expression}，第${step + 1}步`
          : story(lesson!.id, n, phase === "transfer"),
      phase,
      firstAnswer: prev?.firstAnswer ?? answer,
      firstCorrect: prev?.firstCorrect ?? correct,
      attempts: [...(prev?.attempts || []), { answer, correct }],
      hints: hints + (correct ? 0 : 1),
      assisted: assisted || errors > 0 || !correct,
      time: prev?.time || new Date().toISOString(),
    };
    const next = [...rows.filter((r) => r.id !== row.id), row];
    setRows(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  }
  function wrong(type: "order" | "number" | "reason") {
    needsSupport.current = true;
    const e = errors + 1;
    setErrors(e);
    setHints(hints + 1);
    setAssisted(true);
    const text =
      e === 1
        ? type === "order"
          ? "先问自己：这个动作让数量增加、减少，还是把相同的几组合起来？"
          : type === "reason"
            ? "想一想每个数字说的是谁，问题最后要的是什么。"
            : diagnose(
                lesson!.id,
                n,
                Number(input),
                phase !== "learn" || step === 1,
              ).text
        : e === 2
          ? "我们换成图形再看。先找已知总数，再找变化的部分，最后数剩下或分成的组。"
          : `一起验证：${m!.firstExpression}＝${m!.first}；${m!.first}${m!.op2}${n.c}＝${m!.total}。现在再尝试，并完成换数字练习。`;
    setFeedback(text);
    say(text);
    if (e >= 2) {
      setBars(e === 2);
      setP(0);
      setGate("animate");
      setPlaying(true);
    }
  }
  function submit() {
    if (!input.trim() || !m) return;
    const expected =
      phase === "learn" ? (step === 0 ? m.first : m.total) : m.total;
    const correct = Number(input) === expected;
    record(input, correct);
    if (!correct) {
      wrong("number");
      return;
    }
    quiet();
    setFeedback("这个数量找对了！再说说为什么这样算。");
    if (phase === "learn" && step === 0) {
      setStep(1);
      setGate("order");
      setP(0);
      fresh();
    } else setGate("reason");
  }
  function exercise(next: "practice" | "transfer") {
    quiet();
    setPlaying(false);
    setPhase(next);
    setN({
      ...(next === "practice" && needsSupport.current
        ? easier[lesson!.id]
        : lesson![next]),
    });
    setStep(0);
    setP(0);
    setGate("calculate");
    fresh();
    if (next === "practice" && needsSupport.current)
      setFeedback("我们先用小一些的数字独立试一题，再回到换情境挑战。");
  }
  return (
    <div className="mixed">
      <header>
        <a href="../">学习小花园</a>
        <a href="?">观察物体</a>
        <a href="?unit=arithmetic">分步计算与应用题练习</a>
        <a href="?unit=explore">购票、找错与方法探索</a>
        <button
          onClick={() => {
            quiet();
            setPlaying(false);
            setLesson(null);
            setReport(false);
          }}
        >
          混合运算首页
        </button>
        <button
          onClick={() => {
            quiet();
            setPlaying(false);
            setReport(true);
          }}
        >
          学习记录
        </button>
      </header>
      <main>
        {report ? (
          <section className="paper">
            <h1>混合运算学习记录</h1>
            <p>首次作答与后续尝试分别保留。记录只在当前浏览器，不自动同步。</p>
            <button
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(rows, null, 2)], {
                    type: "application/json",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "mixed-learning.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              导出 JSON
            </button>
            {rows.map((r) => (
              <article key={r.id}>
                <h3>{r.question}</h3>
                <p>
                  {r.completed ? "已完成本课迁移验证 · " : ""}首次：
                  {r.firstAnswer}（{r.firstCorrect ? "正确" : "需检查"}）· 尝试
                  {r.attempts.length}次 ·{" "}
                  {r.assisted ? "使用过帮助" : "未使用帮助"} ·{" "}
                  {r.phase === "learn"
                    ? "分步学习"
                    : r.phase === "practice"
                      ? "独立练习"
                      : "迁移练习"}
                </p>
              </article>
            ))}
          </section>
        ) : !lesson ? (
          <>
            <div className="hero">
              <p>三年级 · 第6～19页知识主线</p>
              <h1>
                让每一步，
                <br />
                都有看得见的理由。
              </h1>
              <p>先理解动作，再决定怎么算。六个工坊带你探索混合运算。</p>
            </div>
            <div className="cards">
              {lessons.map((l) => (
                <button className="course" key={l.id} onClick={() => open(l)}>
                  <div className="preview">{l.icon}</div>
                  <h2>{l.title}</h2>
                  <p>{l.purpose}</p>
                  <small>教材第{l.page}页核心例题 · 可改数字</small>
                </button>
              ))}
            </div>
            <p>
              六个工坊完成后，可进入分步计算与应用题练习。教材开放编题、购票方案等拓展暂未全部收录。
            </p>
          </>
        ) : (
          <>
            <h1>
              {lesson.icon} {lesson.title}
            </h1>
            <div className="paper">
              <b>教材原题条件</b>
              <p>{story(lesson.id, lesson.seed)}</p>
              <p>
                当前
                {phase === "learn"
                  ? "教学题"
                  : phase === "practice"
                    ? "独立练习"
                    : "换情境迁移"}
                ：{story(lesson.id, n, phase === "transfer")}
              </p>
              {gate === "intro" && (
                <>
                  <div className="actions">
                    {(["a", "b", "c"] as const).map((k, i) => (
                      <label key={k}>
                        {fieldLabels[lesson.id][i]}
                        <input
                          aria-label={`条件${i + 1}`}
                          type="number"
                          value={n[k]}
                          onChange={(e) =>
                            setN({ ...n, [k]: Number(e.target.value) })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p>{validate(lesson.id, n) || lesson.purpose}</p>
                  <button
                    className="primary"
                    disabled={!!validate(lesson.id, n)}
                    onClick={() => {
                      setGate("order");
                      fresh();
                    }}
                  >
                    开始：先想第一步
                  </button>
                </>
              )}
            </div>
            {gate !== "intro" && (
              <div className="workspace">
                <section className="paper">
                  {phase === "learn" || assisted ? (
                    <>
                      <Scene
                        kind={lesson.id}
                        n={n}
                        step={step}
                        progress={p}
                        bars={bars}
                        variant={phase === "transfer"}
                      />
                      <p>{instruction(lesson.id, step, n)}</p>
                      <div className="actions">
                        <button onClick={() => setBars(!bars)}>
                          {bars ? "换成实物" : "换成数量条"}
                        </button>
                        <button
                          onClick={() => {
                            setPlaying(false);
                            window.speechSynthesis?.pause();
                          }}
                        >
                          暂停
                        </button>
                        <button
                          disabled={gate !== "animate"}
                          onClick={() => {
                            quiet();
                            setPlaying(true);
                          }}
                        >
                          继续动画
                        </button>
                        <button
                          disabled={gate !== "animate"}
                          onClick={() => {
                            setPlaying(false);
                            const next = Math.min(1, p + 0.1);
                            setP(next);
                            if (next === 1) setGate("calculate");
                          }}
                        >
                          亲手移动一批
                        </button>
                        <button
                          onClick={() => {
                            setAssisted(true);
                            setP(0);
                            setGate("animate");
                            setPlaying(true);
                          }}
                        >
                          重新演示
                        </button>
                        <label>
                          速度
                          <select
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                          >
                            <option value=".5">慢慢看</option>
                            <option value="1">正常</option>
                            <option value="1.5">稍快</option>
                          </select>
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="independent">
                      <h2>先靠自己试一试</h2>
                      <p>画一画，或在心里把动作分开。需要帮助时再打开模型。</p>
                    </div>
                  )}
                </section>
                <section className="paper">
                  <p>
                    {phase === "learn"
                      ? `第${step + 1}步：先想动作，再计算`
                      : "先独立列式和计算"}
                  </p>
                  {gate === "order" ? (
                    <>
                      <h2>这一步该用什么运算？</h2>
                      <p>
                        {step === 0
                          ? "为了回答最后的问题，先求哪个数量？"
                          : "用上一步求出的数量，接着做什么？"}
                      </p>
                      <div className="answers">
                        {["+", "−", "×", "÷"].map((op) => (
                          <button
                            key={op}
                            onClick={() => {
                              const correct =
                                op === (step === 0 ? m!.op1 : m!.op2);
                              record(op, correct);
                              if (correct) {
                                setGate("animate");
                                setP(0);
                                setFeedback(
                                  "动作选对了。点击“继续动画”，也可以亲手移动一批。",
                                );
                                fresh();
                              } else wrong("order");
                            }}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : gate === "reason" ? (
                    <>
                      <h2>为什么这样算？</h2>
                      {[
                        reason(lesson.id),
                        "因为题目出现的数字都要直接加起来",
                        "不管数量表示什么，都从左边开始算",
                      ].map((r, i) => (
                        <button
                          className="reason"
                          key={r}
                          onClick={() => {
                            record(r, i === 0);
                            if (i === 0) {
                              setGate("done");
                              setFeedback("你把动作和算式联系起来了。");
                            } else wrong("reason");
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </>
                  ) : gate === "done" ? (
                    <>
                      <h2>这一次的发现</h2>
                      <p>{reason(lesson.id)}</p>
                      <p>
                        {m!.expression}＝{m!.total}（
                        {phase === "transfer"
                          ? lesson.id === "bus" || lesson.id === "paper"
                            ? "本"
                            : lesson.id === "flowers" || lesson.id === "yogurt"
                              ? "块"
                              : "盒"
                          : lesson.unit}
                        ）
                      </p>
                      {gate === "done" &&
                        (lesson.id === "paper" || lesson.id === "beads") && (
                          <Alternative kind={lesson.id} n={n} />
                        )}
                      {m!.alternative && (
                        <p>
                          另一种方法：{m!.alternative}＝{m!.total}
                          。想想它先求的是哪个数量。
                        </p>
                      )}
                      {phase === "learn" ? (
                        <button
                          className="primary"
                          onClick={() => exercise("practice")}
                        >
                          独立练习
                        </button>
                      ) : phase === "practice" ? (
                        <button
                          className="primary"
                          onClick={() => exercise("transfer")}
                        >
                          换情境再试
                        </button>
                      ) : (
                        <button onClick={() => setLesson(null)}>
                          完成本课，选择下一课
                        </button>
                      )}
                    </>
                  ) : gate === "calculate" ? (
                    <>
                      <h2>
                        {phase === "learn"
                          ? step === 0
                            ? "中间数量是多少？"
                            : "最后的结果是多少？"
                          : "你算出的结果是多少？"}
                      </h2>
                      <input
                        aria-label="我的答案"
                        type="number"
                        inputMode="numeric"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                      />
                      <button className="primary" onClick={submit}>
                        检查我的想法
                      </button>
                    </>
                  ) : (
                    <h2>观察变化，也可以暂停后亲手操作。</h2>
                  )}
                  <p aria-live="polite" className="feedback">
                    {feedback}
                  </p>
                  {gate !== "done" && (
                    <button
                      onClick={() =>
                        wrong(gate === "order" ? "order" : "number")
                      }
                    >
                      我还不会，换个方法帮我
                    </button>
                  )}
                  <div className="actions">
                    <button
                      onClick={() => {
                        quiet();
                        setMuted(!muted);
                      }}
                    >
                      {muted ? "开启语音" : "静音"}
                    </button>
                    <button
                      onClick={() => {
                        setPlaying(false);
                        say(feedback || instruction(lesson.id, step, n));
                      }}
                    >
                      朗读当前提示
                    </button>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
        {storageError && (
          <p role="alert">记录未能写入浏览器，请导出JSON保存当前结果。</p>
        )}
      </main>
    </div>
  );
}
