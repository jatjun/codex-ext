import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Solid } from "./animation/Solid";
import {
  original,
  transfer,
  camera,
  check,
  faces,
  type Face,
} from "./math-engine/space";
import { lessons, prompt, type Kind, type Phase } from "./lessons/catalog";
import {
  feedback,
  canAdvance,
  stageAfterAnswer,
  stageLabels,
  type Stage,
} from "./teacher/logic";
import { read, write, result, type Row } from "./progress/store";
import "./style.css";
function App() {
  const [kind, setKind] = useState<Kind | null>(null),
    [report, setReport] = useState(false),
    [stage, setStage] = useState<Stage>("INTRO"),
    [step, setStep] = useState(0),
    [phase, setPhase] = useState<Phase>("guided"),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [muted, setMuted] = useState(true),
    [flat, setFlat] = useState(0),
    [angles, setAngles] = useState<[number, number]>([-22, -28]),
    [value, setValue] = useState(""),
    [message, setMessage] = useState(""),
    [attempts, setAttempts] = useState(0),
    [hints, setHints] = useState(0),
    [replays, setReplays] = useState(0),
    [rows, setRows] = useState(read),
    [storageError, setStorageError] = useState(false),
    [selected, setSelected] = useState<Face>("前"),
    [passed, setPassed] = useState(false),
    [speaking, setSpeaking] = useState(false);
  const pausedAnimations = useRef<Animation[]>([]);
  const id = useRef(""),
    active = useRef(0),
    tick = useRef(0),
    generation = useRef(0),
    explanation = useRef(false),
    assist = useRef(false),
    gate = useRef(false);
  const labels = phase === "transfer" ? transfer : original;
  const narration = kind ? lessons[kind].steps[step] : "";
  function cancel() {
    pausedAnimations.current.forEach((a) => a.play());
    pausedAnimations.current = [];
    generation.current++;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  function stop() {
    generation.current++;
    setPlaying(false);
    pausedAnimations.current = [
      ...new Set([
        ...pausedAnimations.current,
        ...document.getAnimations().filter((a) => a.playState === "running"),
      ]),
    ];
    pausedAnimations.current.forEach((a) => a.pause());
    window.speechSynthesis?.pause();
  }
  function resetQuestion(p: Phase) {
    setReplays(0);
    id.current =
      globalThis.crypto?.randomUUID?.() ??
      `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    active.current = 0;
    setPhase(p);
    setAttempts(0);
    setHints(0);
    setValue("");
    setMessage("");
    setPassed(false);
    explanation.current = false;
    assist.current = false;
  }
  function open(k: Kind) {
    cancel();
    setKind(k);
    setReport(false);
    setStage("INTRO");
    setStep(0);
    setFlat(0);
    setAngles([-22, -28]);
    setSelected("前");
    setPlaying(false);
    setReplays(0);
    gate.current = false;
    resetQuestion("guided");
  }
  function enterStep(s: number) {
    cancel();
    setStep(s);
    setStage(s === 2 ? "QUESTION" : "OBSERVE");
    if (s === 2) {
      gate.current = true;
      setPlaying(false);
    }
    if (kind === "view") {
      setAngles(
        s === 0
          ? [-22, -28]
          : s === 1 || s === 2
            ? camera.前
            : s === 3
              ? camera.后
              : camera.上,
      );
      setSelected(s === 3 ? "后" : s === 4 ? "上" : "前");
    } else {
      setFlat(s === 0 || s === 4 ? 0 : s === 1 ? 0.5 : 1);
      setAngles(s === 0 || s === 4 ? [-22, -28] : [0, 0]);
    }
  }
  useEffect(() => {
    if (
      !playing ||
      !kind ||
      speaking ||
      stage === "QUESTION" ||
      stage.startsWith("HINT") ||
      stage === "EXPLAIN" ||
      document.hidden
    )
      return;
    const t = setTimeout(
      () => {
        if (step < 4) enterStep(step + 1);
        else setPlaying(false);
      },
      Math.max(1600 / speed, 2200 / speed),
    );
    return () => clearTimeout(t);
  }, [playing, kind, step, speed, stage, speaking]);
  useEffect(() => {
    if (!kind || muted || !playing || !window.speechSynthesis) return;
    const g = generation.current;
    const u = new SpeechSynthesisUtterance(narration);
    u.lang = "zh-CN";
    u.rate = speed;
    setSpeaking(true);
    u.onend = u.onerror = () => {
      if (g === generation.current) setSpeaking(false);
    };
    speechSynthesis.resume();
    speechSynthesis.speak(u);
    const fallback = setTimeout(() => {
      if (g === generation.current) {
        speechSynthesis.cancel();
        setSpeaking(false);
      }
    }, 15000);
    return () => {
      clearTimeout(fallback);
      speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [step, muted, playing, kind, replays]);
  useEffect(() => {
    function hide() {
      if (document.hidden) stop();
    }
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      if (
        kind &&
        !report &&
        !document.hidden &&
        stage !== "COMPLETE" &&
        tick.current
      )
        active.current += (now - tick.current) / 1000;
      tick.current = now;
    }, 500);
    return () => clearInterval(t);
  }, [kind, report, stage]);
  function save(answer: string, correct: boolean) {
    if (!kind) return;
    const old = rows.find((r) => r.id === id.current);
    const r: Row = {
      id: id.current,
      lesson: kind,
      question: prompt(kind, phase),
      questionId: `${kind}-${phase}`,
      phase,
      time: old?.time || new Date().toISOString(),
      firstAnswer: old?.firstAnswer ?? answer,
      firstCorrect: old?.firstCorrect ?? correct,
      attempts: (old?.attempts || 0) + 1,
      hints: hints + (correct ? 0 : 1),
      replays,
      finalCorrect: correct,
      independent: correct && !old && !assist.current,
      explanation: explanation.current || (!correct && attempts >= 2),
      seconds: Math.round(active.current),
      history: [...(old?.history || []), { answer, correct }],
    };
    const next = [...rows.filter((x) => x.id !== id.current), r];
    setRows(next);
    setStorageError(!write(next));
  }
  function submit() {
    if (!kind || !value || passed) return;
    const x = check(kind, phase, value, labels);
    const n = attempts + 1;
    setAttempts(n);
    save(value, x.correct);
    if (x.correct) {
      setPassed(true);
      setMessage(
        `你找到了！${x.target}面是${x.expected}。请说一说你是怎样确定的。`,
      );
    } else {
      assist.current = true;
      setHints(hints + 1);
      setStage(stageAfterAnswer(n));
      setMessage(feedback(kind, n, value));
      if (n === 2) {
        setAngles(kind === "view" ? camera[x.target] : [-22, -28]);
        if (kind === "view") setSelected(x.target);
        else setFlat(0.35);
      }
      if (n >= 3) {
        explanation.current = true;
        setAngles(camera[x.target]);
        if (kind === "view") setSelected(x.target);
        setFlat(0);
        setMessage(
          feedback(kind, n, value) + ` 验证：${x.target}面是${x.expected}。`,
        );
      }
    }
  }
  function help() {
    assist.current = true;
    setHints(hints + 1);
    setStage(hints === 0 ? "HINT_1" : "HINT_2");
    setMessage(feedback(kind!, Math.min(2, hints + 1), value || "这个面"));
    if (hints >= 1) {
      const x = check(kind!, phase, value, labels);
      setAngles(kind === "view" ? camera[x.target] : [-22, -28]);
      if (kind === "view") setSelected(x.target);
      else setFlat(0.35);
    }
  }
  function nextPractice() {
    cancel();
    setPlaying(false);
    resetQuestion(phase === "guided" ? "practice" : "transfer");
    setStage(phase === "guided" ? "RETRY" : "TRANSFER");
    setAngles([-22, -28]);
    setFlat(0);
  }
  function navigateHome() {
    cancel();
    setPlaying(false);
    setKind(null);
    setReport(false);
  }
  return (
    <>
      <header>
        <a href="../">✳ 学习小花园</a>
        <button onClick={navigateHome}>课程首页</button>
        <button
          onClick={() => {
            cancel();
            setPlaying(false);
            setReport(true);
          }}
        >
          学习记录
        </button>
      </header>
      <main>
        {!kind && !report ? (
          <>
            <div className="hero">
              <p className="eyebrow">三年级 · 观察物体 · 教材动画 V1</p>
              <h1>
                换个角度，
                <br />
                <em>发现数学的样子。</em>
              </h1>
              <p>先猜一猜，再动手验证。你的每一次发现，都有道理。</p>
              <span className="badge">
                原创 3D 纸盒 · 无需登录 · 无外部图片
              </span>
            </div>
            <section className="cards">
              {(["view", "net"] as Kind[]).map((k, i) => (
                <button className="course" key={k} onClick={() => open(k)}>
                  <span className={"preview p" + i}>
                    {i === 0 ? "◈" : "▱"}
                    <i>{i === 0 ? "1 · 3 · 5" : "展开 ↔ 折回"}</i>
                  </span>
                  <small>{lessons[k].tag}</small>
                  <h2>{lessons[k].title}</h2>
                  <p>{lessons[k].intro}</p>
                  <strong>开始探索 →</strong>
                </button>
              ))}
            </section>
            <p className="footnote">
              仅依据本次截图第1～5页。教材人物插画和整页截图不会出现在这里。
            </p>
          </>
        ) : null}
        {report ? (
          <section className="paper">
            <h1>我的探索记录</h1>
            <p>
              “看过演示”不等于独立掌握。记录仅保存在这个浏览器，不会自动同步到其他手机。
            </p>
            <button
              onClick={() => {
                const b = new Blob(
                  [JSON.stringify({ version: 1, records: rows }, null, 2)],
                  { type: "application/json" },
                );
                const u = URL.createObjectURL(b);
                const a = document.createElement("a");
                a.href = u;
                a.download = "textbook-progress.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(u), 1000);
              }}
            >
              导出 JSON
            </button>
            {rows.length === 0 ? (
              <p>还没有答题记录。去试一试吧。</p>
            ) : (
              rows.map((r) => (
                <article className="record" key={r.id}>
                  <b>{r.question}</b>
                  <p>
                    {result(r)} · 首次答案 {r.firstAnswer}（
                    {r.firstCorrect ? "正确" : "需检查"}）· 尝试 {r.attempts} 次
                    · 提示 {r.hints} 次 · 重播 {r.replays} 次 · {r.seconds} 秒
                  </p>
                  <small>
                    {new Date(r.time).toLocaleString()} · {r.phase}
                  </small>
                </article>
              ))
            )}
          </section>
        ) : null}
        {kind && !report ? (
          <>
            <div className="lesson-heading">
              <p className="eyebrow">{lessons[kind].tag}</p>
              <h1>{lessons[kind].title}</h1>
              <p>{lessons[kind].source}</p>
            </div>
            <div
              className="workspace"
              style={{ "--duration": `${1.4 / speed}s` } as React.CSSProperties}
            >
              <section className="stage paper">
                <div className="stage-top">
                  <span className="badge">
                    {stageLabels[stage]} ·{" "}
                    {phase === "guided"
                      ? "一起探索"
                      : phase === "practice"
                        ? "独立练习"
                        : "换题迁移"}
                  </span>
                  <span>六个面始终都在</span>
                </div>
                {kind === "view" ? (
                  <div className="observer-map">
                    <svg
                      viewBox="0 0 240 112"
                      role="img"
                      aria-label={`观察机器人在${selected}面`}
                    >
                      <rect
                        x="103"
                        y="37"
                        width="34"
                        height="34"
                        rx="6"
                        fill="#ffc65f"
                      />
                      <text x="120" y="59" textAnchor="middle" fontSize="12">
                        物体
                      </text>
                      <text x="120" y="13" textAnchor="middle" fontSize="12">
                        后
                      </text>
                      <text x="120" y="110" textAnchor="middle" fontSize="12">
                        前
                      </text>
                      <text x="57" y="59" fontSize="12">
                        左
                      </text>
                      <text x="173" y="59" fontSize="12">
                        右
                      </text>
                      <g
                        className="observer"
                        style={{
                          transform: `translate(${selected === "右" ? 162 : selected === "左" ? 78 : 120}px,${selected === "后" ? 26 : selected === "前" ? 85 : 54}px)`,
                        }}
                      >
                        <circle r="10" fill="#267d70" />
                        <circle cx="-3" cy="-2" r="2" fill="white" />
                        <circle cx="3" cy="-2" r="2" fill="white" />
                      </g>
                    </svg>
                    <small>
                      俯视位置图 · 物体固定，机器人换位置
                      {selected === "上"
                        ? "（升到上方）"
                        : selected === "下"
                          ? "（移到下方）"
                          : ""}
                    </small>
                  </div>
                ) : null}
                <Solid
                  labels={labels}
                  angles={angles}
                  flat={flat}
                  net={kind === "net"}
                  onFace={(f) => {
                    setSelected(f);
                    if (phase === "guided" && !passed && stage !== "INTRO") {
                      setValue(String(labels[f]));
                    }
                    setMessage(
                      `你点了${f}面，数字${labels[f]}。${phase !== "guided" ? "这是观察辅助，本题不再计为独立完成。" : ""}`,
                    );
                    if (phase !== "guided") assist.current = true;
                  }}
                />
                {kind === "view" ? (
                  <div className="directions" aria-label="观察方向">
                    {faces.map((f) => (
                      <button
                        key={f}
                        aria-pressed={selected === f}
                        onClick={() => {
                          cancel();
                          setPlaying(false);
                          setAngles(camera[f]);
                          setSelected(f);
                          if (phase !== "guided") assist.current = true;
                        }}
                      >
                        {f === "上"
                          ? "从上面看"
                          : f === "下"
                            ? "从下面看"
                            : `到${f}面看`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <label className="slider">
                    折好{" "}
                    <input
                      aria-label="展开程度"
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(flat * 100)}
                      onChange={(e) => {
                        cancel();
                        setPlaying(false);
                        setFlat(Number(e.target.value) / 100);
                        setAngles([0, 0]);
                        if (phase !== "guided") assist.current = true;
                      }}
                    />{" "}
                    展开 {Math.round(flat * 100)}%
                  </label>
                )}
                <p className="caption">
                  {kind === "view"
                    ? `当前观察：${selected}面。视图按正对该面的方向展示。`
                    : "拖动滑块，看六个面沿连接边展开；数字跟着面一起移动。"}
                </p>
              </section>
              <section className="teaching paper">
                <p className="eyebrow">观察 → 预测 → 操作 → 说出道理</p>
                {stage === "INTRO" ? (
                  <>
                    <h2>准备好了吗？</h2>
                    <p>{lessons[kind].intro}</p>
                    <p>
                      这个模型相对两个面上的数字之和为7。先观察，再用这个条件检查。
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        enterStep(0);
                        setPlaying(true);
                      }}
                    >
                      开始探索
                    </button>
                  </>
                ) : (
                  <>
                    <h2>
                      {phase === "guided"
                        ? `第 ${step + 1} 步 / 5`
                        : "独立挑战"}
                    </h2>
                    <p className="narration" aria-live="polite">
                      {phase === "guided"
                        ? narration
                        : "先独立预测，再用模型验证；需要观察帮助也没关系。"}
                    </p>
                    {(gate.current || phase !== "guided") &&
                    stage !== "COMPLETE" ? (
                      <div className="question">
                        <h3>{prompt(kind, phase)}</h3>
                        <div className="answers">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <button
                              key={n}
                              aria-pressed={value === String(n)}
                              onClick={() => setValue(String(n))}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <label>
                          我的答案{" "}
                          <input
                            aria-label="我的答案"
                            inputMode="numeric"
                            type="number"
                            min="1"
                            max="6"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                          />
                        </label>
                        <div className="actions">
                          <button
                            className="primary"
                            disabled={!value || passed}
                            onClick={submit}
                          >
                            检查我的想法
                          </button>
                          <button disabled={passed} onClick={help}>
                            我需要一点帮助
                          </button>
                        </div>
                        <p aria-live="polite" className="feedback">
                          {message}
                        </p>
                        {passed ? (
                          <>
                            {phase === "transfer" ? (
                              <button
                                className="primary"
                                onClick={() => setStage("COMPLETE")}
                              >
                                完成本课
                              </button>
                            ) : (
                              <button
                                className="primary"
                                onClick={nextPractice}
                              >
                                {phase === "guided"
                                  ? "做一道独立练习"
                                  : "换数字再试一次"}
                              </button>
                            )}
                          </>
                        ) : attempts >= 3 ? (
                          <button
                            onClick={() => {
                              resetQuestion(
                                phase === "transfer" ? "practice" : "transfer",
                              );
                              setStage("RETRY");
                            }}
                          >
                            换一道相似题重新尝试
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {stage === "COMPLETE" ? (
                      <>
                        <h2>今天的发现</h2>
                        <p>
                          {kind === "view"
                            ? "物体不变，观察位置不同，看到的面可能不同。"
                            : "展开图与纸盒都有六个面。相对面不共边，折回后面对面。"}
                        </p>
                        <p>试着用自己的话讲给家人听。</p>
                        <button onClick={navigateHome}>探索另一课</button>
                      </>
                    ) : null}
                  </>
                )}
              </section>
            </div>
            <section className="controls paper">
              <button
                disabled={stage === "INTRO" || stage === "COMPLETE"}
                onClick={stop}
              >
                暂停
              </button>
              <button
                disabled={stage === "INTRO" || stage === "COMPLETE"}
                onClick={() => {
                  pausedAnimations.current.forEach((a) => a.play());
                  pausedAnimations.current = [];
                  if (!gate.current || passed) {
                    setPlaying(true);
                    setStage("OBSERVE");
                  } else setMessage("先回答关键问题，或点击“我需要一点帮助”。");
                }}
              >
                继续
              </button>
              <button
                disabled={stage === "INTRO"}
                onClick={() => {
                  setReplays(replays + 1);
                  if (phase !== "guided") assist.current = true;
                  gate.current = false;
                  enterStep(0);
                  setPlaying(true);
                }}
              >
                重播动画
              </button>
              <button
                disabled={step === 0 || stage === "INTRO"}
                onClick={() => {
                  setPlaying(false);
                  enterStep(step - 1);
                }}
              >
                上一步
              </button>
              <button
                disabled={stage === "INTRO" || !canAdvance(step, passed)}
                onClick={() => {
                  setPlaying(false);
                  enterStep(step + 1);
                }}
              >
                下一步
              </button>
              <label>
                速度{" "}
                <select
                  aria-label="播放速度"
                  value={speed}
                  onChange={(e) => {
                    cancel();
                    setPlaying(false);
                    setSpeed(Number(e.target.value));
                  }}
                >
                  <option value="0.6">慢慢看</option>
                  <option value="1">正常</option>
                  <option value="1.5">稍快</option>
                </select>
              </label>
              <button
                onClick={() => {
                  cancel();
                  setMuted(!muted);
                }}
              >
                {" "}
                {muted ? "开启语音" : "静音"}
              </button>
              <button
                onClick={() => {
                  cancel();
                  setPlaying(false);
                  if (window.speechSynthesis) {
                    const u = new SpeechSynthesisUtterance(narration);
                    u.lang = "zh-CN";
                    speechSynthesis.resume();
                    speechSynthesis.speak(u);
                  } else setMessage("此浏览器不支持语音，请阅读当前步骤文字。");
                }}
              >
                重听当前讲解
              </button>
              <span>
                {window.speechSynthesis
                  ? "语音需浏览器提供中文声音；默认静音，可随时开启。"
                  : "当前使用文字教学。"}
              </span>
            </section>
          </>
        ) : null}
        {storageError ? (
          <p role="alert">
            浏览器未能保存记录，请导出 JSON 备份。不要关闭当前页面。
          </p>
        ) : null}
      </main>
      <footer>空间探索站 · 受控教学规则，无大模型连接 · 教材动画原型</footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
