import {
  useVisibility,
  VisibilityTools,
  VisibilityCheck,
} from "../components/Visibility";
import { OriginalQuestion } from "../library/Library";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Narrator } from "../audio/speech";
import { useAnimation } from "../animation/useAnimation";
import { initialTeaching, teachingReducer } from "../teaching/machine";
import {
  answerEntry,
  newEntry,
  readRecords,
  writeRecord,
  type RecordEntry,
} from "../records/store";
import {
  buildLesson,
  buildRetryLesson,
  catalog,
  checkTask,
  defaults,
  defaultValues,
  observation,
  validate,
  type Lesson,
  type Task,
} from "./model";
import { PdfScene } from "./Scene";
export function PdfMap({
  onChoose,
  onBack,
}: {
  onChoose: (id: number) => void;
  onBack: () => void;
}) {
  const visibility = useVisibility("math");
  const records = readRecords();
  return (
    <main className="page-width pdf-map">
      <button className="back-link" onClick={onBack}>
        ← 回到冒险地图
      </button>
      <div className="eyebrow">MISTAKE NOTEBOOK / 错题本动画</div>
      <h1>把21道错题，变成动手实验。</h1>
      <p className="lead">
        按这次错题本整理。先观察，再操作，再独立做一道数字不同的题。每题都可以调整数字。
      </p>
      <VisibilityTools
        v={visibility}
        ids={catalog.map((_, i) => "pdf-" + (i + 1))}
      />
      {["图形计数", "前后位置", "分类与位置", "数量关系", "购物策略"].map(
        (topic) => (
          <section key={topic}>
            <h2>{topic}</h2>
            <div className="pdf-card-grid">
              {catalog.map(([title, t], i) =>
                t === topic &&
                (visibility.showAll ||
                  !visibility.isHidden("pdf-" + (i + 1))) ? (
                  <div className="lesson-item" key={i}>
                    <button
                      key={i}
                      className="pdf-card"
                      onClick={() => onChoose(i + 1)}
                    >
                      <span>
                        错题 {String(i + 1).padStart(2, "0")}{" "}
                        <span aria-hidden="true">
                          {i < 6 ? "◒" : i < 11 ? "⚑" : i < 15 ? "✦" : "🛒"}
                        </span>
                      </span>
                      <h3>{title}</h3>
                      <p>
                        {records.some(
                          (r) =>
                            r.levelId === "pdf-" + (i + 1) &&
                            r.transfer &&
                            r.completed,
                        )
                          ? "✓ 已完成迁移 · 再探索"
                          : "观察 · 操作 · 独立练习 →"}
                      </p>
                    </button>
                    <VisibilityCheck
                      v={visibility}
                      id={"pdf-" + (i + 1)}
                      title={title}
                    />
                  </div>
                ) : null,
              )}
            </div>
          </section>
        ),
      )}
      <p className="footnote">
        图形为基本部件重绘，不复制原书图片。原始 PDF
        不上传到网站。学习记录仅保存在当前浏览器。
      </p>
    </main>
  );
}
export function PdfLesson({ id, onExit }: { id: number; onExit: () => void }) {
  const [values, setValues] = useState(() => defaultValues(id)),
    [draft, setDraft] = useState(() => defaultValues(id)),
    [errors, setErrors] = useState<string[]>([]),
    [revision, setRevision] = useState(0);
  const lesson = useMemo(() => buildLesson(id, values), [id, values]);
  return (
    <main className="page-width pdf-lesson">
      <button className="back-link" onClick={onExit}>
        ← 返回错题本动画
      </button>
      <div className="eyebrow">
        错题 {id} / {lesson.topic}
      </div>
      <h1>{lesson.title}</h1>
      <OriginalQuestion
        entryId={"pdf-" + id}
        story={buildLesson(id, defaultValues(id)).story}
        prompts={buildLesson(id, defaultValues(id)).tasks.map((t) => t.prompt)}
        source={"首份题本 · 原题" + id}
      />
      <details className="pdf-config">
        <summary>⚙ 调整本题数字</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const issues = validate(id, draft);
            setErrors(issues);
            if (!issues.length) {
              setValues({ ...draft });
              setRevision((n) => n + 1);
            }
          }}
        >
          <div className="pdf-field-grid">
            {defaults(id).map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step="1"
                  value={Number.isNaN(draft[f.key]) ? "" : draft[f.key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [f.key]:
                        e.target.value === "" ? NaN : Number(e.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
          {errors.length > 0 && (
            <div role="alert">
              {errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
          <p>
            调整后题目、物体、提示和答案一起更新。图形数量变化后，会生成新的图形拼图；刷新恢复原题，历史作答保留。
          </p>
          <button className="primary">应用数字，重新开始</button>
        </form>
      </details>
      <PdfSession
        key={id + ":" + revision}
        lesson={lesson}
        values={values}
        onExit={onExit}
      />
    </main>
  );
}
export function PdfSession({
  lesson,
  values,
  onExit,
  alternatives,
}: {
  lesson: Lesson;
  alternatives?: { transfer: Lesson; retry: Lesson; recordId: string };
  values: Record<string, number>;
  onExit: () => void;
}) {
  const [teaching, send] = useReducer(teachingReducer, initialTeaching),
    [paused, setPaused] = useState(false),
    [muted, setMuted] = useState(false),
    [replay, setReplay] = useState(0),
    [answer, setAnswer] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [counts, setCounts] = useState<number[]>(() =>
      lesson.scene.type === "shop" ? lesson.scene.items.map(() => 0) : [],
    ),
    [grouped, setGrouped] = useState(false),
    [feedback, setFeedback] = useState(""),
    [storageWarning, setStorageWarning] = useState(false),
    [replaying, setReplaying] = useState(false),
    [explained, setExplained] = useState(false);
  const narrator = useMemo(() => new Narrator(), []),
    transfer = useMemo(
      () => alternatives?.transfer ?? buildLesson(lesson.id, values, true),
      [lesson, values, alternatives],
    );
  const retryLesson = useMemo(
    () => alternatives?.retry ?? buildRetryLesson(lesson.id, values),
    [lesson, values, alternatives],
  );
  const session = useRef(crypto.randomUUID()),
    records = useRef<Record<string, RecordEntry>>({}),
    activity = useRef(Date.now()),
    blocked = useRef(false);
  const currentLesson = teaching.transfer ? transfer : lesson;
  const retry = teaching.state === "RETRY";
  const currentTask = retry
    ? retryLesson.tasks[0]
    : currentLesson.tasks[teaching.index];
  const activeLesson = retry ? retryLesson : currentLesson;
  const stateRef = useRef({
    paused: false,
    done: false,
    key: "",
    task: currentTask,
    lesson: currentLesson,
  });
  const qkey =
    (teaching.transfer ? "transfer-" : "main-") +
    currentLesson.tasks[teaching.index].id;
  stateRef.current = {
    paused,
    done: teaching.state === "COMPLETE",
    key: qkey,
    task: currentTask,
    lesson: currentLesson,
  };
  const allIds = useMemo(
    () => [
      ...lesson.tasks.map((t) => "main-" + t.id),
      ...transfer.tasks.map((t) => "transfer-" + t.id),
    ],
    [lesson, transfer],
  );
  const entry = (key = qkey) => {
    if (!records.current[key]) {
      const r = newEntry(
        session.current,
        alternatives?.recordId ?? "pdf-" + lesson.id,
        key,
        key.startsWith("transfer-"),
      );
      records.current[key] = {
        ...r,
        questionText: currentTask.prompt,
        storyText: currentLesson.story,
        lessonSnapshot: currentLesson,
        parameters: JSON.stringify({
          original: values,
          transfer: teaching.transfer,
          scene: currentLesson.scene,
        }),
        lessonTitle: lesson.title,
        requiredQuestionIds: allIds,
      };
    }
    return records.current[key];
  };
  const save = (r: RecordEntry) => {
    records.current[r.questionId] = r;
    if (!writeRecord(r)) setStorageWarning(true);
  };
  const animationRunning =
    teaching.state === "OBSERVE" || teaching.state === "EXPLAIN" || replaying;
  const frames = useMemo(
    () =>
      teaching.state === "EXPLAIN"
        ? [
            ...observation(activeLesson.scene),
            { text: currentTask.explanation, duration: 2400 },
          ]
        : observation(activeLesson.scene),
    [activeLesson, currentTask, teaching.state],
  );
  const view = useAnimation(
    frames,
    animationRunning,
    paused,
    muted,
    replay,
    narrator,
    () => {
      if (teaching.state === "OBSERVE") {
        send({ type: "OBSERVED" });
        setGrouped(false);
      }
      if (teaching.state === "EXPLAIN") {
        setExplained(true);
        save({ ...entry(), watchedExplanation: true });
        setGrouped(true);
      }
      setReplaying(false);
    },
  );
  const explanationDone = teaching.state === "EXPLAIN" && explained;
  // Complete explanations remain displayed but stop their clock instead of replaying.
  useEffect(() => {
    if (explanationDone) narrator.cancel();
  }, [explanationDone, narrator]);
  const lastStep = useRef("");
  useEffect(() => {
    const token = qkey + teaching.state;
    if (lastStep.current !== token) {
      blocked.current = false;
      lastStep.current = token;
    }
  }, [qkey, teaching.state]);
  useEffect(() => {
    setAnswer("");
    setSelected([]);
    setCounts(
      activeLesson.scene.type === "shop"
        ? activeLesson.scene.items.map(() => 0)
        : [],
    );
    setFeedback("");
    setGrouped(currentTask.id === "kind");
    setExplained(false);
    setReplaying(false);
    blocked.current = false;
  }, [qkey, retry, activeLesson]);
  useEffect(() => {
    if (teaching.state !== "INTRO" && teaching.state !== "COMPLETE") entry();
  }, [qkey, teaching.state]);
  useEffect(() => {
    const touch = () => {
      activity.current = Date.now();
    };
    const hidden = () => {
      if (document.hidden) setPaused(true);
    };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    document.addEventListener("visibilitychange", hidden);
    const timer = window.setInterval(() => {
      const s = stateRef.current;
      if (
        s.paused ||
        s.done ||
        document.hidden ||
        Date.now() - activity.current > 60000 ||
        !records.current[s.key]
      )
        return;
      const r = records.current[s.key];
      save({ ...r, interactionMs: r.interactionMs + 1000 });
    }, 1000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      document.removeEventListener("visibilitychange", hidden);
      narrator.cancel();
    };
  }, [narrator]);
  const canAnswer =
    !paused &&
    !animationRunning &&
    !teaching.solved &&
    !["INTRO", "COMPLETE"].includes(teaching.state);
  const resetInteraction = () => {
    setAnswer("");
    setSelected([]);
    setCounts(
      activeLesson.scene.type === "shop"
        ? activeLesson.scene.items.map(() => 0)
        : [],
    );
    setGrouped(false);
    setFeedback("");
  };
  const respond = (help = false) => {
    if (!canAnswer || blocked.current) return;
    const valid =
      !help && checkTask(activeLesson, currentTask, answer, selected, counts);
    const submitted = help
      ? "需要帮助"
      : currentTask.pick
        ? selected
            .map((id) =>
              activeLesson.scene.type === "line" ||
              activeLesson.scene.type === "solids"
                ? activeLesson.scene.items.find((i) => i.id === id)?.name
                : id,
            )
            .join("、") || "没有"
        : currentTask.basket
          ? answer + "；购物篮数量：" + counts.join("、")
          : answer;
    if (!help && !currentTask.pick && !answer.trim()) {
      setFeedback("先填一个答案，或点“我不会，需要帮助”。");
      return;
    }
    if (retry) {
      save(answerEntry(entry(), submitted, valid, "相似题再试", "retry"));
      if (valid) {
        blocked.current = true;
        send({ type: "RETRIED" });
      } else setFeedback("再看这道相似题的物体，换个方法试一试。");
      return;
    }
    let r = answerEntry(
      entry(),
      submitted,
      valid,
      lesson.topic +
        (currentTask.basket
          ? "：购买条件或价格比较"
          : "：数量、方向或分类检查"),
      help ? "help" : "answer",
    );
    if (help || !valid) r = { ...r, hints: r.hints + 1 };
    save(r);
    if (valid) {
      blocked.current = true;
      send({ type: "CORRECT" });
      setFeedback("你用自己的方法找到了！说说你是怎么检查的？");
    } else {
      blocked.current = true;
      send({ type: help ? "HELP" : "WRONG" });
      setFeedback("");
    }
  };
  const next = () => {
    if (!teaching.solved || blocked.current) return;
    blocked.current = true;
    save({ ...entry(), completed: true });
    resetInteraction();
    send({
      type: "NEXT",
      mainCount: lesson.tasks.length,
      transferCount: transfer.tasks.length,
    });
  };
  // Unlock next once the solved render has appeared, preventing rapid duplicate submissions.
  useEffect(() => {
    blocked.current = false;
  }, [teaching.solved, teaching.index, teaching.transfer]);
  const controls = (
    <div className="pdf-controls">
      <button
        disabled={teaching.state === "INTRO" || teaching.state === "COMPLETE"}
        onClick={() => setPaused((p) => !p)}
      >
        {paused ? "继续" : "暂停"}
      </button>
      <button
        disabled={
          teaching.state === "INTRO" || teaching.state === "COMPLETE" || retry
        }
        onClick={() => {
          narrator.cancel();
          setExplained(false);
          setReplaying(true);
          setReplay((n) => n + 1);
          setPaused(false);
        }}
      >
        重播动画
      </button>
      <button onClick={() => setMuted((m) => !m)}>
        {muted ? "开启语音" : "静音"}
      </button>
      <button
        disabled={animationRunning || paused}
        onClick={() => {
          setMuted(false);
          narrator.setEnabled(true);
          narrator.speak(
            teaching.state === "INTRO" ? lesson.story : currentTask.prompt,
          );
        }}
      >
        重听当前讲解
      </button>
      <button
        disabled={
          animationRunning ||
          paused ||
          teaching.solved ||
          teaching.state === "COMPLETE"
        }
        onClick={resetInteraction}
      >
        重新尝试
      </button>
    </div>
  );
  return (
    <section
      className={"pdf-session " + (paused ? "is-paused" : "")}
      aria-label="错题动画教学"
    >
      <div className="pdf-state">
        <span>
          {
            (
              {
                INTRO: "故事介绍",
                OBSERVE: "动画观察",
                QUESTION: "自己试一试",
                HINT_1: "轻提示",
                HINT_2: "图形提示",
                EXPLAIN: "完整讲解",
                RETRY: "相似题再试",
                TRANSFER: "独立迁移",
                COMPLETE: "本题完成",
              } as const
            )[teaching.state]
          }
        </span>
        <span>
          {teaching.transfer ? "迁移练习" : "原题探索"} · {teaching.index + 1}/
          {currentLesson.tasks.length}
        </span>
      </div>
      {controls}
      {storageWarning && (
        <p role="alert">
          浏览器暂时无法保存记录，请检查存储空间；本次仍可继续学习。
        </p>
      )}
      {paused && (
        <div className="pdf-pause" role="status">
          已暂停动画、语音和计时。点“继续”恢复。
        </div>
      )}
      {teaching.state === "INTRO" ? (
        <div className="paper pdf-intro">
          <div className="pdf-intro-icon" aria-hidden="true">
            {lesson.id < 7
              ? "◒"
              : lesson.id < 12
                ? "⚑"
                : lesson.id < 16
                  ? "✦"
                  : "🛒"}
          </div>
          <h2>{lesson.title}</h2>
          <p>{lesson.story}</p>
          {lesson.sourceNote && <p className="footnote">{lesson.sourceNote}</p>}
          <button
            className="primary"
            onClick={() => {
              if (blocked.current) return;
              blocked.current = true;
              entry();
              send({ type: "START" });
            }}
          >
            开始探索
          </button>
        </div>
      ) : teaching.state === "COMPLETE" ? (
        <div className="paper pdf-intro">
          <h2>✓ 这次发现，记住了吗？</h2>
          <p>{lesson.summary}</p>
          <p>
            你已经完成原题与数字不同的独立练习。第一次答案仍保留在家长手记里。
          </p>
          <button className="primary" onClick={onExit}>
            返回错题本，选下一题
          </button>
        </div>
      ) : (
        <>
          <ol className="learning-steps" aria-label="本题学习步骤">
            {activeLesson.tasks.map((task, i) => (
              <li
                key={task.id}
                aria-current={task.id === currentTask.id ? "step" : undefined}
              >
                <span>第{i + 1}步</span>{" "}
                {i > teaching.index
                  ? task.prompt.replace(/\d+(?:\.\d+)?/g, "□")
                  : task.prompt}
              </li>
            ))}
          </ol>
          <div className="pdf-task-heading">
            <span>
              {retry
                ? "先用相似题试一次"
                : teaching.transfer
                  ? "新数字，自己来"
                  : "观察之后，自己试"}
            </span>
            <p className="source-problem">{activeLesson.story}</p>
            <p className="task-preview">{currentTask.prompt}</p>
            <p>
              {animationRunning
                ? "先观察本步演示，结束后在下方任务卡作答。"
                : "请在下方任务卡完成当前问题。"}
            </p>
            {!animationRunning && (
              <button
                onClick={() =>
                  document
                    .getElementById("pdf-current-answer")
                    ?.scrollIntoView({ block: "start" })
                }
              >
                去本步作答区 ↓
              </button>
            )}
          </div>
          <div className="paper pdf-stage" inert={paused || undefined}>
            <PdfScene
              paused={paused}
              scene={activeLesson.scene}
              task={currentTask}
              frame={view.frame}
              progress={view.progress}
              running={animationRunning && !explanationDone}
              selected={selected}
              onSelect={(id) => {
                if (!canAnswer) return;
                setSelected((s) =>
                  id.startsWith("wb-single:")
                    ? [id]
                    : id.startsWith("wb-sort:")
                      ? [
                          ...s.filter(
                            (x) =>
                              !x.startsWith(
                                id.split(":").slice(0, 2).join(":") + ":",
                              ),
                          ),
                          id,
                        ]
                      : s.includes(id)
                        ? s.filter((x) => x !== id)
                        : [...s, id],
                );
              }}
              grouped={grouped || teaching.state === "HINT_2"}
              onGroup={() => setGrouped((g) => !g)}
              counts={counts}
              onCount={(i, d) => {
                if (!canAnswer) return;
                setCounts((cs) =>
                  cs.map((c, j) => (i === j ? Math.max(0, c + d) : c)),
                );
              }}
              demonstrating={teaching.state === "EXPLAIN"}
              counting={teaching.state === "HINT_2" || explanationDone}
            />
          </div>
          {animationRunning && !explanationDone ? (
            <p className="pdf-narration" role="status">
              {frames[view.frame]?.text}
            </p>
          ) : null}
          {teaching.state === "HINT_1" && (
            <p className="pdf-hint" role="status">
              {currentTask.hint}
            </p>
          )}
          {teaching.state === "HINT_2" && (
            <p className="pdf-hint" role="status">
              把相关物体分组或做记号，再逐个检查。{currentTask.hint}
            </p>
          )}
          {explanationDone && (
            <div className="pdf-hint">
              <p>{currentTask.explanation}</p>
            </div>
          )}
          {(!animationRunning || explanationDone) && (
            <form
              id="pdf-current-answer"
              className="paper pdf-answer"
              onSubmit={(e) => {
                e.preventDefault();
                respond();
              }}
            >
              <div
                className="current-task"
                role="group"
                aria-label="当前作答任务"
              >
                <strong>
                  现在请回答 · 第{retry ? 1 : teaching.index + 1}步
                </strong>
                <h2 id="pdf-current-prompt">{currentTask.prompt}</h2>
                <p>
                  {explanationDone
                    ? "讲解完成，请在这里点“用一道相似题重新试试”。"
                    : teaching.solved
                      ? "已答对，请点这里的“下一步”。"
                      : currentTask.pick
                        ? "先在上方画面选择物体，再回到这里点“提交答案”。"
                        : currentTask.basket
                          ? "先在上方货架选商品，再回到这里填写并提交。"
                          : currentTask.options
                            ? "先点下方“请选择”，选好答案，再点“提交答案”。"
                            : "填写下面的答案，再点“提交答案”。"}
                </p>
              </div>
              {explanationDone && (
                <button
                  type="button"
                  className="primary"
                  disabled={paused}
                  onClick={() => {
                    if (blocked.current) return;
                    blocked.current = true;
                    send({ type: "RETRY" });
                  }}
                >
                  用一道相似题重新试试
                </button>
              )}
              <label>
                {currentTask.pick
                  ? "先在画面中选齐符合条件的物体，再提交。"
                  : currentTask.basket
                    ? "先在货架上选好商品，再填写答案。"
                    : "我的答案"}
                {!currentTask.pick &&
                  (currentTask.options ? (
                    <select
                      aria-label="我的答案"
                      aria-describedby="pdf-current-prompt"
                      disabled={!canAnswer}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    >
                      <option value="">请选择</option>
                      {currentTask.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        aria-label="我的答案"
                        aria-describedby="pdf-current-prompt"
                        inputMode={
                          Number.isFinite(Number(currentTask.answer))
                            ? "numeric"
                            : "text"
                        }
                        disabled={!canAnswer}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        autoComplete="off"
                      />
                      {activeLesson.scene.type === "workbook" &&
                        /^[+×÷-]{4}$/.test(currentTask.answer) && (
                          <span
                            className="wb-controls"
                            aria-label="运算符输入按钮"
                          >
                            {["+", "-", "×", "÷"].map((symbol) => (
                              <button
                                key={symbol}
                                type="button"
                                disabled={!canAnswer || answer.length >= 4}
                                onClick={() => setAnswer((a) => a + symbol)}
                              >
                                输入 {symbol}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={!canAnswer}
                              onClick={() => setAnswer((a) => a.slice(0, -1))}
                            >
                              删除最后一个符号
                            </button>
                          </span>
                        )}
                    </>
                  ))}
              </label>
              <div className="button-row">
                <button className="primary" disabled={!canAnswer}>
                  提交答案
                </button>
                <button
                  type="button"
                  disabled={!canAnswer || retry}
                  onClick={() => respond(true)}
                >
                  我不会，需要帮助
                </button>
              </div>
              <button
                type="button"
                className="primary"
                disabled={!teaching.solved || paused}
                onClick={next}
              >
                下一步 →
              </button>
            </form>
          )}
          {feedback && (
            <p className="pdf-feedback" role="status">
              {feedback}
            </p>
          )}
          <div className="pdf-navigation">
            <button
              disabled={paused || animationRunning || !grouped}
              onClick={() => setGrouped(false)}
            >
              上一步：回看原摆法
            </button>
          </div>
          {teaching.solved && (
            <p className="pdf-success">{currentTask.explanation}</p>
          )}
        </>
      )}
    </section>
  );
}
