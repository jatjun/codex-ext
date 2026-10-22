import {
  useVisibility,
  VisibilityTools,
  VisibilityCheck,
} from "./components/Visibility";
import { useEffect, useRef, useState } from "react";
import { books, lessons } from "./catalog";
import type { Answer, Lesson, RecordRow, Stage, Task } from "./types";
import { canSubmit, emptyAnswer, grade, hintStage, mix } from "./model";
import { useAudio } from "./audio";
import { download, readRecords, saveRow } from "./records";
import Art, { Drawing } from "./Art";
import Scene, { guides } from "./Scene";
import { Canvas, Schoolbag, Timetable } from "./Workshop";
const kindNames = {
  word: "图画单词",
  greeting: "情境对话",
  listen: "小耳朵听力",
  letters: "字母侦探",
  phonics: "声音发现",
  sentence: "词卡小火车",
  playground: "操场画册",
  timetable: "课程表设计",
  schoolbag: "书包工作室",
};
function linkedReview() {
  const id = new URLSearchParams(location.search).get("review");
  return id ? readRecords().find((r) => r.id === id) : undefined;
}
function linkedLesson() {
  const q = new URLSearchParams(location.search);
  return (
    lessons.find((l) => l.id === (linkedReview()?.lesson || q.get("lesson"))) ||
    null
  );
}
function App() {
  const visibility = useVisibility("english");
  const [lesson, setLesson] = useState<Lesson | null>(linkedLesson),
    [page, setPage] = useState<"home" | "report">("home"),
    [book, setBook] = useState(1),
    [search, setSearch] = useState("");
  const home = () => {
    history.replaceState(null, "", location.pathname);
    setLesson(null);
    setPage("home");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    document.title = lesson
      ? `${lesson.title} · 英语奇遇岛`
      : "英语奇遇岛 · English Adventure";
  }, [lesson]);
  const records = readRecords();
  return (
    <>
      <header>
        <div className="header-wrap">
          <button className="brand" onClick={home}>
            <span className="brand-symbol">✦</span>
            <span>
              英语奇遇岛<small>ENGLISH ADVENTURE</small>
            </span>
          </button>
          <nav>
            <a href="../">学科首页 ↗</a>
            <a href="../mistakes.html?subject=english">我的错题本</a>
            <button
              onClick={() => {
                setLesson(null);
                setPage("report");
              }}
            >
              家长手记
            </button>
          </nav>
        </div>
      </header>
      {lesson ? (
        <Session key={lesson.id} lesson={lesson} leave={home} />
      ) : page === "report" ? (
        <Report back={home} />
      ) : (
        <main className="home">
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">
                A LITTLE ENGLISH. A BIG ADVENTURE.
              </span>
              <h1>
                让每一个单词，
                <br />
                <em>变成小小的奇遇。</em>
              </h1>
              <p>
                听一听，动手试，再勇敢说出来。
                <br />
                和小伙伴一起，在画面里发现英语的意思。
              </p>
              <div className="hero-pills">
                <span>♫ 听懂一句</span>
                <span>✦ 发现一个词</span>
                <span>✎ 画出自己的故事</span>
              </div>
            </div>
            <div className="hero-picture" aria-label="英语奇遇岛原创插画">
              <svg
                viewBox="0 0 520 410"
                role="img"
                aria-label="阳光下的小学校、猫头鹰与漂浮的字母"
              >
                <defs>
                  <linearGradient id="heroSky" x2="0" y2="1">
                    <stop stopColor="#e2eff5" />
                    <stop offset="1" stopColor="#f7efe0" />
                  </linearGradient>
                </defs>
                <path
                  d="M33 192Q7 60 160 36Q275-1 416 57Q551 124 483 291Q410 415 197 374Q34 366 33 192"
                  fill="url(#heroSky)"
                />
                <circle cx="417" cy="94" r="36" fill="#efce86" />
                <path
                  d="M43 290Q231 215 484 292L443 334Q290 385 95 332Z"
                  fill="#b6d1bd"
                />
                <path
                  d="M112 327Q230 407 393 333Q340 415 220 403Q159 399 112 327"
                  fill="#c9b899"
                />
                <g transform="translate(232 113) scale(1.15)">
                  <Drawing name="school" />
                </g>
                <g transform="translate(82 200) scale(.86)">
                  <Drawing name="owl" />
                </g>
                <g transform="translate(365 241) scale(.52)">
                  <Drawing name="apple" />
                </g>
                <g className="hero-float">
                  <rect
                    x="63"
                    y="83"
                    width="67"
                    height="70"
                    rx="18"
                    fill="#fbf7e9"
                    transform="rotate(-12 95 118)"
                  />
                  <text
                    x="95"
                    y="136"
                    textAnchor="middle"
                    fontSize="46"
                    fontFamily="Georgia"
                    fill="#789cb2"
                  >
                    A
                  </text>
                  <rect
                    x="168"
                    y="53"
                    width="67"
                    height="70"
                    rx="18"
                    fill="#f6d9ae"
                    transform="rotate(12 202 87)"
                  />
                  <text
                    x="202"
                    y="105"
                    textAnchor="middle"
                    fontSize="46"
                    fontFamily="Georgia"
                    fill="#ab8157"
                  >
                    b
                  </text>
                </g>
                <text x="360" y="365" fontSize="16" fill="#89a6ad">
                  hello, little explorer!
                </text>
              </svg>
              <span className="postcard-tag">YOUR NEXT LITTLE DISCOVERY ↗</span>
            </div>
          </section>
          <section className="library">
            <div className="section-title">
              <div>
                <span className="eyebrow">CHOOSE YOUR LITTLE ADVENTURE</span>
                <h2>今天，打开哪本探险册？</h2>
              </div>
              <span className="tag">2 本错题本 · 30 个入口</span>
            </div>
            <p className="muted">
              按上传顺序和原题号探索。先看懂、再尝试；画画和口语由自己检查。
            </p>
            <div className="book-tabs">
              {books.map((b, i) => (
                <button
                  key={b.title}
                  aria-pressed={book === i + 1}
                  onClick={() => setBook(i + 1)}
                >
                  <span>
                    BOOK 0{i + 1} <small>{b.count}个入口</small>
                  </span>
                  <strong>{b.title}</strong>
                  <em>{b.subtitle}</em>
                </button>
              ))}
            </div>
            <label className="search">
              找一个小主题
              <input
                type="search"
                placeholder="例如：字母、蜜蜂、书包"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <VisibilityTools
              v={visibility}
              ids={lessons
                .filter(
                  (l) =>
                    l.book === book &&
                    (!search ||
                      `${l.title} ${l.subtitle} ${kindNames[l.kind]}`
                        .toLowerCase()
                        .includes(search.toLowerCase())),
                )
                .map((l) => l.id)}
            />
            <div className="lesson-grid">
              {lessons
                .filter(
                  (l) =>
                    l.book === book &&
                    (visibility.showAll || !visibility.isHidden(l.id)) &&
                    (!search ||
                      `${l.title} ${l.subtitle} ${kindNames[l.kind]}`
                        .toLowerCase()
                        .includes(search.toLowerCase())),
                )
                .map((l) => (
                  <div className="lesson-item" key={l.id}>
                    <button
                      className="lesson-card"
                      key={l.id}
                      onClick={() => {
                        setLesson(l);
                        window.scrollTo(0, 0);
                      }}
                    >
                      <div className={"card-art " + l.kind}>
                        <Art
                          name={l.kind === "listen" ? "owl" : l.tasks[0].scene}
                        />
                        <span>{String(l.number).padStart(2, "0")}</span>
                      </div>
                      <span className="lesson-type">
                        第{l.number}题 · {kindNames[l.kind]}
                      </span>
                      <strong>{l.title}</strong>
                      <em>{l.subtitle}</em>
                      <div className="lesson-bottom">
                        <span>{l.tasks.length}个小练习</span>
                        <b>
                          {records.some(
                            (r) =>
                              r.lesson === l.id &&
                              r.phase === "transfer" &&
                              r.completed,
                          )
                            ? "已探索 ✓"
                            : "开始探索 ↗"}
                        </b>
                      </div>
                    </button>
                    <VisibilityCheck v={visibility} id={l.id} title={l.title} />
                  </div>
                ))}
            </div>
          </section>
          <section className="parent-note">
            <div>
              <span className="eyebrow">A NOTE FOR GROWN-UPS</span>
              <h3>把进步，留在每一次尝试里。</h3>
              <p>
                听力依据题本原文合成，不是原录音。没有语音识别；跟读和自由表达不会自动判口音或语法。学习记录只保存在当前浏览器。
              </p>
            </div>
            <button onClick={() => setPage("report")}>打开家长手记 →</button>
          </section>
        </main>
      )}
      <footer>
        <span>English Adventure · 听见、看见，也勇敢说出来。</span>
        <span>无须登录 · 不上传学习数据</span>
      </footer>
    </>
  );
}
function Session({ lesson, leave }: { lesson: Lesson; leave: () => void }) {
  const linkedRow =
    linkedReview()?.lesson === lesson.id ? linkedReview() : undefined;
  const [stage, setStage] = useState<Stage>("INTRO"),
    [step, setStep] = useState(0),
    [progress, setProgress] = useState(0),
    [paused, setPaused] = useState(false),
    [muted, setMuted] = useState(false),
    [rate, setRate] = useState(0.85),
    [phase, setPhase] = useState<"main" | "retry" | "transfer">(
      linkedRow?.phase || "main",
    ),
    [index, setIndex] = useState(
      linkedRow?.phase === "main"
        ? Math.max(
            0,
            lesson.tasks.findIndex((t) => t.id === linkedRow.task),
          )
        : 0,
    ),
    [answer, setAnswer] = useState<Answer>(emptyAnswer),
    [errors, setErrors] = useState(0),
    [solved, setSolved] = useState(false),
    [review, setReview] = useState(false),
    [heard, setHeard] = useState(false),
    [transcript, setTranscript] = useState(false),
    [storageError, setStorageError] = useState(false);
  const audio = useAudio(),
    session = useRef(crypto.randomUUID()),
    row = useRef<RecordRow | null>(null),
    retryReturn = useRef<"main" | "transfer">("main"),
    time = useRef({ total: 0, start: performance.now() }),
    restoredMs = useRef(0);
  const task: Task =
      phase === "main"
        ? lesson.tasks[index]
        : phase === "retry"
          ? lesson.retry
          : lesson.transfer,
    observing = stage === "OBSERVE",
    assessing = !["INTRO", "OBSERVE", "COMPLETE"].includes(stage),
    open = ["say", "draw", "timetable", "bag"].includes(task.mode),
    canListen = task.listen && task.mode !== "say";
  useEffect(() => {
    if (paused) {
      time.current.total += performance.now() - time.current.start;
      audio.pause();
    } else {
      time.current.start = performance.now();
      audio.resume();
    }
  }, [paused]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  useEffect(() => {
    if (!observing || paused) return;
    let id = 0,
      last = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      const delta = last ? Math.min(100, now - last) : 0;
      last = now;
      if (!document.hidden)
        setProgress((p) => Math.min(1, p + delta / (reduced ? 650 : 3200)));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [observing, paused, step]);
  const persist = (
    patch: Partial<RecordRow> = {},
    response?: { answer: Answer; correct: boolean | null },
  ) => {
    const id = `${session.current}:${phase}:${task.id}`,
      old = row.current || readRecords().find((r) => r.id === id);
    if (!row.current && old) restoredMs.current = old.activeMs;
    const now = new Date().toISOString();
    const r: RecordRow = {
      id,
      session: session.current,
      lesson: lesson.id,
      task: task.id,
      phase,
      date: now,
      questionText: task.prompt,
      firstAnswer: null,
      firstCorrect: null,
      firstAssisted: false,
      latestCorrect: null,
      attempts: 0,
      hints: 0,
      explanation: false,
      completed: false,
      selfChecked: false,
      history: [],
      ...old,
      heard,
      transcript,
      ...patch,
      activeMs: Math.round(
        restoredMs.current +
          time.current.total +
          (paused ? 0 : performance.now() - time.current.start),
      ),
    };
    if (response) {
      if (!r.attempts) {
        r.firstAnswer = structuredClone(response.answer);
        r.firstCorrect = response.correct;
        r.firstAssisted =
          r.hints > 0 || r.explanation || transcript || !!(canListen && !heard);
      }
      r.latestCorrect = response.correct;
      r.attempts++;
      r.history = [
        ...r.history,
        {
          answer: structuredClone(response.answer),
          correct: response.correct,
          at: now,
        },
      ];
    }
    row.current = r;
    if (!saveRow(r)) setStorageError(true);
  };
  const clear = () => {
    setAnswer(emptyAnswer());
    setReview(false);
    setErrors(0);
    setSolved(false);
    setHeard(false);
    setTranscript(false);
    row.current = null;
    restoredMs.current = 0;
    time.current = { total: 0, start: performance.now() };
  };
  const speak = (lines: string[], lang = "en-US", done?: () => void) => {
    if (!paused && !muted) audio.play(lines, rate, lang, done);
  };
  const observe = (n = 0) => {
    audio.stop();
    setProgress(0);
    setStep(n);
    setStage("OBSERVE");
    setPaused(false);
  };
  const question = () => {
    audio.stop();
    setStage(
      phase === "transfer"
        ? "TRANSFER"
        : phase === "retry"
          ? "RETRY"
          : "QUESTION",
    );
  };
  const next = () => {
    if (paused) return;
    if (observing) {
      if (progress < 1 || audio.busy) return;
      if (step < 2) observe(step + 1);
      else question();
      return;
    }
    if (!solved) return;
    audio.stop();
    persist({ completed: true });
    clear();
    if (phase === "retry") {
      setPhase(retryReturn.current);
      setStage(retryReturn.current === "transfer" ? "TRANSFER" : "QUESTION");
    } else if (phase === "transfer") setStage("COMPLETE");
    else if (index + 1 < lesson.tasks.length) {
      setIndex(index + 1);
      setStage("QUESTION");
    } else {
      setPhase("transfer");
      setStage("TRANSFER");
    }
  };
  const requestHelp = () => {
    if (paused || solved || stage === "EXPLAIN") return;
    const n = errors + 1;
    setErrors(n);
    setStage(hintStage(n));
    persist({
      hints: (row.current?.hints || 0) + 1,
      explanation: n >= 3 || row.current?.explanation,
    });
    audio.stop();
  };
  const submit = () => {
    if (
      paused ||
      solved ||
      stage === "EXPLAIN" ||
      !canSubmit(task, answer) ||
      (canListen && !heard && !transcript) ||
      audio.busy
    )
      return;
    const correct = grade(task, answer);
    persist({}, { answer, correct });
    if (correct === null) {
      setReview(true);
      return;
    }
    if (correct) {
      setSolved(true);
      persist({ completed: true });
    } else {
      const n = errors + 1;
      setErrors(n);
      setStage(hintStage(n));
      persist({
        hints: (row.current?.hints || 0) + 1,
        explanation: n >= 3 || row.current?.explanation,
      });
    }
  };
  const retry = () => {
    audio.stop();
    if (phase !== "retry") {
      retryReturn.current = phase;
      setPhase("retry");
      clear();
    } else {
      setAnswer(emptyAnswer());
      setSolved(false);
      setReview(false);
      setErrors(0);
      setHeard(false);
      setTranscript(false);
    }
    setStage("RETRY");
  };
  const replay = () => {
    audio.stop();
    if (observing) {
      setProgress(0);
      return;
    }
    if (stage === "INTRO") {
      observe();
      return;
    }
    if (task.listen) speak(task.listen, "en-US", () => setHeard(true));
    else if (stage === "EXPLAIN") speak([task.explain], "zh-CN");
    else observe(2);
  };
  const expose = () => {
    audio.stop();
    setTranscript(true);
    persist({ transcript: true, hints: (row.current?.hints || 0) + 1 });
  };
  const ready =
    canSubmit(task, answer) &&
    (!canListen || heard || transcript) &&
    !audio.busy;
  const checksDone = task.checks?.every((_, i) => answer.checks[i]);
  const disabled = paused || solved || stage === "EXPLAIN";
  return (
    <main className="session" data-stage={stage}>
      <div className="crumb">
        <button onClick={leave}>← 返回探险册</button>
        <span>
          BOOK 0{lesson.book} / 第{lesson.number}题
        </span>
      </div>
      <div className="session-title">
        <div>
          <span className="eyebrow">{lesson.subtitle.toUpperCase()}</span>
          <h1>{lesson.title}</h1>
        </div>
        <span className="tag">
          {phase === "transfer"
            ? "独立再试"
            : phase === "retry"
              ? "相似题练习"
              : `小练习 ${index + 1}/${lesson.tasks.length}`}
        </span>
      </div>
      <div className="controls" aria-label="学习控制">
        <button onClick={() => (stage === "INTRO" ? observe() : replay())}>
          {stage === "INTRO" ? "▶ 开始" : "↺ 重播"}
        </button>
        <button
          disabled={paused || stage === "INTRO" || stage === "COMPLETE"}
          onClick={() => setPaused(true)}
        >
          Ⅱ 暂停
        </button>
        <button disabled={!paused} onClick={() => setPaused(false)}>
          ▶ 继续
        </button>
        <button
          disabled={paused || ["INTRO", "EXPLAIN", "COMPLETE"].includes(stage)}
          onClick={() => observe(Math.max(0, step - 1))}
        >
          ← 上一步
        </button>
        <button
          disabled={
            paused ||
            ["INTRO", "EXPLAIN", "COMPLETE"].includes(stage) ||
            (observing ? progress < 1 || audio.busy : !solved)
          }
          onClick={next}
        >
          下一步 →
        </button>
        <button
          aria-pressed={muted}
          onClick={() => {
            audio.stop();
            setMuted((v) => !v);
          }}
        >
          {muted ? "开启语音" : "静音"}
        </button>
        <label>
          语速
          <select
            value={rate}
            onChange={(e) => {
              audio.stop();
              setRate(Number(e.target.value));
            }}
          >
            <option value="0.7">慢一点</option>
            <option value="0.85">适中</option>
            <option value="1">自然</option>
          </select>
        </label>
      </div>
      {paused && (
        <p className="pause-banner" role="status">
          已经暂停。画面、语音和学习计时一起休息，点击“继续”再出发。
        </p>
      )}
      <div className="session-layout">
        <div>
          <Scene
            kind={lesson.kind}
            task={task}
            step={step}
            progress={progress}
            paused={paused || stage === "INTRO" || stage === "COMPLETE"}
            observing={observing}
            showTarget={
              stage === "EXPLAIN" ||
              solved ||
              task.mode === "say" ||
              !task.listen
            }
            selected={answer.selected}
            toggle={(i) => {
              if (disabled || !assessing) return;
              setAnswer((a) => ({
                ...a,
                selected: a.selected.includes(i)
                  ? a.selected.filter((x) => x !== i)
                  : [...a.selected, i],
              }));
            }}
          />
          <div className="guide">
            <span>✦ PIP’S LITTLE NOTE</span>
            <p>
              {observing
                ? guides[lesson.kind].lines[step]
                : stage === "INTRO"
                  ? "先观察示例，再试试自己的题目。不着急，想好了再回答。"
                  : stage === "COMPLETE"
                    ? "把今天发现的方法装进小背包，再去探索下一题。"
                    : stage === "EXPLAIN"
                      ? task.explain
                      : task.hint}
            </p>
            {observing && (
              <>
                <progress max="1" value={progress} aria-label="当前动画进度" />
                <button
                  disabled={paused || muted}
                  onClick={() => speak([guides[lesson.kind].en[step]])}
                >
                  ♫ 听示例英语
                </button>
                <small>示例与待答题分开；下一步等待当前动画与语音完成。</small>
              </>
            )}
            {audio.error && (
              <p className="audio-error" role="status">
                {audio.error}
              </p>
            )}
          </div>
          {lesson.note && (
            <details className="source-note">
              <summary>给家长：来源与改编说明</summary>
              <p>{lesson.note}</p>
            </details>
          )}
        </div>
        <section
          className={
            "task-panel " +
            (["draw", "timetable", "bag"].includes(task.mode) ? "creative" : "")
          }
          aria-label="英语练习区"
        >
          {stage === "INTRO" ? (
            <>
              <span className="task-kicker">READY FOR A LITTLE ADVENTURE?</span>
              <h2>小小探险家，准备好了吗？</h2>
              <p>
                先看三步示例，认识方法，再完成自己的挑战。不会时，可以一步一步请求帮助。
              </p>
              <button className="primary" onClick={() => observe()}>
                开始探索 →
              </button>
            </>
          ) : observing ? (
            <>
              <span className="task-kicker">
                WATCH & DISCOVER · {step + 1}/3
              </span>
              <h2>{guides[lesson.kind].lines[step]}</h2>
              <p className="english-line">{guides[lesson.kind].en[step]}</p>
              <p className="muted">看完后再点下一步，不会自动跳到答案。</p>
              <button
                className="primary"
                disabled={paused || progress < 1 || audio.busy}
                onClick={next}
              >
                {step < 2 ? "看下一步 →" : "我来试试 →"}
              </button>
            </>
          ) : stage === "COMPLETE" ? (
            <>
              <span className="task-kicker">
                A LITTLE DISCOVERY, WELL DONE!
              </span>
              <h2>今天又多了一点勇气。</h2>
              <p>记住意思，检查拼写，也给自己的表达留一点空间。</p>
              <p className="muted">
                口语和创作仅记录自查，不代表系统确认发音或语法全部正确。
              </p>
              <button className="primary" onClick={leave}>
                回到探险册 →
              </button>
            </>
          ) : (
            <>
              <span className="task-kicker">
                {phase === "transfer"
                  ? "YOUR TURN, ALL BY YOURSELF"
                  : phase === "retry"
                    ? "TRY A SIMILAR LITTLE CHALLENGE"
                    : "LET’S HAVE A TRY"}
              </span>
              <h2>{task.prompt}</h2>
              {task.listen && (
                <div className="listening">
                  <div className="listen-actions">
                    <button
                      className="listen-button"
                      disabled={
                        paused ||
                        muted ||
                        audio.busy ||
                        solved ||
                        stage === "EXPLAIN"
                      }
                      onClick={() =>
                        speak(task.listen!, "en-US", () => setHeard(true))
                      }
                    >
                      ♫{" "}
                      {task.mode === "say"
                        ? "听一句，跟读一句"
                        : "听题／再听一次"}
                    </button>
                    <span aria-live="polite">
                      {audio.busy && audio.line >= 0
                        ? `正在播放第${audio.line + 1}/${task.listen.length}句`
                        : heard
                          ? "已听完一遍 ✓"
                          : muted
                            ? "先开启语音，或使用文字"
                            : "点击后开始播放"}
                    </span>
                  </div>
                  <small>根据题本听力文字合成 · 非原录音</small>
                  {task.mode === "say" ? (
                    <div className="transcript">
                      {task.listen.map((line, i) => (
                        <p
                          className={
                            audio.busy && audio.line === i ? "speaking" : ""
                          }
                          key={i}
                        >
                          {line}
                          <button
                            disabled={paused || muted || audio.busy}
                            onClick={() => speak([line])}
                            aria-label={`听第${i + 1}句`}
                          >
                            ♫
                          </button>
                        </p>
                      ))}
                    </div>
                  ) : transcript ? (
                    <div className="transcript">
                      <b>文字辅助已开启</b>
                      {task.listen.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <button
                      className="text-help"
                      disabled={paused || solved}
                      onClick={expose}
                    >
                      听不清／无法播放，改用文字学习
                    </button>
                  )}
                </div>
              )}
              {task.mode === "choice" ? (
                <div className="options">
                  {mix(task.options!).map((o) => (
                    <button
                      disabled={disabled}
                      key={o.id}
                      aria-pressed={answer.text === o.id}
                      onClick={() => setAnswer((a) => ({ ...a, text: o.id }))}
                    >
                      {o.art && <Art name={o.art} colour={o.colour} />}
                      <span>{o.label}</span>
                      <i aria-hidden="true">
                        {answer.text === o.id ? "✓" : "○"}
                      </i>
                    </button>
                  ))}
                </div>
              ) : task.mode === "order" ? (
                <>
                  <p className="small-note">
                    按顺序点词卡；点已选词卡可放回。请检查词序和空格；句末标点不影响判定。
                  </p>
                  <div className="answer-tray" aria-label="我排好的句子">
                    {answer.tokens.map((v, i) => (
                      <button
                        disabled={disabled}
                        key={i}
                        onClick={() =>
                          setAnswer((a) => ({
                            ...a,
                            tokens: a.tokens.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="word-tray">
                    {mix(task.tokens!)
                      .filter((v) => !answer.tokens.includes(v))
                      .map((v) => (
                        <button
                          disabled={disabled}
                          key={v}
                          onClick={() =>
                            setAnswer((a) => ({
                              ...a,
                              tokens: [...a.tokens, v],
                            }))
                          }
                        >
                          {v}
                        </button>
                      ))}
                  </div>
                </>
              ) : task.mode === "count" ? (
                <>
                  <p className="selection-count">
                    你标记了 <strong>{answer.selected.length}</strong> 个字母。
                  </p>
                  <label className="answer-label">
                    我的数量
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={disabled}
                      value={answer.text}
                      onChange={(e) =>
                        setAnswer((a) => ({ ...a, text: e.target.value }))
                      }
                      placeholder="点完再数一遍"
                    />
                  </label>
                </>
              ) : task.mode === "say" ? (
                <p className="small-note">
                  可以先听，也可以看着句子朗读。我们不录音，不自动判口音；说完后请诚实自查。
                </p>
              ) : (
                <>
                  {task.mode === "draw" && (
                    <Canvas
                      answer={answer}
                      setAnswer={setAnswer}
                      paused={disabled}
                    />
                  )}{" "}
                  {task.mode === "timetable" && (
                    <Timetable
                      answer={answer}
                      setAnswer={setAnswer}
                      paused={disabled}
                    />
                  )}{" "}
                  {task.mode === "bag" && (
                    <Schoolbag
                      answer={answer}
                      setAnswer={setAnswer}
                      paused={disabled}
                    />
                  )}
                  <label className="answer-label">
                    {open ? "用英语介绍自己的作品（不填真实姓名）" : "我的答案"}
                    {open ? (
                      <textarea
                        maxLength={1500}
                        disabled={disabled}
                        value={answer.text}
                        onChange={(e) =>
                          setAnswer((a) => ({ ...a, text: e.target.value }))
                        }
                        placeholder="先说给自己听，再写一两句。"
                      />
                    ) : (
                      <input
                        autoCapitalize="off"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={100}
                        disabled={disabled}
                        value={answer.text}
                        onChange={(e) =>
                          setAnswer((a) => ({ ...a, text: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.nativeEvent.isComposing &&
                            e.nativeEvent.keyCode !== 229
                          )
                            submit();
                        }}
                        placeholder="想好后写在这里"
                      />
                    )}
                  </label>
                </>
              )}
              {(stage === "HINT_1" || stage === "HINT_2") && (
                <div className="feedback hint" role="status">
                  <strong>
                    {stage === "HINT_1"
                      ? "先找一条小线索"
                      : "让画面和方法帮你想"}
                  </strong>
                  <p>
                    {stage === "HINT_1"
                      ? "读清要求：是看图、听音，还是检查大小写？先别急着换答案。"
                      : task.hint}
                  </p>
                  {stage === "HINT_2" && (
                    <button disabled={paused} onClick={() => observe(1)}>
                      回看关键变化 →
                    </button>
                  )}
                </div>
              )}
              {stage === "EXPLAIN" && (
                <div className="feedback explain">
                  <strong>我们一起弄明白</strong>
                  <p>{task.explain}</p>
                  {!open && (
                    <p className="reference">
                      {task.mode === "count"
                        ? `${task.target}：${task.letters!.filter((x) => x === task.target).length} 个`
                        : task.answer?.join(" / ")}
                    </p>
                  )}
                  {open && <p className="reference">{task.example}</p>}
                  <button className="primary" disabled={paused} onClick={retry}>
                    先练一道相似题 →
                  </button>
                </div>
              )}
              {review && open && !solved && (
                <div className="feedback self-review">
                  <strong>这一次，由我认真检查。</strong>
                  <p>
                    参考表达不是唯一答案；程序不判断真实发音，也不自动确认所有语法。
                  </p>
                  {task.checks?.map((c, i) => (
                    <label key={c}>
                      <input
                        type="checkbox"
                        disabled={paused}
                        checked={answer.checks[i] || false}
                        onChange={(e) =>
                          setAnswer((a) => ({
                            ...a,
                            checks: task.checks!.map((_, j) =>
                              i === j ? e.target.checked : !!a.checks[j],
                            ),
                          }))
                        }
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                  <details>
                    <summary>想看看一种参考表达</summary>
                    <p className="reference">{task.example}</p>
                  </details>
                  <button
                    className="primary"
                    disabled={paused || !checksDone || !canSubmit(task, answer)}
                    onClick={() => {
                      persist(
                        { completed: true, selfChecked: true },
                        JSON.stringify(row.current?.history.at(-1)?.answer) ===
                          JSON.stringify(answer)
                          ? undefined
                          : { answer, correct: null },
                      );
                      setSolved(true);
                    }}
                  >
                    完成自查
                  </button>
                </div>
              )}
              {solved ? (
                <div className="feedback success" role="status">
                  <strong>
                    {open ? "我完成了自查。" : "发现啦！把整句话再读一遍。"}
                  </strong>
                  {!open && <p>{task.explain}</p>}
                  <button className="primary" disabled={paused} onClick={next}>
                    {phase === "transfer" ? "完成探索 →" : "继续挑战 →"}
                  </button>
                </div>
              ) : (
                stage !== "EXPLAIN" && (
                  <div className="task-actions">
                    <button
                      className="primary"
                      disabled={paused || !ready}
                      onClick={submit}
                    >
                      {open
                        ? task.mode === "say"
                          ? "我读过了，开始自查"
                          : "作品好了，开始自查"
                        : "检查我的答案"}
                    </button>
                    <button disabled={paused} onClick={requestHelp}>
                      我不会，需要帮助
                    </button>
                    <button
                      className="quiet"
                      disabled={paused}
                      onClick={() => {
                        setAnswer(emptyAnswer());
                        setReview(false);
                      }}
                    >
                      清空答案，重新尝试
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </section>
      </div>
      {storageError && (
        <p className="storage-error" role="alert">
          浏览器存储空间不足或不可用，刚才的记录没有保存成功。可以继续学习，请勿把本次结果当作已保存。
        </p>
      )}
    </main>
  );
}
function Report({ back }: { back: () => void }) {
  const rows = readRecords(),
    objective = rows.filter((r) => r.attempts && r.firstCorrect !== null),
    main = objective.filter((r) => r.phase === "main"),
    independent = main.filter((r) => !r.firstAssisted),
    assisted = main.filter((r) => r.firstAssisted || r.firstCorrect === false),
    transfer = objective.filter((r) => r.phase === "transfer"),
    pct = (n: number, d: number) =>
      d ? Math.round((n / d) * 100) + "%" : "暂无记录";
  return (
    <main className="report">
      <button onClick={back}>← 返回探险册</button>
      <span className="eyebrow">SMALL STEPS, REAL DISCOVERIES</span>
      <h1>英语学习手记</h1>
      <p>
        只读取当前浏览器的英语记录。口语、绘画、课程表和书包介绍为自查，不计入自动正确率。
      </p>
      <div className="metrics">
        <article>
          <strong>
            {pct(
              independent.filter((r) => r.firstCorrect).length,
              independent.length,
            )}
          </strong>
          <span>未用辅助的原题首次正确率</span>
          <small>只统计客观小练习，听力须完整听过且未看文字</small>
        </article>
        <article>
          <strong>
            {pct(
              assisted.filter((r) => r.latestCorrect).length,
              assisted.length,
            )}
          </strong>
          <span>使用辅助／首次错误后正确率</span>
          <small>分母为已用辅助或首次答错的原题</small>
        </article>
        <article>
          <strong>
            {pct(
              transfer.filter((r) => r.firstCorrect && !r.firstAssisted).length,
              transfer.length,
            )}
          </strong>
          <span>迁移题独立首次正确率</span>
          <small>开放表达单列，不伪造口语评分</small>
        </article>
        <article>
          <strong>{rows.filter((r) => r.selfChecked).length}</strong>
          <span>口语／作品完成自查次数</span>
          <small>不是系统确认发音或语法正确的次数</small>
        </article>
      </div>
      <div className="report-actions">
        <button onClick={() => download("json")}>导出 JSON</button>
        <button onClick={() => download("csv")}>导出 CSV</button>
      </div>
      <h2>我的两本探险册</h2>
      {books.map((b, i) => {
        const ids = lessons.filter((l) => l.book === i + 1).map((l) => l.id),
          done = ids.filter((id) =>
            rows.some(
              (r) => r.lesson === id && r.phase === "transfer" && r.completed,
            ),
          ).length;
        return (
          <article className="book-progress" key={b.title}>
            <strong>
              BOOK 0{i + 1} · {b.title}
            </strong>
            <span>
              {done}/{ids.length}完成
            </span>
            <progress value={done} max={ids.length} />
          </article>
        );
      })}
      <h2>可以再练练的方向</h2>
      <p className="muted">
        统计首次错误的知识类别，不能据此诊断孩子的能力或发展情况。
      </p>
      <div className="hero-pills">
        {Object.entries(kindNames).map(([k, v]) => (
          <span key={k}>
            {v}：
            {
              main.filter(
                (r) =>
                  r.firstCorrect === false &&
                  lessons.find((l) => l.id === r.lesson)?.kind === k,
              ).length
            }
            次
          </span>
        ))}
      </div>
      <h2>最近的尝试</h2>
      <div className="record-list">
        {rows
          .slice(-30)
          .reverse()
          .map((r) => (
            <article key={r.id}>
              <strong>
                {lessons.find((l) => l.id === r.lesson)?.title} ·{" "}
                {r.phase === "main"
                  ? "原题"
                  : r.phase === "retry"
                    ? "相似题"
                    : "迁移题"}
              </strong>
              <p>
                首次：
                {r.firstAnswer?.text ||
                  r.firstAnswer?.tokens.join(" ") ||
                  (r.firstAnswer?.checks.length
                    ? "口语／作品自查"
                    : "尚未提交")}{" "}
                ·{" "}
                {r.firstCorrect === null
                  ? "未自动评分"
                  : r.firstCorrect
                    ? "正确"
                    : "再想一想"}
                {r.firstAssisted ? "（使用辅助）" : ""}
              </p>
              <small>
                {new Date(r.date).toLocaleString("zh-CN")} · 尝试{r.attempts}次
                · 提示{r.hints}次 · {Math.round(r.activeMs / 1000)}秒
              </small>
            </article>
          ))}
      </div>
      {!rows.length && <p>还没有记录，先去探索一题吧。</p>}
      <p className="muted">
        清除网站数据或更换浏览器不会保留这些记录，请按需导出。语文和数学记录不受本页面操作影响。
      </p>
    </main>
  );
}
export default App;
