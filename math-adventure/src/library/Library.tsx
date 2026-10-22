import { PdfScene } from "../pdf/Scene";
import { useState, useLayoutEffect, useRef } from "react";
import { mathLibrary, originalLesson, type LibraryEntry } from "./catalog";
function StaticDiagram({ lesson }: { lesson: import("../pdf/model").Lesson }) {
  const ref = useRef<HTMLDivElement>(null),
    [src, setSrc] = useState("");
  useLayoutEffect(() => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const copy = svg.cloneNode(true) as SVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const source = [svg, ...svg.querySelectorAll("*")],
      target = [copy, ...copy.querySelectorAll("*")];
    source.forEach((node, i) => {
      const style = getComputedStyle(node);
      for (const k of [
        "fill",
        "stroke",
        "font-size",
        "font-family",
        "font-weight",
        "opacity",
      ])
        if (style.getPropertyValue(k))
          (target[i] as SVGElement).style.setProperty(
            k,
            style.getPropertyValue(k),
          );
    });
    setSrc(
      "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(new XMLSerializer().serializeToString(copy)),
    );
  }, []);
  if (src)
    return (
      <img
        src={src}
        alt="原题静态示意图"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    );
  return (
    <div ref={ref} inert aria-hidden="true">
      <PdfScene
        scene={lesson.scene}
        task={lesson.tasks[0]}
        frame={0}
        progress={0}
        running={false}
        paused
        selected={[]}
        onSelect={() => {}}
        grouped={false}
        onGroup={() => {}}
        counts={
          lesson.scene.type === "shop" ? lesson.scene.items.map(() => 0) : []
        }
        onCount={() => {}}
        counting={false}
        demonstrating={false}
      />
    </div>
  );
}
export function OriginalQuestion({
  story,
  prompts,
  source,
  entryId,
  snapshot,
}: {
  story: string;
  prompts: string[];
  source?: string;
  entryId?: string;
  snapshot?: import("../pdf/model").Lesson;
}) {
  const original = entryId
    ? mathLibrary.find((e) => e.id === entryId)
    : undefined;
  const diagram = snapshot || (entryId ? originalLesson(entryId) : undefined);
  return (
    <section className="original-question" aria-label="原题与问题">
      <span>原题 · 原始条件{source ? " / " + source : ""}</span>
      <p>{original?.story || story}</p>
      <ol>
        {(original?.prompts || prompts).map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ol>
      {diagram && (
        <div
          className="original-diagram"
          role="img"
          aria-label="原题静态示意图，数量与上方条件对应"
        >
          <StaticDiagram key={JSON.stringify(diagram.scene)} lesson={diagram} />
          <small>原题静态示意图 · 动画与动手练习在下方</small>
        </div>
      )}
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
