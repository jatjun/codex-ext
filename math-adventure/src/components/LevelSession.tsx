import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { levels, type Level } from "../questions/data";
import { defaults } from "../questions/models";
import { makeAnimals, makePatterns } from "../questions/builders";
import { matchesAnswer } from "../questions/queue";
import { teachingReducer, initialTeaching } from "../teaching/machine";
import { Narrator } from "../audio/speech";
import { useAnimation } from "../animation/useAnimation";
import { makeStoryboards } from "../animation/storyboards";
import type { Frame } from "../animation/timeline";
import Scenes from "../scenes/Scenes";
import {
  newEntry,
  answerEntry,
  writeRecord,
  type RecordEntry,
} from "../records/store";
const stateNames: Record<string, string> = {
  INTRO: "故事时间",
  OBSERVE: "看一看",
  QUESTION: "试着解谜",
  HINT_1: "找一个线索",
  HINT_2: "动手看一看",
  EXPLAIN: "一起找方法",
  RETRY: "换个小题试试",
  TRANSFER: "独立新挑战",
  COMPLETE: "探索完成",
};
export function LevelSession({
  level,
  onExit,
}: {
  level: Level;
  onExit: () => void;
}) {
  const [s, dispatch] = useReducer(teachingReducer, initialTeaching);
  const mainModel = level.model ?? defaults;
  const model = s.transfer ? (level.transferModel ?? mainModel) : mainModel;
  const shopTotal = mainModel.shop.count * mainModel.shop.price;
  const storyboards = useMemo(() => makeStoryboards(mainModel), [mainModel]);
  const currentBoards = useMemo(() => makeStoryboards(model), [model]);
  const animals = useMemo(() => makeAnimals(model.detective), [model]);
  const patterns = useMemo(
    () => makePatterns(model.detective.patternCount),
    [model],
  );
  const [paused, setPaused] = useState(false),
    [muted, setMuted] = useState(false),
    [replay, setReplay] = useState(0);
  const [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState(""),
    [retryFeedback, setRetryFeedback] = useState("");
  const [coins, setCoins] = useState<(number | null)[]>(
    Array(shopTotal).fill(null),
  );
  const [placements, setPlacements] = useState<Record<string, string>>({}),
    [selected, setSelected] = useState<string | null>(null),
    [merge, setMerge] = useState(false);
  const [animationDone, setAnimationDone] = useState(false),
    [review, setReview] = useState(false),
    [storageOk, setStorageOk] = useState(true);
  const narrator = useMemo(() => new Narrator(), []);
  const session = useRef(
    globalThis.crypto?.randomUUID?.() ??
      String(Date.now()) + "-" + Math.random().toString(36).slice(2),
  );
  const rows = useRef(new Map<string, RecordEntry>());
  const question = (s.transfer ? level.transfer : level.questions)[s.index];
  const questionRef = useRef(question);
  questionRef.current = question;
  const stateRef = useRef(s);
  stateRef.current = s;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const lastActivity = useRef(performance.now());
  const submitLock = useRef(false);
  const getRecord = () => {
    const q = questionRef.current;
    let r = rows.current.get(q.id);
    if (!r) {
      r = {
        ...newEntry(session.current, level.id, q.id, stateRef.current.transfer),
        questionText: q.prompt,
        storyText: stateRef.current.transfer ? q.prompt : level.story,
        questionSnapshot: q,
        parameters: JSON.stringify(
          stateRef.current.transfer ? level.transferModel : level.model,
        ),
        lessonTitle: level.title,
        requiredQuestionIds: [...level.questions, ...level.transfer].map(
          (q) => q.id,
        ),
      };
      rows.current.set(q.id, r);
    }
    return r;
  };
  const save = (r: RecordEntry) => {
    rows.current.set(r.questionId, r);
    if (!writeRecord(r)) setStorageOk(false);
  };
  const getRecordRef = useRef(getRecord);
  getRecordRef.current = getRecord;
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    let previous = performance.now(),
      sinceSave = 0;
    const activity = () => {
      lastActivity.current = performance.now();
    };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    const tick = setInterval(() => {
      const now = performance.now(),
        elapsed = now - previous;
      previous = now;
      const state = stateRef.current;
      if (
        !pausedRef.current &&
        !document.hidden &&
        now - lastActivity.current < 60000 &&
        !["INTRO", "COMPLETE"].includes(state.state)
      ) {
        const r = getRecordRef.current();
        rows.current.set(r.questionId, {
          ...r,
          interactionMs: r.interactionMs + elapsed,
        });
        sinceSave += elapsed;
        if (sinceSave >= 5000) {
          saveRef.current(rows.current.get(r.questionId)!);
          sinceSave = 0;
        }
      }
    }, 500);
    const flush = () => {
      for (const r of rows.current.values()) writeRecord(r);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(tick);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("pagehide", flush);
      flush();
      narrator.cancel();
    };
  }, [narrator]);
  useEffect(() => {
    submitLock.current = false;
    setAnswer("");
    setFeedback("");
    setRetryFeedback("");
    setSelected(null);
    setMerge(false);
    setReview(false);
    setAnimationDone(false);
    // The very same structured objects are rearranged when the classification standard changes.
    setPlacements({});
    setCoins(Array(shopTotal).fill(null));
  }, [question.id]);
  useEffect(() => {
    submitLock.current = false;
  }, [s.state, s.solved]);
  useEffect(() => {
    const handle = () => {
      if (document.hidden) {
        setPaused(true);
        narrator.pause();
      }
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [narrator]);
  const guidance = s.state === "HINT_2" || s.state === "EXPLAIN";
  const guideFrames = useMemo<Frame[]>(() => {
    const text = question.hints[s.state === "EXPLAIN" ? 2 : 1];
    if (level.id === "queue")
      return [{ text, duration: 1400 }, ...currentBoards.queue];
    if (level.id === "shop" && question.id === "total")
      return [{ text, duration: 1800 }, ...currentBoards.shop.slice(1)];
    if (level.id === "square" && question.id === "side")
      return currentBoards.square.slice(
        2 * model.square.rank - 1,
        2 * model.square.rank - 1 + 4 * model.square.rank,
      );
    if (level.id === "square" && !s.transfer)
      return [
        { text, duration: 1500 },
        ...currentBoards.square.slice(
          2 * model.square.rank - 1 + 4 * model.square.rank,
          2 * (2 * model.square.rank - 1) + 4 * model.square.rank,
        ),
      ];
    if (level.id === "square" && s.transfer)
      return ["从前往后", "从后往前", "从左往右", "从右往左"].flatMap((d) =>
        Array.from({ length: model.square.rank }, (_, i) => i + 1).map((n) => ({
          text: d + "数：" + n + "。",
          duration: 800,
        })),
      );
    if (level.id === "shop" && question.interaction === "coins")
      return Array.from({ length: shopTotal }, (_, i) => ({
        text: i === 0 ? text : "",
        duration: 380,
      }));
    if (level.id === "detective" && s.state === "EXPLAIN")
      return [
        { text, duration: 1800 },
        ...Array.from(
          {
            length: s.transfer ? model.detective.patternCount : animals.length,
          },
          () => ({
            text: "",
            duration: 150,
          }),
        ),
      ];
    return [
      { text, duration: 1800 },
      {
        text:
          s.state === "EXPLAIN" ? question.explanation : "观察数量，再试一试。",
        duration: 1800,
      },
    ];
  }, [
    level.id,
    question,
    s.state,
    s.transfer,
    currentBoards,
    model,
    shopTotal,
    animals,
  ]);
  const frames =
    s.state === "OBSERVE" || review ? storyboards[level.id] : guideFrames;
  const running = s.state === "OBSERVE" || review || guidance;
  const animation = useAnimation(
    frames,
    running,
    paused,
    muted,
    replay,
    narrator,
    () => {
      setAnimationDone(true);
      if (s.state === "OBSERVE") dispatch({ type: "OBSERVED" });
      if (review) setReview(false);
      if (guidance && question.interaction === "coins")
        setCoins(
          Array.from(
            { length: shopTotal },
            (_, i) => i % mainModel.shop.groups,
          ),
        );
      if (s.state === "EXPLAIN")
        save({ ...getRecord(), watchedExplanation: true });
    },
  );
  useEffect(() => {
    if (!running && !["INTRO", "COMPLETE"].includes(s.state)) {
      narrator.setEnabled(!muted);
      void narrator.speak(
        s.solved
          ? question.explanation
          : s.state === "RETRY"
            ? question.retry.prompt
            : s.state === "HINT_1"
              ? question.hints[0]
              : question.prompt,
      );
    }
  }, [question.id, s.state, s.solved, running, narrator]);
  const checkInteraction = () => {
    if (question.interaction === "coins")
      return (
        coins.length === shopTotal &&
        coins.every((v) => v !== null) &&
        Array.from(
          { length: mainModel.shop.groups },
          (_, g) => coins.filter((v) => v === g).length,
        ).every((n) => n === shopTotal / mainModel.shop.groups)
      );
    const mode = question.interaction;
    if (mode === "animals" || mode === "habitat")
      return animals.every(
        (a) => placements[a.id] === (mode === "animals" ? a.kind : a.habitat),
      );
    if (mode === "color" || mode === "form")
      return patterns.every(
        (a) => placements[a.id] === (mode === "color" ? a.color : a.form),
      );
    return true;
  };
  const escalation = (help = false) => {
    const current = getRecord();
    save({ ...current, hints: current.hints + 1 });
    setAnimationDone(false);
    setReplay((n) => n + 1);
    dispatch({ type: help ? "HELP" : "WRONG" });
  };
  const submit = () => {
    if (
      paused ||
      s.solved ||
      submitLock.current ||
      review ||
      ["INTRO", "OBSERVE", "COMPLETE", "EXPLAIN"].includes(s.state)
    )
      return;
    if (s.state === "RETRY") {
      const ok = matchesAnswer(
        question.retry.answer,
        answer,
        question.answerKind === "set",
      );
      save(answerEntry(getRecord(), answer.trim(), ok, "", "retry"));
      if (ok) {
        setAnswer("");
        setRetryFeedback("");
        setFeedback("你找到方法了！回到原来的问题，再自己试一次。");
        dispatch({ type: "RETRIED" });
      } else
        setRetryFeedback(
          "慢慢来，试着用物体或点子画出这道小题。" + question.retry.prompt,
        );
      return;
    }
    const isClassification =
      !!question.interaction && question.interaction !== "coins";
    if (!isClassification && !answer.trim()) {
      setFeedback("先选一个想法，或者点“我不会，需要帮助”。");
      return;
    }
    submitLock.current = true;
    const interaction = checkInteraction();
    const correct =
      (isClassification ||
        matchesAnswer(
          question.answer,
          answer,
          question.answerKind === "set",
        )) &&
      interaction;
    const actual = isClassification
      ? JSON.stringify(placements)
      : answer.trim() +
        (question.interaction === "coins"
          ? "（左" +
            coins.filter((v) => v === 0).length +
            "，右" +
            coins.filter((v) => v === 1).length +
            "，剩" +
            coins.filter((v) => v === null).length +
            "）"
          : "");
    save(answerEntry(getRecord(), actual, correct, question.error));
    if (correct) {
      setFeedback("发现了！你能说说每个数代表什么吗？");
      dispatch({ type: "CORRECT" });
    } else {
      setFeedback(
        question.interaction === "coins" && !interaction
          ? "先检查金币：全部分完了吗？两边一样多吗？"
          : isClassification
            ? "看看计数器：总数够了吗？分类标准一致吗？"
            : "我们再找一条线索。",
      );
      escalation();
    }
  };
  const help = () => {
    if (
      paused ||
      s.solved ||
      submitLock.current ||
      !["QUESTION", "TRANSFER", "HINT_1", "HINT_2"].includes(s.state)
    )
      return;
    submitLock.current = true;
    save(answerEntry(getRecord(), "需要帮助", false, "", "help"));
    escalation(true);
  };
  const next = () => {
    if (paused || !s.solved) return;
    save({ ...getRecord(), completed: true });
    setPaused(false);
    dispatch({
      type: "NEXT",
      mainCount: level.questions.length,
      transferCount: level.transfer.length,
    });
  };
  const fullExplanation = s.state === "EXPLAIN";
  const canAnswer =
    !paused &&
    !review &&
    !s.solved &&
    ["QUESTION", "TRANSFER", "HINT_1", "HINT_2", "RETRY"].includes(s.state);
  const progress = (s.transfer ? level.questions.length : 0) + s.index;
  const total = level.questions.length + level.transfer.length;
  const sceneQuestion =
    s.state === "RETRY" ? { ...question, interaction: undefined } : question;
  return (
    <main className="lesson page-width">
      <div className="lesson-breadcrumb">
        <button className="back-link" onClick={onExit}>
          ← 冒险地图
        </button>
        <span>
          {level.id === "queue"
            ? "排队专题"
            : "实验 " +
              (levels.findIndex((l) => l.id === level.id) + 1) +
              " / 4"}
        </span>
        <span className="pill">{stateNames[s.state]}</span>
      </div>
      <div className="lesson-heading">
        <div>
          <div className="eyebrow">LET'S EXPLORE / 一起找方法</div>
          <h1>
            {level.title}
            <span>{level.icon}</span>
          </h1>
        </div>
        <div className="lesson-progress" aria-label="题目进度">
          {progress + 1} <span>/ {total}</span>
          <div>
            <i
              style={{
                width:
                  Math.min(
                    100,
                    ((progress + (s.solved ? 1 : 0)) / total) * 100,
                  ) + "%",
              }}
            />
          </div>
        </div>
      </div>
      {!storageOk && (
        <p className="notice" role="status">
          浏览器暂时无法保存记录。教学仍可继续，请检查存储空间或隐私模式。
        </p>
      )}
      {s.state === "INTRO" ? (
        <section className={"intro-card " + level.color}>
          <div className="intro-art">
            {level.icon}
            <span>✧</span>
          </div>
          <div>
            <h2>今天，我们来解开一个小秘密。</h2>
            <p>{level.story}</p>
            <p className="footnote">
              不用着急。可以暂停、重看，也可以随时请小向导帮忙。
            </p>
            <button
              className="primary"
              onClick={() => {
                lastActivity.current = performance.now();
                dispatch({ type: "START" });
              }}
            >
              开始探索 →
            </button>
          </div>
        </section>
      ) : s.state === "COMPLETE" ? (
        <section className="complete-card">
          <div className="celebration">✦</div>
          <div className="eyebrow">EXPLORATION COMPLETE</div>
          <h2>你找到方法啦！</h2>
          <p>{level.summary}</p>
          <div className="say-it">
            <strong>现在，试着说给自己听：</strong>
            <p>“我先……再……，最后用……检查。”</p>
          </div>
          <button className="primary" onClick={onExit}>
            回到地图，继续探索 →
          </button>
        </section>
      ) : (
        <>
          <div className="teaching-layout">
            <div className="visual-column">
              <Scenes
                level={level.id}
                model={review ? mainModel : model}
                question={sceneQuestion}
                index={s.index}
                transfer={s.transfer && !review}
                observing={s.state === "OBSERVE" || review}
                animation={animation}
                hint={s.wrong}
                solved={s.solved}
                paused={paused}
                guiding={guidance && !animationDone}
                explaining={fullExplanation}
                coins={coins}
                setCoins={setCoins}
                placements={placements}
                setPlacements={setPlacements}
                selected={selected}
                setSelected={setSelected}
                merge={merge}
                setMerge={setMerge}
              />
              <div className="narration" aria-live="polite">
                <span className="guide-avatar">✳</span>
                <div>
                  <strong>小向导</strong>
                  <p>
                    {running
                      ? frames[animation.frame]?.text ||
                        "看着物体移动，慢慢数一数。"
                      : s.solved
                        ? question.explanation
                        : s.state === "RETRY"
                          ? question.retry.prompt
                          : s.wrong
                            ? question.hints[Math.min(2, s.wrong - 1)]
                            : question.prompt}
                  </p>
                </div>
              </div>
            </div>
            <section className="question-panel">
              <ol className="learning-steps" aria-label="本关学习步骤">
                {(s.transfer ? level.transfer : level.questions).map((q, i) => (
                  <li key={i} aria-current={i === s.index ? "step" : undefined}>
                    第{i + 1}步：
                    {i > s.index
                      ? q.prompt.replace(/\d+(?:\.\d+)?/g, "□")
                      : q.prompt}
                  </li>
                ))}
              </ol>
              <span className="eyebrow">
                {s.transfer
                  ? "YOUR TURN / 独立新挑战"
                  : "THINK & TRY / 想一想，试一试"}
              </span>
              <h2>
                {s.state === "OBSERVE" || review
                  ? "先观察，让数量动起来。"
                  : s.state === "RETRY"
                    ? question.retry.prompt
                    : question.prompt}
              </h2>
              {s.state === "OBSERVE" || review ? (
                <p>
                  跟着小向导观察。动画与这一小段讲解都结束后，才会进入下一段。
                </p>
              ) : (
                <>
                  <p className="question-note">
                    {s.transfer
                      ? "换了数字，还能找到同样的方法吗？先自己试一试。"
                      : "可以动手、数一数，也可以说出你的想法。"}
                  </p>
                  {s.state === "RETRY" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                    >
                      <label htmlFor="answer">
                        {s.state === "RETRY"
                          ? question.retry.prompt
                          : question.prompt}
                        <br />
                        我的答案
                      </label>
                      <input
                        id="answer"
                        aria-label="我的答案"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={!canAnswer}
                        autoComplete="off"
                      />
                      <button
                        className="primary"
                        disabled={!canAnswer}
                        type="submit"
                      >
                        检查小练习
                      </button>
                      <p role="status">{retryFeedback}</p>
                    </form>
                  ) : fullExplanation ? (
                    <div className="explanation">
                      <h3>一起慢慢看</h3>
                      <p>{question.hints[2]}</p>
                      <p>看完后，换一道小题试试，再回到这里。</p>
                      <button
                        className="primary"
                        disabled={paused || !animationDone}
                        onClick={() => {
                          setAnswer("");
                          dispatch({ type: "RETRY" });
                        }}
                      >
                        {animationDone ? "我来试一道相似题" : "正在演示…"}
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                    >
                      {question.options ? (
                        <fieldset disabled={!canAnswer}>
                          <legend>我的想法</legend>
                          {question.options.map((option) => (
                            <label
                              key={option}
                              className={
                                "choice " + (answer === option ? "chosen" : "")
                              }
                            >
                              <input
                                type="radio"
                                name="choice"
                                value={option}
                                checked={answer === option}
                                onChange={() => setAnswer(option)}
                              />
                              {option}
                            </label>
                          ))}
                        </fieldset>
                      ) : question.interaction &&
                        question.interaction !== "coins" ? (
                        <p className="interaction-instruction">
                          操作左边场景，分好后检查。
                        </p>
                      ) : (
                        <>
                          <label htmlFor="answer">
                            我的答案
                            {level.id === "shop"
                              ? "（元）"
                              : level.id === "square"
                                ? "（人）"
                                : ""}
                          </label>
                          <input
                            id="answer"
                            aria-label="我的答案"
                            inputMode={
                              question.answerKind === "set" ? "text" : "numeric"
                            }
                            pattern={
                              question.answerKind === "set"
                                ? undefined
                                : "[0-9]*"
                            }
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            disabled={!canAnswer}
                            placeholder={
                              question.answerKind === "set"
                                ? "有多种答案时，用顿号分开"
                                : "试着填一填"
                            }
                            autoComplete="off"
                          />
                        </>
                      )}
                      {!s.solved && (
                        <button
                          className="primary check-answer"
                          disabled={!canAnswer}
                          type="submit"
                        >
                          {question.interaction &&
                          question.interaction !== "coins"
                            ? "检查分类"
                            : "检查我的想法"}
                        </button>
                      )}
                    </form>
                  )}
                  {feedback && (
                    <div
                      className={"feedback " + (s.solved ? "success" : "")}
                      role="status"
                    >
                      {feedback}
                    </div>
                  )}
                  {!s.solved && !fullExplanation && s.state !== "RETRY" && (
                    <button
                      className="help-button"
                      disabled={!canAnswer}
                      onClick={help}
                    >
                      ✧ 我不会，需要帮助
                    </button>
                  )}
                  {s.solved && (
                    <div className="success-next">
                      <p>
                        {s.transfer
                          ? "把新问题也想明白了。"
                          : "现在，说说你是怎么想的。"}
                      </p>
                      <button
                        className="primary"
                        disabled={paused}
                        onClick={next}
                      >
                        {s.transfer && s.index === level.transfer.length - 1
                          ? "完成本关 ✓"
                          : !s.transfer &&
                              s.index === level.questions.length - 1
                            ? "独立挑战新题 →"
                            : "下一步 →"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
          <div className="lesson-controls" aria-label="教学控制">
            <button
              disabled={paused}
              onClick={() => {
                if (!running) setReview(true);
                setReplay((n) => n + 1);
                setAnimationDone(false);
                narrator.cancel();
              }}
            >
              ↻ 重播当前动画
            </button>
            <button onClick={() => setPaused((v) => !v)}>
              {paused ? "▶ 继续" : "Ⅱ 暂停"}
            </button>
            <button
              disabled={paused || s.state === "OBSERVE" || review}
              onClick={() => {
                setReview(true);
                setAnimationDone(false);
                setReplay((n) => n + 1);
              }}
            >
              ← 上一步：回看观察
            </button>
            <button disabled={paused || !s.solved} onClick={next}>
              下一步 →
            </button>
            <button
              disabled={
                paused ||
                s.state === "OBSERVE" ||
                review ||
                s.solved ||
                fullExplanation
              }
              onClick={() => {
                setAnswer("");
                setCoins(Array(shopTotal).fill(null));
                setPlacements({});
                setMerge(false);
                setSelected(null);
                setFeedback("重新操作，再检查一次。原始作答仍然保留。");
              }}
            >
              重新尝试
            </button>
            <button aria-pressed={muted} onClick={() => setMuted((v) => !v)}>
              {muted ? "♬ 开启语音" : "♬ 静音"}
            </button>
            <button
              disabled={paused || running}
              onClick={() => {
                narrator.setEnabled(!muted);
                void narrator.replay();
              }}
            >
              重听讲解
            </button>
          </div>
          {paused && (
            <div className="pause-banner" role="status">
              已暂停：动画、语音和学习计时都在等你。
              <button onClick={() => setPaused(false)}>继续探索 ▶</button>
            </div>
          )}
        </>
      )}
      <p className="footnote">
        {narrator.supported
          ? "语音由浏览器提供；若没有声音，文字讲解同样完整。"
          : "这个浏览器暂不支持语音，已自动使用文字教学。"}{" "}
        · 不用赶时间，慢慢想。
      </p>
    </main>
  );
}
