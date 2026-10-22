import { useState } from "react";
import { mathLibrary, type LibraryEntry } from "./catalog";
export function OriginalQuestion({
  story,
  prompts,
  source,
}: {
  story: string;
  prompts: string[];
  source?: string;
}) {
  return (
    <section className="original-question" aria-label="原题与问题">
      <span>原题 · 原始条件{source ? " / " + source : ""}</span>
      <p>{story}</p>
      <ol>
        {prompts.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ol>
      <small>
        题干和图示按已录入的题本内容重绘整理，不发布原扫描与手写作答。调整条件后的题目在下方同步更新。
      </small>
    </section>
  );
}
export function Library({
  choose,
  back,
}: {
  choose: (e: LibraryEntry) => void;
  back: () => void;
}) {
  const [topic, setTopic] = useState("全部"),
    [search, setSearch] = useState(""),
    [limit, setLimit] = useState(24);
  const topics = ["全部", ...new Set(mathLibrary.map((e) => e.topic))],
    rows = mathLibrary.filter(
      (e) =>
        (topic === "全部" || e.topic === topic) &&
        `${e.title} ${e.story} ${e.prompts.join(" ")} ${e.source}`.includes(
          search,
        ),
    );
  return (
    <main className="page-width question-library">
      <button onClick={back}>← 回到冒险地图</button>
      <h1>按题型找原题</h1>
      <p>
        同类题放在一起。先读清原题和条件，再看动画，最后亲手做题和挑战新数字。
      </p>
      <nav aria-label="数学题型">
        {topics.map((t) => (
          <button
            key={t}
            aria-pressed={topic === t}
            onClick={() => {
              setTopic(t);
              setLimit(24);
            }}
          >
            {t} ·{" "}
            {t === "全部"
              ? mathLibrary.length
              : mathLibrary.filter((e) => e.topic === t).length}
          </button>
        ))}
      </nav>
      <label>
        搜索题目、条件或来源
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLimit(24);
          }}
          placeholder="例如：余数、15人、钟表"
        />
      </label>
      <p role="status">
        找到 {rows.length} 道题 · 已显示 {Math.min(limit, rows.length)} 道
      </p>
      <div className="library-grid">
        {rows.slice(0, limit).map((e) => (
          <article key={e.id}>
            <small>
              {e.topic} / {e.source}
            </small>
            <h2>{e.title}</h2>
            <p>{e.story}</p>
            <ul>
              {e.prompts.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            <button disabled={!!e.pending} onClick={() => choose(e)}>
              {e.pending ? "题干待核对" : "看动画，再做对应练习 →"}
            </button>
          </article>
        ))}
      </div>
      {rows.length > limit && (
        <button onClick={() => setLimit((n) => n + 24)}>再显示24道</button>
      )}
      {!rows.length && <p>试试别的关键词，或选择“全部”。</p>}
    </main>
  );
}
