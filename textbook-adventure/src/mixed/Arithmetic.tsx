import {
  readVisibility,
  saveVisibility,
} from "../../../learning-home/visibility-model.js";
import { useState } from "react";
import { calculate, parse, trace, exercises } from "./arithmetic";
import { problems } from "./problems";
type Question = {
  id: string;
  page: number;
  expression: string;
  story?: string;
  title?: string;
  hint?: string;
};
const bank: Question[] = [...exercises, ...problems];
const KEY = "textbook-adventure.expression.v1";
export function Arithmetic() {
  const [q, setQ] = useState<Question | null>(null),
    [index, setIndex] = useState(0),
    [value, setValue] = useState(""),
    [errors, setErrors] = useState(0),
    [hint, setHint] = useState(""),
    [done, setDone] = useState(false),
    [filter, setFilter] = useState("all"),
    [custom, setCustom] = useState(""),
    [records, setRecords] = useState<any[]>(() => {
      try {
        const r = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(r)
          ? r.filter(
              (x) =>
                x &&
                typeof x.key === "string" &&
                typeof x.expression === "string",
            )
          : [];
      } catch {
        return [];
      }
    }),
    [report, setReport] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [hidden, setHidden] = useState(() => readVisibility()),
    [showAll, setShowAll] = useState(false),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0);
  const filtered = bank.filter(
    (x) =>
      (filter === "all" || (filter === "story" ? !!x.story : !x.story)) &&
      `${x.title || ""} ${x.expression} ${x.story || ""} ${x.page}`.includes(
        search,
      ) &&
      (showAll || !hidden["textbook:" + x.id]),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 12) - 1),
  );
  const steps = q ? trace(parse(q.expression)) : [];
  function open(item: Question) {
    setQ(item);
    setIndex(0);
    setValue("");
    setErrors(0);
    setHint("");
    setDone(false);
    setReport(false);
  }
  function help() {
    const count = errors + 1;
    setErrors(count);
    setHint(
      count === 1
        ? q!.expression.includes("(")
          ? "先找括号里面。括号里的运算也要遵守先乘除后加减。"
          : "先看有没有乘除。只有同一级运算时，从左往右。"
        : count === 2
          ? `这一步先算 ${steps[index].expression}。${q!.hint?.replace(/找到□=.*$/, "") || "只处理这一小步，其他部分先保留。"}`
          : `这一步：${steps[index].expression}＝${steps[index].result}。用这个中间数量继续往下想。`,
    );
  }
  function submit() {
    if (!q || !value.trim() || done) return;
    const correct = Number(value) === steps[index].result;
    const key = q.id + "-" + q.expression + "-" + index;
    const prev = records.find((x) => x.key === key);
    const row = {
      key,
      source: q.id,
      expression: q.expression,
      step: index + 1,
      firstAnswer: prev?.firstAnswer ?? value,
      firstCorrect: prev?.firstCorrect ?? correct,
      attempts: (prev?.attempts || 0) + 1,
      hints: errors + (correct ? 0 : 1),
      correct,
      time: prev?.time || new Date().toISOString(),
    };
    const next = [...records.filter((x) => x.key !== key), row];
    setRecords(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
    if (correct) {
      setDone(true);
      setHint("这一步成立！注意等号两边表示相同的数量。");
    } else help();
  }
  return (
    <>
      <header>
        <a href="?unit=mixed">← 六个动画工坊</a>
        <button
          onClick={() => {
            setQ(null);
            setReport(false);
          }}
        >
          练习目录
        </button>
        <button onClick={() => setReport(!report)}>练习记录</button>
      </header>
      <main>
        <h1>分步计算与数量关系实验室</h1>
        {report ? (
          <section className="paper">
            <button
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(records, null, 2)], {
                    type: "application/json",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "mixed-expression-records.json";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 500);
              }}
            >
              导出练习JSON
            </button>
            {records.map((r) => (
              <p key={r.key}>
                {r.expression} 第{r.step}步 · 首次 {r.firstAnswer}（
                {r.firstCorrect ? "正确" : "需检查"}）· 尝试{r.attempts}次
              </p>
            ))}
          </section>
        ) : !q ? (
          <>
            <p>
              每次完成一个小步骤，再把中间结果带入下一步。共{bank.length}
              个练习入口；开放编题和购票方案需另作探索，不计入这里。
            </p>
            <label>
              筛选
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">全部</option>
                <option value="expression">计算练习</option>
                <option value="story">数量关系</option>
              </select>
            </label>
            <div className="actions">
              <input
                aria-label="自编算式"
                placeholder="例如 (24+16)÷8"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <button
                onClick={() => {
                  try {
                    if (custom.length > 60) throw Error();
                    const tree = parse(custom);
                    const result = calculate(tree);
                    if (
                      trace(tree).length === 0 ||
                      !Number.isInteger(result) ||
                      result < 0 ||
                      result > 10000 ||
                      trace(tree).some(
                        (s) =>
                          !Number.isInteger(s.result) ||
                          s.result < 0 ||
                          s.result > 10000,
                      )
                    )
                      throw Error();
                    open({ id: "custom", page: 0, expression: custom });
                  } catch {
                    setHint(
                      "请输入有完整括号、每一步结果均为0～10000整数的加减乘除式。",
                    );
                  }
                }}
              >
                用新数字练习
              </button>
            </div>
            <p role="status">{hint}</p>
            <div className="actions">
              <input
                aria-label="搜索练习"
                placeholder="题目、页码或算式"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
              <button
                onClick={() => {
                  setShowAll(!showAll);
                  setPage(0);
                }}
              >
                {showAll ? "只看勾选的练习" : "查看全部（含隐藏）"}
              </button>
            </div>
            <p>
              当前{filtered.length}题，第{currentPage + 1}
              页。取消勾选可以隐藏，记录不会删除。
            </p>
            <div className="cards">
              {filtered
                .slice(currentPage * 12, currentPage * 12 + 12)
                .map((x) => (
                  <article key={x.id}>
                    <label className="exercise-visibility">
                      <input
                        type="checkbox"
                        checked={!hidden["textbook:" + x.id]}
                        onChange={(e) => {
                          const next = saveVisibility(
                            hidden,
                            ["textbook:" + x.id],
                            e.target.checked,
                          );
                          if (next) setHidden(next);
                          else setStorageError(true);
                        }}
                      />
                      显示这题：{x.title || x.expression}
                    </label>
                    <button className="course" onClick={() => open(x)}>
                      <small>教材第{x.page}页</small>
                      <h3>{x.title || x.expression}</h3>
                      {x.story && <p>{x.story}</p>}
                    </button>
                  </article>
                ))}
            </div>
            <div className="actions">
              <button
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                上一页练习
              </button>
              <button
                disabled={(currentPage + 1) * 12 >= filtered.length}
                onClick={() => setPage(currentPage + 1)}
              >
                下一页练习
              </button>
            </div>
          </>
        ) : (
          <section className="paper">
            <p>
              来源：{q.page ? `第${q.page}页` : "自编练习"} ·{" "}
              {q.story || "先判断顺序，再分步计算。"}
            </p>
            <h2>{q.expression}</h2>
            <p>
              第 {index + 1} / {steps.length} 步
            </p>
            <div className="equation-chain">
              {steps.slice(0, index).map((s, i) => (
                <p key={i}>
                  {s.expression}＝{s.result} ✓
                </p>
              ))}
            </div>
            <p>
              本步计算：{steps[index].expression}
              。先在原式中圈出这部分，再求结果。
            </p>
            <input
              type="number"
              aria-label="这一步结果"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button disabled={done} onClick={submit}>
              检查这一步
            </button>
            <button disabled={done} onClick={help}>
              需要提示
            </button>
            <p className="feedback" aria-live="polite">
              {hint}
            </p>
            {done && (
              <div className="solved-expression">
                {steps[index].expression}＝{steps[index].result}
                {index < steps.length - 1 ? (
                  <button
                    onClick={() => {
                      setIndex(index + 1);
                      setDone(false);
                      setValue("");
                      setErrors(0);
                      setHint("把刚才的结果放回原式，再判断下一步。");
                    }}
                  >
                    把结果带入下一步 →
                  </button>
                ) : (
                  <>
                    <p>完成了。试着说说每一步求出的是什么。</p>
                    <button
                      onClick={() => {
                        setQ(null);
                        setHint("选择一道新题，独立检查是否理解。");
                      }}
                    >
                      选一道新题
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        )}
        {storageError && <p role="alert">浏览器无法保存，请导出JSON。</p>}
      </main>
    </>
  );
}
