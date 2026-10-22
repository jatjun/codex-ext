import { OriginalQuestion } from "../library/Library";
import { useMemo, useState } from "react";
import { PdfSession } from "../pdf/Lab";
import { readRecords } from "../records/store";
import {
  allAddresses,
  build,
  fields,
  valuesFor,
  validate,
  variant,
} from "./model";
import { bookNames, type Book, type Address } from "./types";
export function NotebookMap({
  onChoose,
  onBack,
}: {
  onChoose: (address: Address) => void;
  onBack: () => void;
}) {
  const records = readRecords();
  return (
    <main className="page-width pdf-map">
      <button className="back-link" onClick={onBack}>
        ← 回到冒险地图
      </button>
      <div className="eyebrow">NEW NOTEBOOKS / 两份新错题本</div>
      <h1>单位、运算与空间，都能动手探索。</h1>
      <p className="lead">
        两份各25题，保留原题号。题目数字、图形尺寸、方向与排列方案可调整。原有21题和排队专题仍在首页。
      </p>
      <nav className="nb-book-nav" aria-label="快速选择错题册">
        <a href="#notebook-a">A册 · 质量与应用 ↓</a>
        <a href="#notebook-b">B册 · 运算与空间 ↓</a>
      </nav>
      {(["a", "b"] as Book[]).map((book) => (
        <section key={book} id={"notebook-" + book}>
          <h2>
            {book === "a" ? "第一份（01:25:33）" : "第二份（01:24:05）"} ·{" "}
            {bookNames[book]}
          </h2>
          <div className="pdf-card-grid">
            {allAddresses
              .filter((a) => a.book === book)
              .map((a) => (
                <button
                  className="pdf-card notebook-card"
                  key={a.id}
                  onClick={() => onChoose(a)}
                >
                  <span>
                    {book === "a" ? "A" : "B"}册 · 原题{a.number}
                  </span>
                  <h3>{a.title}</h3>
                  <p>
                    {records.some(
                      (r) => r.levelId === a.id && r.transfer && r.completed,
                    )
                      ? "✓ 已探索 · 再来一次"
                      : "观察 · 亲手试 · 新数字再做 →"}
                  </p>
                </button>
              ))}
          </div>
        </section>
      ))}
      <p className="footnote">
        重复题共用数学模型，各入口分别保存学习记录。原始PDF、手写答案及照片不公开上传。
      </p>
    </main>
  );
}
export function NotebookLesson({
  address,
  onExit,
}: {
  address: Address;
  onExit: () => void;
}) {
  const { book, number } = address;
  const [values, setValues] = useState(() => valuesFor(book, number)),
    [draft, setDraft] = useState(() => valuesFor(book, number)),
    [errors, setErrors] = useState<string[]>([]),
    [revision, setRevision] = useState(0);
  const lesson = useMemo(
    () => build(book, number, values),
    [book, number, values],
  );
  const alternatives = useMemo(() => {
    const transfer = variant(book, number, values),
      retry = variant(book, number, values, [transfer]);
    return { transfer, retry, recordId: `book-${book}-${number}` };
  }, [book, number, values]);
  return (
    <main className="page-width pdf-lesson">
      <button className="back-link" onClick={onExit}>
        ← 返回两份新错题本
      </button>
      <div className="eyebrow">
        {book === "a" ? "A" : "B"}册 · {bookNames[book]} · 原题{number}
      </div>
      <h1>{lesson.title}</h1>
      <OriginalQuestion
        story={build(book, number, valuesFor(book, number)).story}
        prompts={build(book, number, valuesFor(book, number)).tasks.map(
          (t) => t.prompt,
        )}
        source={`${book.toUpperCase()}册 · 原题${number}`}
      />
      <details className="pdf-config">
        <summary>⚙ 调整数字、尺寸或方向</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const messages = validate(book, number, draft);
            setErrors(messages);
            if (!messages.length) {
              setValues({ ...draft });
              setRevision((n) => n + 1);
            }
          }}
        >
          <div className="pdf-field-grid">
            {fields(book, number).map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
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
            点击应用后，题目、物体数量、提示、标准答案与迁移练习同步更新。无法平均分、人数不合理或相遇后继续跑等设置会被拦截。历史作答保留，刷新恢复原题。
          </p>
          {book === "b" && number === 6 && (
            <>
              <p>
                花束数与两类花的枝数相互约束：例如改成6束时，可以同时把两类花改成30枝和18枝。只改束数可能无法平均分。
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...draft, a: 30, b: 18, n: 6 });
                  setErrors([]);
                }}
              >
                填入示例：30枝、18枝、6束
              </button>
            </>
          )}
          <button className="primary">应用设置，重新开始</button>
        </form>
      </details>
      <PdfSession
        key={book + number + ":" + revision}
        lesson={lesson}
        values={values}
        alternatives={alternatives}
        onExit={onExit}
      />
    </main>
  );
}
