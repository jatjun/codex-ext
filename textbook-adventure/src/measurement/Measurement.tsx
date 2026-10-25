import { useEffect, useRef, useState } from "react";
import {
  readVisibility,
  saveVisibility,
} from "../../../learning-home/visibility-model.js";
import {
  lessons,
  steps,
  validate,
  problem,
  routeNames,
  type Lesson,
  type N,
} from "./model";
import { Scene } from "./Scene";
import {
  initial,
  transition,
  readRows,
  updateRow,
  writeRows,
  download,
  statistics,
  type Row,
  type Teaching,
} from "./teaching";
import { useMotion } from "./useMotion";
import { Practice } from "./Practice";
import "./measurement.css";
type Phase = "guided" | "practice" | "transfer";
export function Measurement() {
  const [lesson, setLesson] = useState<Lesson | null>(null),
    [n, setN] = useState<N>({ a: 0, b: 0, c: 0 }),
    [phase, setPhase] = useState<Phase>("guided"),
    [step, setStep] = useState(0),
    [state, setState] = useState<Teaching>(initial),
    [value, setValue] = useState(""),
    [message, setMessage] = useState(""),
    [route, setRoute] = useState(0),
    [reasonPassed, setReasonPassed] = useState(false),
    [showHelp, setShowHelp] = useState(false),
    [mode, setMode] = useState<"home" | "records" | "bank">("home");
  const [rows, setRows] = useState(readRows),
    [storageError, setStorageError] = useState(false),
    [hidden, setHidden] = useState(readVisibility),
    [showHidden, setShowHidden] = useState(false),
    [muted, setMuted] = useState(true),
    [speaking, setSpeaking] = useState(false),
    [voiceError, setVoiceError] = useState("");
  const [wrongOnly, setWrongOnly] = useState(false);
  const [zoom, setZoom] = useState(false);
  const motion = useMotion();
  const session = useRef(""),
    clock = useRef(0),
    lastAction = useRef(Date.now()),
    replays = useRef(0),
    support = useRef(false),
    rowsRef = useRef(rows),
    speechId = useRef(0),
    speechPaused = useRef(false),
    gate = useRef(state),
    reasonGate = useRef(false);
  const sourceStep = lesson
    ? steps(lesson.id, n)[phase === "guided" ? step : 2]
    : null;
  const current =
    sourceStep && lesson?.id === "boat" && phase !== "guided"
      ? {
          ...sourceStep,
          unit: "克",
          text: sourceStep.text.replaceAll("千克", "克"),
          explain: sourceStep.explain.replaceAll("千克", "克"),
        }
      : sourceStep;
  const question =
    lesson && current
      ? phase === "guided"
        ? current.question
        : problem(lesson.id, n)
      : "";
  function setTeaching(s: Teaching) {
    gate.current = s;
    setState(s);
  }
  function silence() {
    speechId.current++;
    window.speechSynthesis?.cancel();
    speechPaused.current = false;
    setSpeaking(false);
  }
  function stop() {
    motion.pause();
    silence();
  }
  useEffect(
    () => () => {
      speechId.current++;
      window.speechSynthesis?.cancel();
    },
    [],
  );
  useEffect(() => {
    if (!lesson || mode !== "home") return;
    const t = setInterval(() => {
      if (!document.hidden && Date.now() - lastAction.current < 60000)
        clock.current++;
    }, 1000);
    return () => clearInterval(t);
  }, [lesson, mode]);
  useEffect(() => {
    if (motion.p >= 1 && !speaking && gate.current.stage === "OBSERVE") {
      setTeaching(transition(gate.current, { type: "observed" }));
      setMessage("本步观察完成。现在请说出你的想法。");
    }
  }, [motion.p, speaking]);
  function persist(next: Row[]) {
    rowsRef.current = next;
    setRows(next);
    if (!writeRows(next)) setStorageError(true);
  }
  function record(
    s: Teaching,
    answer?: string,
    correct?: boolean,
    reason = false,
    usedHint = false,
  ) {
    if (!lesson || !current) return;
    const qid = `${phase}-${phase === "guided" ? step : 2}${reason ? "-reason" : ""}`;
    const previous = rowsRef.current.find(
      (r) => r.id === `${session.current}-${qid}`,
    );
    const row: Row = {
      id: `${session.current}-${qid}`,
      lesson: lesson.id,
      questionId: qid,
      question: reason ? "为什么这样做？" : question,
      phase,
      started: new Date().toISOString(),
      firstAnswer: null,
      firstCorrect: null,
      attempts: [],
      hints: (previous?.hints ?? 0) + (usedHint ? 1 : 0),
      replays: replays.current,
      explained: s.explained,
      assisted: s.assisted,
      complete: s.correct,
      activeSeconds: clock.current,
      errorType: s.mistakes ? lesson.misconception : "",
    };
    persist(
      updateRow(
        rowsRef.current,
        row,
        answer === undefined
          ? undefined
          : { answer, correct: !!correct, time: new Date().toISOString() },
      ),
    );
  }
  function open(l: Lesson) {
    stop();
    setLesson(l);
    setN({ ...l.seed });
    setPhase("guided");
    setStep(0);
    setTeaching(initial);
    setValue("");
    setMessage("");
    setShowHelp(false);
    setReasonPassed(false);
    reasonGate.current = false;
    support.current = false;
    session.current = crypto.randomUUID();
    clock.current = 0;
    replays.current = 0;
    lastAction.current = Date.now();
    motion.reset();
  }
  function home() {
    stop();
    if (lesson && state.stage !== "INTRO") record(gate.current);
    setLesson(null);
    setMode("home");
    setTeaching(initial);
  }
  function start() {
    if (!lesson || validate(lesson.id, n)) return;
    setTeaching(transition(initial, { type: "start" }));
    motion.reset();
    setMessage("先观察，再动手。动画完成后回答关键问题。");
  }
  function speak(text: string) {
    silence();
    if (muted) return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceError("此浏览器没有可用语音，请看文字讲解。");
      return;
    }
    const id = ++speechId.current,
      u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.9;
    setSpeaking(true);
    u.onend = () => {
      if (id === speechId.current) setSpeaking(false);
    };
    u.onerror = () => {
      if (id === speechId.current) {
        setSpeaking(false);
        setVoiceError("语音暂不可用，已保留文字讲解。");
      }
    };
    synth.speak(u);
  }
  function play() {
    if (!current) return;
    if (speechPaused.current) {
      window.speechSynthesis?.resume();
      speechPaused.current = false;
    } else if (!speaking) speak(current.text);
    motion.play();
  }
  function pause() {
    motion.pause();
    if (speaking) {
      window.speechSynthesis?.pause();
      speechPaused.current = true;
    }
  }
  function replay() {
    stop();
    motion.reset();
    replays.current++;
    record({
      ...gate.current,
      assisted: phase !== "guided" || gate.current.assisted,
    });
    if (phase !== "guided") {
      setShowHelp(true);
      support.current = true;
      setTeaching({ ...gate.current, assisted: true });
    }
  }
  function help() {
    stop();
    const next = transition(gate.current, { type: "help" });
    setTeaching(next);
    support.current = true;
    setShowHelp(next.hints >= 2);
    setMessage(next.hints >= 3 ? current!.explain : current!.hint);
    if (next.hints >= 2) motion.seek(1);
    record(next, undefined, undefined, false, true);
  }
  function answer(raw: string) {
    if (
      !current ||
      ["INTRO", "OBSERVE", "COMPLETE"].includes(gate.current.stage)
    )
      return;
    if (raw.trim() === "" || !Number.isFinite(Number(raw))) {
      setMessage("先填一个数字，再检查。");
      return;
    }
    const correct = Number(raw) === current.answer,
      next = transition(gate.current, { type: "answer", correct });
    setTeaching(next);
    stop();
    record(next, raw, correct, false, !correct);
    if (correct) {
      setMessage("这一步想清楚了！再说说为什么，或者继续下一步。");
    } else {
      support.current = true;
      setMessage(
        next.mistakes === 1
          ? current.hint
          : next.hints < 3
            ? "换一种观察方式：把每一份数清，再检查单位。"
            : current.explain,
      );
      if (next.hints >= 2) {
        setShowHelp(true);
        motion.seek(1);
      }
    }
  }
  function chooseReason(correct: boolean, label: string) {
    if (reasonGate.current) return;
    record(
      { ...gate.current, assisted: !correct || gate.current.assisted, correct },
      label,
      correct,
      true,
      !correct,
    );
    if (correct) {
      reasonGate.current = true;
      setReasonPassed(true);
      setMessage("你把动作和算式联系起来了。");
    } else {
      support.current = true;
      setMessage("再看：实际改变了什么？总量、每份还是重复的部分？");
    }
  }
  function next() {
    if (!gate.current.correct || !lesson) return;
    stop();
    if (phase === "guided" && step < 2) {
      setStep(step + 1);
      setTeaching(transition(initial, { type: "start" }));
      motion.reset();
      setValue("");
      setMessage("下一步先观察。");
      setShowHelp(false);
      return;
    }
    if (!reasonGate.current) return;
    stop();
    if (phase === "transfer") {
      home();
      return;
    }
    const nextPhase = phase === "guided" ? "practice" : "transfer";
    setPhase(nextPhase);
    setN({
      ...(nextPhase === "transfer"
        ? lesson.transfer
        : support.current
          ? lesson.easy
          : lesson.practice),
    });
    setStep(2);
    setTeaching(transition(initial, { type: "transfer" }));
    setValue("");
    setShowHelp(false);
    setReasonPassed(false);
    reasonGate.current = false;
    motion.reset();
    setMessage(
      nextPhase === "practice" && support.current
        ? "刚才需要帮助，我们先用小一些的数字独立练习，再换新情境。"
        : "先自己想一想，需要时再打开图示。",
    );
  }
  function visibility(id: string, visible: boolean) {
    const next = saveVisibility(hidden, [`textbook:measure:${id}`], visible);
    if (next) setHidden(next);
    else setStorageError(true);
  }
  const stats = statistics(rows);
  const heading =
    phase === "guided"
      ? "一起探索"
      : phase === "practice"
        ? "独立练习"
        : "换情境迁移";
  return (
    <div
      className="measurement"
      onPointerDown={() => (lastAction.current = Date.now())}
      onKeyDown={() => (lastAction.current = Date.now())}
    >
      <header>
        <a href="../">学习小花园</a>
        <a href="?">教材首页</a>
        <a href="?unit=mixed">混合运算</a>
        <button onClick={home}>测量课程首页</button>
        <button
          onClick={() => {
            stop();
            setLesson(null);
            setMode("bank");
          }}
        >
          配套练习
        </button>
        <button
          onClick={() => {
            stop();
            if (lesson) record(gate.current);
            setMode("records");
            if (!storageError) {
              const stored = readRows();
              setRows(stored);
              rowsRef.current = stored;
            }
          }}
        >
          学习记录
        </button>
      </header>
      <main>
        {storageError && (
          <p role="alert">
            浏览器无法保存数据，本次记录仍在内存中，请导出JSON。隐藏设置可能未保存。
          </p>
        )}
        {mode === "bank" ? (
          <Practice
            onRecords={() => {
              setRows(readRows());
              rowsRef.current = readRows();
              setMode("records");
            }}
          />
        ) : mode === "records" ? (
          <section className="paper">
            <h1>测量与称重学习记录</h1>
            <p>
              已作答{stats.answered}题；首次正确{stats.first}题；辅助后完成
              {stats.assisted}题；独立迁移首次无提示正确
              {stats.transferIndependent}/{stats.transfer}题。
            </p>
            <p>
              原始答案保留；活动时间只累计页面可见且最近60秒内有操作的时间。各题显示累计课程活动时间，不应再次相加。
            </p>
            <button onClick={() => download(rows)}>导出JSON</button>
            <button onClick={() => setWrongOnly(!wrongOnly)}>
              {wrongOnly ? "查看全部记录" : "只看首次答错的题"}
            </button>
            {rows.length === 0 && <p>还没有学习记录。</p>}
            {rows
              .filter((r) => !wrongOnly || r.firstCorrect === false)
              .map((r) => (
                <article className="record" key={r.id}>
                  <b>{r.question}</b>
                  <p>
                    首次：{r.firstAnswer ?? "尚未作答"} ·{" "}
                    {r.firstCorrect === null
                      ? "未作答"
                      : r.firstCorrect
                        ? "正确"
                        : "待复习"}{" "}
                    · 尝试{r.attempts.length}次 · 提示{r.hints}次 · 重播
                    {r.replays}次
                  </p>
                  <small>
                    {r.complete
                      ? r.assisted
                        ? "辅助后完成"
                        : "独立完成"
                      : "尚未完成"}{" "}
                    ·{" "}
                    {
                      {
                        guided: "教学",
                        practice: "独立练习",
                        transfer: "迁移",
                        bank: "配套练习",
                      }[r.phase]
                    }{" "}
                    · {new Date(r.started).toLocaleString("zh-CN")} · 活动
                    {r.activeSeconds}秒 · {r.errorType}
                  </small>
                </article>
              ))}
          </section>
        ) : !lesson ? (
          <>
            <section className="measure-hero">
              <span className="badge">教材第20～38页 · 原创互动实验</span>
              <h1>
                小小测量家
                <br />
                <em>先动手，再说为什么</em>
              </h1>
              <p>尺子、绳子、跑道和秤，都可以帮我们把数量看清楚。</p>
              <button className="primary" onClick={() => open(lessons[0])}>
                从尺子开始探索
              </button>
            </section>
            <div className="actions">
              <button onClick={() => setShowHidden(!showHidden)}>
                {showHidden ? "只看显示的课程" : "查看全部（含隐藏）"}
              </button>
              <button onClick={() => setMode("bank")}>
                进入配套练习与小讲堂
              </button>
            </div>
            <section className="measure-cards">
              {lessons
                .filter(
                  (l) => showHidden || !hidden[`textbook:measure:${l.id}`],
                )
                .map((l) => (
                  <article key={l.id} className="paper">
                    <label className="visibility">
                      <input
                        type="checkbox"
                        checked={!hidden[`textbook:measure:${l.id}`]}
                        onChange={(e) => visibility(l.id, e.target.checked)}
                      />
                      显示课程：{l.title}
                    </label>
                    <button className="lesson-card" onClick={() => open(l)}>
                      <span className="lesson-icon">{l.icon}</span>
                      <small>第{l.page}页</small>
                      <h2>{l.title}</h2>
                      <p>{l.goal}</p>
                      <strong>开始探索 →</strong>
                    </button>
                  </article>
                ))}
            </section>
          </>
        ) : (
          <>
            <div className="lesson-heading">
              <span className="badge">
                {heading} · 第{lesson.page}页
              </span>
              <h1>
                {lesson.icon} {lesson.title}
              </h1>
              <p>{lesson.goal}</p>
            </div>
            <ol className="learning-steps" aria-label="完整学习步骤">
              {[
                ...steps(lesson.id, n).map((item) => item.title),
                "独立练习",
                "换情境迁移",
              ].map((title, i) => (
                <li
                  key={i}
                  aria-current={
                    (phase === "guided"
                      ? step
                      : phase === "practice"
                        ? 3
                        : 4) === i
                      ? "step"
                      : undefined
                  }
                >
                  第{i + 1}步：{title}
                </li>
              ))}
            </ol>
            <details className="paper source" open={state.stage === "INTRO"}>
              <summary>教材依据与当前条件</summary>
              <p>{lesson.source}</p>
              {state.stage === "INTRO" ? (
                <div className="params">
                  {lesson.params.map((param) => (
                    <label key={param.key}>
                      {param.label}
                      {param.options ? (
                        <select
                          aria-label={param.label}
                          value={n[param.key]}
                          onChange={(e) =>
                            setN({ ...n, [param.key]: Number(e.target.value) })
                          }
                        >
                          {param.options.map((label, i) => (
                            <option key={i} value={i}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          aria-label={param.label}
                          min={param.min}
                          max={param.max}
                          value={Number.isNaN(n[param.key]) ? "" : n[param.key]}
                          onChange={(e) =>
                            setN({
                              ...n,
                              [param.key]:
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p>
                  {phase === "guided"
                    ? lesson.params
                        .map(
                          (p) =>
                            `${p.label}：${p.options?.[n[p.key]] ?? n[p.key]}`,
                        )
                        .join("；")
                    : problem(lesson.id, n)}
                </p>
              )}
            </details>
            {state.stage === "INTRO" ? (
              <section className="paper">
                <p role="status">
                  {validate(lesson.id, n) ||
                    "先猜一猜，再用物品验证。数字可以在上方调整。"}
                </p>
                <button
                  className="primary"
                  disabled={!!validate(lesson.id, n)}
                  onClick={start}
                >
                  开始探索
                </button>
              </section>
            ) : (
              <div className="measure-workspace">
                {(phase === "guided" || showHelp) && (
                  <section className="paper">
                    <div className="step-strip">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          aria-current={i === step ? "step" : undefined}
                        >
                          {i + 1} {steps(lesson.id, n)[i].title}
                        </span>
                      ))}
                    </div>
                    <Scene
                      kind={lesson.id}
                      n={n}
                      step={phase === "guided" ? step : 2}
                      p={motion.p}
                      route={route}
                      grid={state.hints >= 2}
                      massUnit={phase === "guided" ? "千克" : "克"}
                      transfer={phase !== "guided"}
                      zoom={zoom}
                    />
                    <button onClick={() => setZoom(!zoom)}>
                      {zoom ? "恢复图示大小" : "放大刻度图"}
                    </button>
                    {zoom && (
                      <p className="caption">放大后可在图内左右滑动查看。</p>
                    )}
                    <p>{current?.text}</p>
                    {lesson.id === "route" && step === 2 && (
                      <div className="route-options">
                        {routeNames.map((name, i) => (
                          <button
                            key={name}
                            aria-pressed={route === i}
                            onClick={() => {
                              stop();
                              setRoute(i);
                              motion.reset();
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="actions">
                      {phase === "guided" && step > 0 && (
                        <button
                          onClick={() => {
                            stop();
                            setStep(step - 1);
                            setTeaching(transition(initial, { type: "start" }));
                            motion.reset();
                            setValue("");
                            setMessage("回看这一步，已有首次答案保留。");
                          }}
                        >
                          上一步
                        </button>
                      )}
                      <button
                        onClick={play}
                        disabled={
                          motion.playing || (motion.p >= 1 && !speaking)
                        }
                      >
                        播放 / 继续
                      </button>
                      <button
                        onClick={pause}
                        disabled={!motion.playing && !speaking}
                      >
                        暂停
                      </button>
                      <button
                        onClick={() => {
                          silence();
                          motion.seek(motion.p + 0.25);
                        }}
                      >
                        亲手推进一段
                      </button>
                      <button onClick={replay}>重播</button>
                    </div>
                    <label className="motion-slider">
                      动作进度
                      <input
                        aria-label="动作进度"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(motion.p * 100)}
                        onChange={(e) => {
                          silence();
                          motion.seek(Number(e.target.value) / 100);
                        }}
                      />
                    </label>
                    <label>
                      速度
                      <select
                        aria-label="动画速度"
                        value={motion.speed}
                        onChange={(e) =>
                          motion.setSpeed(Number(e.target.value))
                        }
                      >
                        <option value="0.5">慢一点</option>
                        <option value="1">正常</option>
                        <option value="1.5">快一点</option>
                      </select>
                    </label>
                    {motion.reduced && (
                      <p className="caption">
                        系统启用减少动态效果；播放将直接显示本步终点，也可用滑块分段观察。
                      </p>
                    )}
                  </section>
                )}
                <section className="paper measure-question">
                  <span className="badge">
                    {heading} ·{" "}
                    {phase === "guided" ? `第${step + 1}步` : "先独立思考"}
                  </span>
                  <div className="current-task">
                    <strong>当前要做什么</strong>
                    <h2>{question}</h2>
                    <p>
                      {state.stage === "OBSERVE"
                        ? "先点图示下方的“播放 / 继续”，或拖动动作进度到末尾，再回到这里作答。"
                        : state.correct
                          ? "已答对，请在本作答区继续选择理由或进入下一步。"
                          : "在本区域选择或填写答案，再点“检查想法”。"}
                    </p>
                  </div>
                  {state.stage === "OBSERVE" ? (
                    <p>请播放或亲手推进到本步末尾，再回答这个问题。</p>
                  ) : (
                    <>
                      {current?.choices && phase === "guided" ? (
                        <div className="actions">
                          {current.choices.map((ch) => (
                            <button
                              key={ch.value}
                              disabled={state.correct}
                              onClick={() => answer(String(ch.value))}
                            >
                              {ch.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            answer(value);
                          }}
                        >
                          <label>
                            我的答案
                            <input
                              aria-label="我的答案"
                              inputMode="decimal"
                              type="number"
                              value={value}
                              disabled={state.correct}
                              onChange={(e) => setValue(e.target.value)}
                            />
                          </label>
                          <span>{phase === "guided" ? current?.unit : ""}</span>
                          <button className="primary" disabled={state.correct}>
                            检查想法
                          </button>
                        </form>
                      )}
                      {!state.correct && (
                        <button onClick={help}>我还不会，换个方法</button>
                      )}
                    </>
                  )}
                  <p className="feedback" role="status">
                    {message}
                  </p>
                  {state.stage === "EXPLAIN" && (
                    <button
                      onClick={() => {
                        setTeaching(
                          transition(gate.current, { type: "retry" }),
                        );
                        setValue("");
                        setMessage("现在请自己再做一次；随后会换一道题验证。");
                      }}
                    >
                      我来重新尝试
                    </button>
                  )}
                  {state.correct && (phase !== "guided" || step === 2) && (
                    <div className="reason-box">
                      <h3>为什么这样做？</h3>
                      {[
                        lesson.reason,
                        "因为画面看起来更大，数字一定也更大。",
                        "只要记住答案，下次不需要再看条件。",
                      ].map((text, i) => (
                        <button
                          key={text}
                          disabled={reasonPassed}
                          onClick={() => chooseReason(i === 0, text)}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  )}
                  {state.correct && (
                    <button
                      className="primary"
                      disabled={
                        (phase !== "guided" || step === 2) && !reasonPassed
                      }
                      onClick={next}
                    >
                      {phase === "guided"
                        ? step < 2
                          ? "下一步"
                          : "进入独立练习"
                        : phase === "practice"
                          ? "换情境再试"
                          : "完成课程"}
                    </button>
                  )}
                  <div className="actions">
                    <button
                      onClick={() => {
                        silence();
                        setMuted(!muted);
                      }}
                    >
                      {muted ? "开启语音" : "静音"}
                    </button>
                    <button
                      disabled={muted}
                      onClick={() => {
                        motion.pause();
                        speak(message || current!.text);
                      }}
                    >
                      重听当前讲解
                    </button>
                    {speaking && (
                      <button onClick={silence}>语音没响应，改用文字</button>
                    )}
                  </div>
                  <p className="caption">
                    {voiceError ||
                      "按步骤朗读；动画和语音都结束后才进入问题。可随时改用文字。"}
                  </p>
                </section>
              </div>
            )}
          </>
        )}
      </main>
      <footer>
        本地学习记录 · 无儿童账号 · 不上传教材图片或个人信息 · 规则式教学
      </footer>
    </div>
  );
}
