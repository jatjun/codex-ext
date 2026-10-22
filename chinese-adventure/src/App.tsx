import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { books, lessons } from "./catalog";
import type { Lesson, RecordRow, Task, Teaching } from "./types";
import Scene, { demos } from "./Scene";
import { answerState, grade, helpState, initial, shuffled } from "./teaching";
import { exportRows, readRecords, saveRow } from "./records";
import { variant } from "./variants";
const labels = {
  pinyin: "拼音工坊",
  character: "汉字侦探",
  sentence: "句子剧场",
  sequence: "故事排序",
  connector: "关联词桥",
  opposite: "反义小门",
  map: "路线探险",
  writing: "表达观察窗",
  sound: "声音画板",
  dictionary: "字典寻宝",
  story: "故事发现",
};
const icons = {
  pinyin: "a",
  character: "字",
  sentence: "↔",
  sequence: "①",
  connector: "⌁",
  opposite: "⇄",
  map: "↗",
  writing: "✎",
  sound: "♫",
  dictionary: "册",
  story: "✦",
};
function App() {
  const [page, setPage] = useState<"home" | "report">("home"),
    [lesson, setLesson] = useState<Lesson | null>(null),
    [book, setBook] = useState(1),
    [search, setSearch] = useState("");
  useEffect(() => {
    document.title = lesson
      ? `${lesson.title} · 语文小花园`
      : "语文小花园 · Chinese Adventure";
  }, [lesson]);
  const home = () => {
    setLesson(null);
    setPage("home");
    window.scrollTo(0, 0);
  };
  return (
    <>
      <header>
        <div className="header-inner">
          <button className="brand" onClick={home}>
            <span className="brand-mark">文</span>
            <span>
              语文小花园<small>CHINESE ADVENTURE</small>
            </span>
          </button>
          <nav>
            <a href="../">学科首页 ↗</a>
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
            <div>
              <span className="eyebrow">一字一句，都有小发现</span>
              <h1>
                看见意思，
                <br />
                <em>说出自己的精彩。</em>
              </h1>
              <p>
                拼一拼，排一排，让句子里的故事动起来。
                <br />
                先观察，再动手，最后用自己的话说一说。
              </p>
              <div className="pills">
                <span>✦ 动画观察</span>
                <span>↗ 动手探索</span>
                <span>✎ 自由表达</span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="sun">✺</div>
              <span className="cloud cloud-a">云</span>
              <span className="cloud cloud-b">像</span>
              <div className="book-art">
                <span>小小的文字</span>
                <strong>大大的世界</strong>
                <i>山 · 水 · 花 · 鸟</i>
              </div>
              <span className="art-rabbit">🐇</span>
              <span className="art-flower">🌷</span>
            </div>
          </section>
          <section className="library" aria-labelledby="library-title">
            <div className="section-head">
              <div>
                <span className="eyebrow">今天从哪里开始？</span>
                <h2 id="library-title">我的 5 本语文错题本</h2>
              </div>
              <span className="soft-label">125 个题目入口</span>
            </div>
            <p className="muted">
              保持上传顺序和原题号。部分长题改编成分步练习；表达题用自查，不自动判语意。
            </p>
            <div className="book-tabs" role="group" aria-label="选择错题本">
              {books.map((name, i) => (
                <button
                  key={name}
                  aria-pressed={book === i + 1}
                  onClick={() => setBook(i + 1)}
                >
                  <span>0{i + 1}</span>
                  {name}
                </button>
              ))}
            </div>
            <label className="search">
              找一找
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="输入题目名，例如：反义、拼音、秋天"
              />
            </label>
            <div className="lesson-grid">
              {lessons
                .filter(
                  (l) =>
                    l.book === book &&
                    (!search ||
                      l.title.includes(search) ||
                      labels[l.kind].includes(search)),
                )
                .map((l) => (
                  <button
                    className="lesson-card"
                    key={l.id}
                    onClick={() => {
                      setLesson(l);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <span className={"lesson-icon " + l.kind}>
                      {icons[l.kind]}
                    </span>
                    <span className="lesson-number">
                      第 {l.number} 题 · {labels[l.kind]}
                    </span>
                    <strong>{l.title}</strong>
                    <span className="lesson-meta">
                      {l.tasks.length} 个小练习 <b>开始探索 ↗</b>
                    </span>
                  </button>
                ))}
            </div>
            {lessons.filter((l) => l.book === book && l.title.includes(search))
              .length === 0 &&
              search && <p>试试缩短关键词，或换一本错题本。</p>}
          </section>
          <aside className="home-note">
            <strong>给家长的小纸条</strong>
            <p>
              每次答题保留第一次结果。开放表达由孩子自查，程序不会把参考句当唯一答案。记录只保存在这台设备的浏览器里。
            </p>
            <button onClick={() => setPage("report")}>看看学习手记 →</button>
          </aside>
        </main>
      )}
      <footer>
        语文小花园 · 用好奇心，读懂每一句。
        <span>不上传学习记录 · 无需登录</span>
      </footer>
    </>
  );
}
function Session({ lesson, leave }: { lesson: Lesson; leave: () => void }) {
  const [s, setS] = useState<Teaching>({ ...initial }),
    [step, setStep] = useState(0),
    [progress, setProgress] = useState(0),
    [paused, setPaused] = useState(false),
    [voice, setVoice] = useState(false),
    [voiceDone, setVoiceDone] = useState(true),
    [voiceMessage, setVoiceMessage] = useState(""),
    [model, setModel] = useState(0),
    [index, setIndex] = useState(0),
    [phase, setPhase] = useState<"main" | "retry" | "transfer">("main"),
    [answer, setAnswer] = useState<string | string[]>(""),
    [selected, setSelected] = useState<number | null>(null),
    [checks, setChecks] = useState<boolean[]>([]),
    [review, setReview] = useState(false),
    [storageError, setStorageError] = useState(false);
  const session = useRef(
      globalThis.crypto?.randomUUID?.() || String(Date.now()),
    ),
    rowRef = useRef<RecordRow | null>(null),
    active = useRef(0),
    voiceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    voiceGeneration = useRef(0),
    utterance = useRef<SpeechSynthesisUtterance | null>(null),
    retryReturn = useRef<"main" | "transfer">("main"),
    moveFrom = useRef<{ index: number; x: number; y: number } | null>(null),
    cardAnimation = useRef<Animation | null>(null);
  const task: Task =
    phase === "main" ? lesson.tasks[index] : variant(lesson.kind, phase);
  const observing = s.stage === "OBSERVE";
  const caption = observing
    ? demos[lesson.kind].lines[step]
    : s.stage === "INTRO"
      ? `欢迎来到${lesson.title}。先观察示例，再试一试。`
      : s.stage === "EXPLAIN"
        ? task.explain
        : s.stage === "COMPLETE"
          ? "你完成了这次探索。记住方法，也保留自己的想法。"
          : task.prompt;
  const stopVoice = () => {
    voiceGeneration.current++;
    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    utterance.current = null;
    setVoiceDone(true);
  };
  const speak = (text: string, enabled = voice) => {
    stopVoice();
    if (!enabled) return;
    if (!window.speechSynthesis) {
      setVoiceMessage("浏览器不支持语音，继续看文字就好。");
      return;
    }
    const generation = voiceGeneration.current;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.84;
      const zh = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith("zh"));
      if (zh) u.voice = zh;
      utterance.current = u;
      setVoiceDone(false);
      const done = () => {
        if (generation !== voiceGeneration.current) return;
        setVoiceDone(true);
        if (voiceTimer.current) clearTimeout(voiceTimer.current);
      };
      u.onend = done;
      u.onerror = () => {
        done();
        setVoiceMessage("这次语音没有播放，文字讲解仍然可用。");
      };
      window.speechSynthesis.speak(u);
      voiceTimer.current = setTimeout(() => {
        if (generation !== voiceGeneration.current) return;
        window.speechSynthesis.cancel();
        done();
        setVoiceMessage("语音等待较久，已切换为文字。");
      }, 25000);
    } catch {
      setVoiceMessage("语音暂不可用，请看文字。");
      setVoiceDone(true);
    }
  };
  useEffect(
    () => () => {
      voiceGeneration.current++;
      if (voiceTimer.current) clearTimeout(voiceTimer.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
    [],
  );
  useEffect(() => {
    let id = 0,
      last = 0;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const tick = (now: number) => {
      const delta = last ? Math.min(now - last, 150) : 0;
      last = now;
      if (!paused && !document.hidden) {
        active.current += delta;
        if (observing)
          setProgress((p) => Math.min(1, p + delta / (reduced ? 800 : 4200)));
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [paused, observing, step]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setPaused(true);
        if (window.speechSynthesis) window.speechSynthesis.pause();
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  const persist = (
    patch: Partial<RecordRow> = {},
    response?: { text: string; correct: boolean | null },
  ) => {
    const now = new Date().toISOString(),
      old =
        rowRef.current ||
        readRecords().find(
          (r) => r.id === `${session.current}:${phase}:${index}`,
        );
    if (!rowRef.current && old) active.current += old.activeMs;
    const r: RecordRow = {
      id: `${session.current}:${phase}:${index}`,
      session: session.current,
      lesson: lesson.id,
      task: index,
      phase,
      date: now,
      firstAnswer: "",
      firstCorrect: null,
      latestCorrect: null,
      attempts: 0,
      hints: 0,
      explanation: false,
      completed: false,
      selfChecked: false,
      answerHistory: [],
      errorType: lesson.kind,
      ...old,
      ...patch,
      activeMs: Math.round(active.current),
    };
    if (response) {
      if (r.attempts === 0) {
        r.firstAnswer = response.text;
        r.firstCorrect = response.correct;
      }
      r.latestCorrect = response.correct;
      r.attempts++;
      r.answerHistory = [
        ...r.answerHistory,
        { answer: response.text, correct: response.correct, at: now },
      ];
    }
    rowRef.current = r;
    if (!saveRow(r)) setStorageError(true);
  };
  const resetInput = () => {
    setAnswer("");
    setSelected(null);
    setChecks([]);
    setReview(false);
    active.current = 0;
    rowRef.current = null;
  };
  const observe = (n = 0) => {
    stopVoice();
    setStep(n);
    setProgress(0);
    setS((v) => ({ ...v, stage: "OBSERVE" }));
    setPaused(false);
    speak(demos[lesson.kind].lines[n]);
  };
  const replay = () => {
    setProgress(0);
    setPaused(false);
    speak(caption);
  };
  const pause = () => {
    setPaused(true);
    if (window.speechSynthesis) window.speechSynthesis.pause();
  };
  const resume = () => {
    setPaused(false);
    if (window.speechSynthesis) window.speechSynthesis.resume();
  };
  const startQuestion = () => {
    stopVoice();
    setS((v) => ({
      ...v,
      stage:
        phase === "transfer"
          ? "TRANSFER"
          : phase === "retry"
            ? "RETRY"
            : "QUESTION",
    }));
    speak(task.prompt);
  };
  const next = () => {
    if (paused) return;
    if (observing) {
      if (progress < 1 || !voiceDone) return;
      if (step < 2) observe(step + 1);
      else startQuestion();
      return;
    }
    if (!s.solved) return;
    persist({ completed: true });
    stopVoice();
    resetInput();
    if (phase === "retry") {
      setPhase(retryReturn.current);
      setS({
        ...initial,
        stage: retryReturn.current === "transfer" ? "TRANSFER" : "QUESTION",
      });
      return;
    }
    if (phase === "transfer") {
      setS({ ...initial, stage: "COMPLETE" });
      return;
    }
    if (index < lesson.tasks.length - 1) {
      setIndex(index + 1);
      setS({ ...initial, stage: "QUESTION" });
    } else {
      setPhase("transfer");
      setS({ ...initial, stage: "TRANSFER" });
    }
  };
  const responseText = () =>
    Array.isArray(answer)
      ? task.mode === "sort"
        ? answer
            .map(
              (v, i) =>
                `${task.options![i]}→${task.bins![Number(v)] || "未分类"}`,
            )
            .join("；")
        : answer.join("、")
      : answer;
  const hasAnswer =
    task.mode === "sort"
      ? Array.isArray(answer) &&
        answer.length === task.options!.length &&
        answer.every((x) => x !== "")
      : Array.isArray(answer)
        ? answer.length > 0
        : answer.trim().length > 0;
  const canSubmit =
    task.mode === "order"
      ? Array.isArray(answer) && answer.length === task.options!.length
      : hasAnswer;
  const submit = () => {
    if (paused || s.solved || !canSubmit || s.stage === "EXPLAIN") return;
    const correct = grade(task, answer);
    if (correct === null) {
      persist({}, { text: responseText(), correct: null });
      setReview(true);
      return;
    }
    persist(
      {
        completed: correct,
        hints: (rowRef.current?.hints || 0) + (correct ? 0 : 1),
      },
      { text: responseText(), correct },
    );
    const n = answerState(s, correct);
    setS(n);
    if (n.stage === "EXPLAIN") {
      persist({ explanation: true });
      speak(task.explain);
    } else
      speak(
        correct
          ? "你找到了！再读一遍，想想为什么。"
          : n.stage === "HINT_1"
            ? "先别着急。读清题目在问什么。"
            : demos[lesson.kind].hint,
      );
  };
  const help = () => {
    if (paused || s.solved) return;
    persist({ hints: (rowRef.current?.hints || 0) + 1 });
    const n = helpState(s);
    setS(n);
    if (n.stage === "EXPLAIN") {
      persist({ explanation: true });
      speak(task.explain);
    } else
      speak(
        n.stage === "HINT_1"
          ? "先想一想，题目要我们做什么？"
          : demos[lesson.kind].hint,
      );
  };
  const retry = () => {
    stopVoice();
    if (phase !== "retry") {
      retryReturn.current = phase;
      setPhase("retry");
      resetInput();
    } else setAnswer("");
    setS({ ...initial, stage: "RETRY" });
    setReview(false);
  };
  const toggle = (v: string) => {
    if (paused || s.solved) return;
    if (task.mode === "choice") {
      setAnswer(v);
      return;
    }
    const a = Array.isArray(answer) ? answer : [];
    setAnswer(a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);
  };
  useLayoutEffect(() => {
    const from = moveFrom.current;
    if (!from) return;
    moveFrom.current = null;
    const el = document.querySelector(
      `[data-card-index="${from.index}"]`,
    ) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    cardAnimation.current?.cancel();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      cardAnimation.current = el.animate(
        [
          { transform: `translate(${from.x - r.x}px,${from.y - r.y}px)` },
          { transform: "translate(0,0)" },
        ],
        { duration: 450, easing: "ease-out" },
      );
  }, [answer]);
  useEffect(() => {
    if (paused) cardAnimation.current?.pause();
    else cardAnimation.current?.play();
  }, [paused]);
  useEffect(() => () => cardAnimation.current?.cancel(), []);
  const sorting = Array.isArray(answer)
    ? answer
    : Array(task.options?.length || 0).fill("");
  const place = (bin: number) => {
    if (selected === null || paused || s.solved) return;
    const a = Array.from(
      { length: task.options!.length },
      (_, i) => sorting[i] || "",
    );
    const el = document.querySelector(`[data-card-index="${selected}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      moveFrom.current = { index: selected, x: r.x, y: r.y };
    }
    a[selected] = String(bin);
    setAnswer(a);
    setSelected(null);
  };
  const disabled = paused || s.solved || s.stage === "EXPLAIN";
  return (
    <main className="session" data-stage={s.stage}>
      <div className="breadcrumbs">
        <button onClick={leave}>← 错题本</button>
        <span>
          第 {lesson.book} 本 / 第 {lesson.number} 题
        </span>
      </div>
      <div className="session-heading">
        <div>
          <span className="eyebrow">
            {labels[lesson.kind]} ·{" "}
            {phase === "transfer"
              ? "独立再试"
              : phase === "retry"
                ? "相似题练习"
                : `小练习 ${index + 1} / ${lesson.tasks.length}`}
          </span>
          <h1>{lesson.title}</h1>
        </div>
        <span className="soft-label">
          {s.stage === "INTRO"
            ? "先来看看"
            : observing
              ? "观察示例"
              : s.stage === "COMPLETE"
                ? "完成探索"
                : "轮到你啦"}
        </span>
      </div>
      <div className="controls" role="group" aria-label="动画与语音控制">
        <button onClick={() => (s.stage === "INTRO" ? observe() : replay())}>
          {s.stage === "INTRO" ? "▶ 开始" : "↺ 重播当前讲解"}
        </button>
        <button
          onClick={pause}
          disabled={paused || s.stage === "INTRO" || s.stage === "COMPLETE"}
        >
          Ⅱ 暂停
        </button>
        <button onClick={resume} disabled={!paused}>
          ▶ 继续
        </button>
        <button
          onClick={() => observe(Math.max(0, step - 1))}
          disabled={
            s.stage === "INTRO" ||
            s.stage === "EXPLAIN" ||
            s.stage === "COMPLETE" ||
            paused
          }
        >
          ← 上一步
        </button>
        <button
          onClick={next}
          disabled={
            paused ||
            s.stage === "INTRO" ||
            s.stage === "EXPLAIN" ||
            s.stage === "COMPLETE" ||
            (observing ? progress < 1 || !voiceDone : !s.solved)
          }
        >
          下一步 →
        </button>
        <button
          onClick={() => {
            if (voice) {
              stopVoice();
              setVoice(false);
            } else {
              setVoice(true);
              speak(caption, true);
            }
          }}
          aria-pressed={voice}
        >
          {voice ? "🔊 静音" : "🔈 开启语音"}
        </button>
      </div>
      {paused && (
        <p className="pause-banner" role="status">
          已暂停 · 动画、语音和学习计时一起休息。点击“继续”。
        </p>
      )}
      <div className="lesson-layout">
        <div>
          <Scene
            kind={lesson.kind}
            step={step}
            progress={progress}
            paused={paused}
            model={model}
            setModel={setModel}
          />
          <div className="narration">
            <span>✦ 小向导</span>
            <p aria-live="polite">{caption}</p>
            {voiceMessage && <small role="status">{voiceMessage}</small>}
            {observing && (
              <>
                <progress value={progress} max={1} aria-label="当前动画进度" />
                {progress === 1 && voiceDone && (
                  <small>这一步看完了，可以点“下一步”。</small>
                )}
              </>
            )}
          </div>
          {lesson.note && (
            <details className="source-note">
              <summary>本题改编说明（给家长）</summary>
              <p>{lesson.note}</p>
            </details>
          )}
        </div>
        <section className="task-panel" aria-label="练习区">
          {s.stage === "INTRO" ? (
            <>
              <span className="task-kicker">准备好了吗？</span>
              <h2>先看懂，再试试。</h2>
              <p>先看一段与本题知识有关的示例动画，再完成自己的题目。</p>
              <p>不会也没关系，可以一步一步请求帮助。</p>
              <button className="primary" onClick={() => observe()}>
                开始探索 →
              </button>
            </>
          ) : observing ? (
            <>
              <span className="task-kicker">观察 {step + 1} / 3</span>
              <h2>留意画面里的变化。</h2>
              <p>{demos[lesson.kind].lines[step]}</p>
              <p className="muted">
                示例帮助你理解方法。接下来会有自己的题目。
              </p>
              <button
                className="primary"
                onClick={next}
                disabled={paused || progress < 1 || !voiceDone}
              >
                {step < 2 ? "看下一步 →" : "我来试试 →"}
              </button>
            </>
          ) : s.stage === "COMPLETE" ? (
            <>
              <span className="task-kicker">✦ 本次探索完成</span>
              <h2>把方法放进小背包。</h2>
              <p>{demos[lesson.kind].hint}</p>
              <p>
                客观题记录作答结果；开放题只记录完成自查，不代表程序确认语意正确。
              </p>
              <button className="primary" onClick={leave}>
                回错题本选下一题 →
              </button>
            </>
          ) : (
            <>
              <span className="task-kicker">
                {phase === "transfer"
                  ? "独立再试 · 先不看提示"
                  : phase === "retry"
                    ? "换一道相似题练方法"
                    : "我的小挑战"}
              </span>
              <h2>{task.prompt}</h2>
              {task.mode === "choice" || task.mode === "multi" ? (
                <div className="options">
                  {task.mode === "multi" && (
                    <small>这道题可以选多个答案。</small>
                  )}
                  {shuffled(task.options!).map((v) => (
                    <button
                      key={v}
                      disabled={disabled}
                      aria-pressed={
                        Array.isArray(answer)
                          ? answer.includes(v)
                          : answer === v
                      }
                      onClick={() => toggle(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ) : task.mode === "order" ? (
                <>
                  <p className="muted">按顺序点词卡，再点已选词卡可放回。</p>
                  <div className="answer-tray" aria-label="已排列的句子">
                    {(Array.isArray(answer) ? answer : []).map((v, i) => (
                      <button
                        disabled={disabled}
                        key={v + i}
                        onClick={() =>
                          setAnswer(
                            (answer as string[]).filter((_, j) => j !== i),
                          )
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="word-tray">
                    {shuffled(task.options!)
                      .filter(
                        (v) => !Array.isArray(answer) || !answer.includes(v),
                      )
                      .map((v) => (
                        <button
                          disabled={disabled}
                          key={v}
                          onClick={() =>
                            setAnswer([
                              ...(Array.isArray(answer) ? answer : []),
                              v,
                            ])
                          }
                        >
                          {v}
                        </button>
                      ))}
                  </div>
                </>
              ) : task.mode === "sort" ? (
                <div className="sort-area">
                  <p className="muted">
                    点卡片 → 点分类框。改分类时，再点已归类的卡片。
                  </p>
                  <div className="word-tray">
                    {task.options!.map(
                      (v, i) =>
                        !sorting[i] && (
                          <button
                            data-card-index={i}
                            key={i}
                            disabled={disabled}
                            aria-pressed={selected === i}
                            onClick={() => setSelected(i)}
                          >
                            {v}
                          </button>
                        ),
                    )}
                  </div>
                  <div className="bins">
                    {task.bins!.map((v, i) => (
                      <div className="bin" key={v}>
                        <button
                          disabled={disabled || selected === null}
                          onClick={() => place(i)}
                        >
                          {v}
                          <strong>
                            {sorting.filter((x) => x === String(i)).length}
                          </strong>
                        </button>
                        <div className="bin-cards">
                          {task.options!.map(
                            (word, j) =>
                              sorting[j] === String(i) && (
                                <button
                                  key={j}
                                  data-card-index={j}
                                  disabled={disabled}
                                  aria-pressed={selected === j}
                                  onClick={() => setSelected(j)}
                                >
                                  {word}
                                </button>
                              ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <label className="answer-label">
                  {task.mode === "open"
                    ? "写下自己的想法（不填真实姓名等个人信息）"
                    : "我的答案"}
                  {task.mode === "open" ? (
                    <textarea
                      disabled={disabled}
                      value={typeof answer === "string" ? answer : ""}
                      maxLength={1000}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="也可以先说给自己听，再简短记下来。"
                    />
                  ) : (
                    <input
                      autoComplete="off"
                      disabled={disabled}
                      value={typeof answer === "string" ? answer : ""}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                      }}
                      placeholder="想好后写在这里"
                    />
                  )}
                </label>
              )}
              {task.mode === "fill" && lesson.kind === "pinyin" && (
                <details className="accent-tool">
                  <summary>拼音声调小键盘</summary>
                  <div className="word-tray">
                    {Array.from("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü").map((v) => (
                      <button
                        disabled={disabled}
                        key={v}
                        onClick={() =>
                          setAnswer(
                            (typeof answer === "string" ? answer : "") + v,
                          )
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </details>
              )}
              {(s.stage === "HINT_1" || s.stage === "HINT_2") && (
                <div className="feedback hint" role="status">
                  <strong>
                    {s.stage === "HINT_1" ? "先找一条小线索" : "让画面帮你想"}
                  </strong>
                  <p>
                    {s.stage === "HINT_1"
                      ? "读清题目：是选正确的，还是选不正确的？再把答案放回原句读一读。"
                      : demos[lesson.kind].hint}
                  </p>
                  {s.stage === "HINT_2" && (
                    <button onClick={() => observe(1)}>回看关键变化 →</button>
                  )}
                </div>
              )}
              {s.stage === "EXPLAIN" && (
                <div className="feedback explain">
                  <strong>我们一起理一理</strong>
                  <p>{task.explain}</p>
                  <p>
                    {task.mode === "open"
                      ? task.example
                      : task.mode === "sort"
                        ? task
                            .options!.map(
                              (v, i) =>
                                `${v}→${task.bins![Number(task.answers[i])]}`,
                            )
                            .join("；")
                        : `参考：${task.answers.join("；")}`}
                  </p>
                  <button className="primary" onClick={retry}>
                    练一道相似题 →
                  </button>
                </div>
              )}
              {review && task.mode === "open" && !s.solved && (
                <div className="feedback self-review">
                  <strong>先检查自己的话</strong>
                  <p>
                    这里没有唯一答案。程序不自动判断句意，请诚实自查，也可以请家长帮忙看看。
                  </p>
                  {task.checks!.map((v, i) => (
                    <label key={v}>
                      <input
                        type="checkbox"
                        checked={checks[i] || false}
                        onChange={(e) =>
                          setChecks((a) =>
                            task.checks!.map((_, j) =>
                              j === i ? e.target.checked : !!a[j],
                            ),
                          )
                        }
                      />
                      {v}
                    </label>
                  ))}
                  <details>
                    <summary>我想看看一种参考表达</summary>
                    <p>{task.example}</p>
                  </details>
                  <button
                    className="primary"
                    disabled={
                      paused || !task.checks!.every((_, i) => checks[i])
                    }
                    onClick={() => {
                      persist(
                        { completed: true, selfChecked: true },
                        rowRef.current?.answerHistory.at(-1)?.answer ===
                          responseText()
                          ? undefined
                          : { text: responseText(), correct: null },
                      );
                      setS((v) => ({ ...v, solved: true }));
                    }}
                  >
                    完成自查，保留我的表达
                  </button>
                </div>
              )}
              {s.solved ? (
                <div className="feedback success" role="status">
                  <strong>
                    {task.mode === "open"
                      ? "表达已保存，记得自己读一遍。"
                      : "你找到了！再想一想为什么。"}
                  </strong>
                  {task.mode !== "open" && <p>{task.explain}</p>}
                  <button className="primary" onClick={next} disabled={paused}>
                    {phase === "transfer" ? "完成探索 →" : "下一步 →"}
                  </button>
                </div>
              ) : (
                s.stage !== "EXPLAIN" && (
                  <div className="task-actions">
                    <button
                      className="primary"
                      disabled={paused || !canSubmit}
                      onClick={submit}
                    >
                      {task.mode === "open"
                        ? "写好了，开始自查"
                        : "检查我的答案"}
                    </button>
                    <button onClick={help} disabled={paused}>
                      我不会，需要帮助
                    </button>
                  </div>
                )
              )}
              {!s.solved && s.stage !== "EXPLAIN" && (
                <button
                  className="quiet"
                  disabled={paused}
                  onClick={() => {
                    setAnswer("");
                    setSelected(null);
                    setReview(false);
                    setChecks([]);
                  }}
                >
                  清空答案，重新尝试
                </button>
              )}
            </>
          )}
        </section>
      </div>
      {storageError && (
        <p role="alert">
          浏览器存储不可用，本次记录可能无法保存。可以继续练习，请勿把本次结果当作已保存。
        </p>
      )}
    </main>
  );
}
function Report({ back }: { back: () => void }) {
  const rows = readRecords(),
    scored = rows.filter((r) => r.attempts > 0 && r.firstCorrect !== null),
    main = scored.filter((r) => r.phase === "main"),
    transfer = scored.filter((r) => r.phase === "transfer"),
    pct = (n: number, d: number) =>
      d ? Math.round((n / d) * 100) + "%" : "暂无客观题记录";
  const first = pct(main.filter((r) => r.firstCorrect).length, main.length),
    later = pct(
      main.filter((r) => r.firstCorrect === false && r.latestCorrect === true)
        .length,
      main.filter((r) => r.firstCorrect === false).length,
    );
  return (
    <main className="report">
      <button onClick={back}>← 回错题本</button>
      <span className="eyebrow">记录每一次尝试，而不是贴标签</span>
      <h1>家长手记</h1>
      <p>只显示本浏览器的记录。清理浏览器数据会删除记录；不同设备不会同步。</p>
      <div className="metrics">
        <article>
          <strong>{first}</strong>
          <span>原题首次正确率</span>
          <small>分母：有客观评分的原题小练习</small>
        </article>
        <article>
          <strong>{later}</strong>
          <span>首次错误后改正率</span>
          <small>分母：首次答错的原题小练习</small>
        </article>
        <article>
          <strong>
            {pct(
              transfer.filter((r) => r.firstCorrect).length,
              transfer.length,
            )}
          </strong>
          <span>独立迁移首次正确率</span>
          <small>只统计客观题首次作答</small>
        </article>
        <article>
          <strong>{rows.filter((r) => r.selfChecked).length}</strong>
          <span>开放表达自查次数</span>
          <small>不计入正确率</small>
        </article>
      </div>
      <div className="export">
        <button onClick={() => exportRows("json")}>导出 JSON</button>
        <button onClick={() => exportRows("csv")}>导出 CSV</button>
      </div>
      <h2>各本错题本</h2>
      {books.map((name, i) => {
        const count = lessons.filter(
          (l) =>
            l.book === i + 1 &&
            rows.some(
              (r) => r.lesson === l.id && r.phase === "transfer" && r.completed,
            ),
        ).length;
        return (
          <div className="report-book" key={name}>
            <strong>
              第{i + 1}本 · {name}
            </strong>
            <span>{count} / 25题完成</span>
            <progress value={count} max="25" />
          </div>
        );
      })}
      <h2>需要继续练的方向</h2>
      <p>这些只是本次练习中出现首次错误的知识类别，不代表能力诊断。</p>
      <div className="pills">
        {Object.entries(labels).map(([k, v]) => (
          <span key={k}>
            {v}：
            {
              main.filter((r) => r.errorType === k && r.firstCorrect === false)
                .length
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
                    : "迁移题"}{" "}
                {r.task + 1}
              </strong>
              <p>
                首次：{r.firstAnswer || "尚未作答"} ·{" "}
                {r.firstCorrect === null
                  ? "未自动评分"
                  : r.firstCorrect
                    ? "正确"
                    : "需要再想想"}
              </p>
              <small>
                {r.date} · 尝试{r.attempts}次 · 请求提示{r.hints}次 · 完整讲解
                {r.explanation ? "已看" : "未看"} · 交互
                {Math.round(r.activeMs / 1000)}秒
              </small>
            </article>
          ))}
      </div>
      {rows.length === 0 && <p>还没有记录，先去试一题吧。</p>}
    </main>
  );
}
export default App;
