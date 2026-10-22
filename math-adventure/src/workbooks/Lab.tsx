import {
  useVisibility,
  VisibilityTools,
  VisibilityCheck,
} from "../components/Visibility";
import { OriginalQuestion } from "../library/Library";
import { useMemo, useState } from "react";
import { PdfSession } from "../pdf/Lab";
import { readRecords } from "../records/store";
import { books, catalog, defaults, validate, build, variant } from "./model";
import type { Definition } from "./types";
export function WorkbooksMap({
  onChoose,
  onBack,
}: {
  onChoose: (d: Definition) => void;
  onBack: () => void;
}) {
  const visibility = useVisibility("math");
  const records = readRecords();
  return (
    <main className="page-width pdf-map">
      <button className="back-link" onClick={onBack}>
        ← 回到冒险地图
      </button>
      <div className="eyebrow">8份错题本 / 条件可以改</div>
      <h1>时间、分组和方向，亲手看懂。</h1>
      <p className="lead">
        按上传顺序编号1～8，保留原题号，共177个题目地址。题图重新绘制，重复题分别保存记录。标为“待核对”的题不猜答案。
      </p>
      <nav className="nb-book-nav">
        {books.map((b, i) => (
          <a key={b.time} href={`#morning-book-${i + 1}`}>
            {i + 1}册 · {b.time}
          </a>
        ))}
      </nav>
      <VisibilityTools v={visibility} ids={catalog.map((d) => d.id)} />
      {books.map((b, i) => (
        <section key={b.time} id={`morning-book-${i + 1}`}>
          <h2>
            {i + 1}册 · {b.name}{" "}
            <small>
              （{b.time}，{b.count}题）
            </small>
          </h2>
          <div className="pdf-card-grid">
            {catalog
              .filter(
                (d) =>
                  d.book === i + 1 &&
                  (visibility.showAll || !visibility.isHidden(d.id)),
              )
              .map((d) => (
                <div className="lesson-item" key={d.id}>
                  <button
                    className="pdf-card workbook-card"
                    key={d.id}
                    onClick={() => onChoose(d)}
                  >
                    <span>
                      {d.book}册 · 原题{d.n}
                    </span>
                    <h3>{d.title}</h3>
                    <p>
                      {d.pending
                        ? "题干缺失 · 待核对"
                        : records.some(
                              (r) =>
                                r.levelId === d.id && r.transfer && r.completed,
                            )
                          ? "✓ 已探索 · 再来一次"
                          : "改条件 · 动手试 · 独立再做 →"}
                    </p>
                  </button>
                  <VisibilityCheck v={visibility} id={d.id} title={d.title} />
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
export function WorkbookLesson({
  definition: d,
  onExit,
}: {
  definition: Definition;
  onExit: () => void;
}) {
  const [values, setValues] = useState(() => defaults(d)),
    [draft, setDraft] = useState(() => defaults(d)),
    [errors, setErrors] = useState<string[]>([]),
    [revision, setRevision] = useState(0);
  const lesson = useMemo(
      () => (d.pending ? null : build(d, values)),
      [d, values],
    ),
    alternatives = useMemo(() => {
      if (d.pending) return null;
      const transfer = variant(d, values);
      return {
        transfer,
        retry: variant(d, values, [transfer]),
        recordId: d.id,
      };
    }, [d, values]);
  return (
    <main className="page-width pdf-lesson">
      <button className="back-link" onClick={onExit}>
        ← 返回八份错题本
      </button>
      <div className="eyebrow">
        {d.book}册 · {books[d.book - 1].time} · 原题{d.n}
      </div>
      <h1>{d.title}</h1>
      {d.pending ? (
        <section className="paper">
          <h2>这道题先留待核对</h2>
          <p>{d.pending}</p>
          <p>其他题仍可正常学习。补齐题目要求后，再为它加入正确动画。</p>
        </section>
      ) : (
        <>
          <details className="pdf-config">
            <summary>⚙ 调整条件和数字</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const es = validate(d, draft);
                setErrors(es);
                if (!es.length) {
                  setValues({ ...draft });
                  setRevision((r) => r + 1);
                }
              }}
            >
              <div className="pdf-field-grid">
                {d.fields.map((f) => (
                  <label key={f.key}>
                    {f.label}
                    {f.choices ? (
                      <select
                        aria-label={f.label}
                        value={draft[f.key]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [f.key]: Number(e.target.value),
                          })
                        }
                      >
                        {f.choices.map((label, i) => (
                          <option key={i} value={i}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
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
              {errors.length > 0 && (
                <div role="alert">
                  {errors.map((e) => (
                    <p key={e}>{e}</p>
                  ))}
                </div>
              )}
              <p>
                应用后建立新的练习会话；条件、物体、提示和答案一起更新。旧记录保留。刷新恢复原始条件。
              </p>
              <button className="primary">应用条件，重新开始</button>
            </form>
          </details>
          <OriginalQuestion
            entryId={d.id}
            story={build(d, defaults(d)).story}
            prompts={build(d, defaults(d)).tasks.map((t) => t.prompt)}
            source={`${d.book}册 · 原题${d.n}`}
          />
          {d.note && <p className="wb-source-note">题图说明：{d.note}</p>}
          <PdfSession
            key={d.id + ":" + revision}
            lesson={lesson!}
            values={values}
            alternatives={alternatives!}
            onExit={onExit}
          />
        </>
      )}
    </main>
  );
}
