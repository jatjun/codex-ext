import { NotebookMap, NotebookLesson } from "./notebooks/Lab";
import type { Address } from "./notebooks/types";
import { useState } from "react";
import { PdfMap, PdfLesson } from "./pdf/Lab";
import { levels, type LevelId } from "./questions/data";
import type { Settings, QueueKind } from "./questions/models";
import { ConfiguredLesson, QueueMap } from "./components/Configuration";
import { readRecords } from "./records/store";
import { Report } from "./components/Report";
function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">✳</span>
      <span>
        Math Adventure<small>数学错题动画实验室</small>
      </span>
    </div>
  );
}
export default function App() {
  const [notebook, setNotebook] = useState<Address | null>(null);
  const [pdfId, setPdfId] = useState<number | null>(null);
  const [queueKind, setQueueKind] = useState<QueueKind | null>(null);
  const [page, setPage] = useState<
      LevelId | "home" | "report" | "pdf" | "notebooks"
    >("home"),
    [visit, setVisit] = useState(0);
  const completed = (id: LevelId) => {
    const l = levels.find((l) => l.id === id)!,
      rows = readRecords().filter((r) => r.levelId === id);
    return [...new Set(rows.map((r) => r.session))].some((s) =>
      [...l.questions, ...l.transfer].every((q) =>
        rows.some(
          (r) => r.session === s && r.questionId === q.id && r.completed,
        ),
      ),
    );
  };
  const navigate = (p: typeof page) => {
    setPage(p);
    setQueueKind(null);
    setPdfId(null);
    setNotebook(null);
    setVisit((v) => v + 1);
    window.scrollTo({ top: 0 });
  };
  return (
    <>
      <header className="site-header">
        <div className="page-width header-inner">
          <button
            className="brand-button"
            onClick={() => navigate("home")}
            aria-label="回到冒险地图"
          >
            <Brand />
          </button>
          <button
            className={"parent-link " + (page === "report" ? "active" : "")}
            onClick={() => navigate("report")}
          >
            家长手记 <span>↗</span>
          </button>
        </div>
      </header>
      {page === "home" ? (
        <main className="home page-width">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <i /> LITTLE QUESTIONS. BIG DISCOVERIES.
              </div>
              <h1>
                让数学，
                <br />
                <span>在眼前动起来。</span>
                <svg viewBox="0 0 360 18" aria-hidden="true">
                  <path
                    d="M3 10Q170 -3 355 8"
                    fill="none"
                    stroke="#edb956"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </h1>
              <p>
                走进四个小小实验室。移动金币、解开图形密码，
                <br className="desktop-break" />
                在自己的尝试里，发现数学的道理。
              </p>
              <div className="hero-tags">
                <span>✧ 看得见</span>
                <span>↗ 动手试</span>
                <span>✓ 想明白</span>
              </div>
            </div>
            <div className="hero-lab" aria-label="数学探索插图">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="lab-star">✦</span>
              <span className="lab-note note-one">好奇心 ＋ 动手试</span>
              <div className="lab-board">
                <span>今天的发现</span>
                <div className="lab-dots">
                  {Array.from({ length: 10 }, (_, i) => (
                    <i
                      key={i}
                      style={{ background: i < 6 ? "#a78ac7" : "#e5ac77" }}
                    />
                  ))}
                </div>
                <strong>
                  6 ＋ 4 ＝ <em>？</em>
                </strong>
              </div>
              <span className="lab-toy">🧸</span>
              <span className="lab-note note-two">“我好像发现了！”</span>
              <span className="lab-triangle">△</span>
              <span className="lab-coin">¥</span>
            </div>
          </section>
          <section className="queue-feature nb-feature">
            <div>
              <span className="eyebrow">NEW / 两份新错题本</span>
              <h2>50道题，探索单位、运算与空间。</h2>
              <p>
                质量换算、两种方法、混合运算、立体折叠、观察视角、平移旋转与轴对称。
              </p>
            </div>
            <button className="primary" onClick={() => navigate("notebooks")}>
              进入两份新错题本 →
            </button>
          </section>
          <section className="queue-feature pdf-feature">
            <div>
              <span className="eyebrow">NEW / 错题本动画</span>
              <h2>21道错题，21次动手发现。</h2>
              <p>
                图形拆分、动物前后、数量关系、满减和购物比较。原题与可调数字变式。
              </p>
            </div>
            <button className="primary" onClick={() => navigate("pdf")}>
              进入错题本动画 →
            </button>
          </section>
          <section className="queue-feature">
            <div>
              <span className="eyebrow">NEW / 排队动画专题</span>
              <h2>从一条队伍，探索八种关系。</h2>
              <p>名次、间隔、实心队列、加入离开、交换位置。数字都能改。</p>
            </div>
            <button className="primary" onClick={() => navigate("queue")}>
              进入排队动画实验室 →
            </button>
          </section>
          <section className="map-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow">CHOOSE YOUR ADVENTURE</div>
                <h2>今天，想探索哪一个秘密？</h2>
              </div>
              <span className="map-note">4 个实验室 · 随时开始</span>
            </div>
            <div className="level-grid">
              {levels.map((l, i) => (
                <button
                  className={"level-card " + l.color}
                  key={l.id}
                  onClick={() => navigate(l.id)}
                >
                  <div className="card-top">
                    <span className="level-number">实验 0{i + 1}</span>
                    <span className="card-arrow">↗</span>
                  </div>
                  <div className={"card-art art-" + l.id}>
                    {l.id === "shop" ? (
                      <>
                        <span className="art-bear">🧸</span>
                        <span className="art-bear small-bear">🧸</span>
                        <i className="mini-coin">¥</i>
                        <i className="mini-coin coin-two">¥</i>
                      </>
                    ) : l.id === "shapes" ? (
                      <>
                        <span className="art-star">✦</span>
                        <span className="art-plus">＋</span>
                        <span className="art-triangle">△</span>
                        <span className="art-equal">＝ ?</span>
                      </>
                    ) : l.id === "detective" ? (
                      <>
                        <span className="art-butterfly">🦋</span>
                        <span className="art-fish">🐟</span>
                        <span className="art-magnifier">⌕</span>
                      </>
                    ) : (
                      <div className="mini-square">
                        {Array.from({ length: 25 }, (_, n) => (
                          <i key={n} className={n === 12 ? "center-dot" : ""} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="card-copy">
                    <span className="card-topic">
                      {
                        [
                          "两步应用题",
                          "乘除法与数字关系",
                          "分类统计与检查",
                          "方阵与位置",
                        ][i]
                      }
                    </span>
                    <h3>{l.title}</h3>
                    <p>{l.subtitle}</p>
                    <div className="card-bottom">
                      <span>
                        {completed(l.id) ? "✓ 已探索 · 再试一次" : "开始探索"}
                      </span>
                      <span>→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="learning-path">
            <span className="path-spark">✳</span>
            <div>
              <h3>答案很重要，找到方法更有趣。</h3>
              <p>
                看一看 <span>→</span> 动手试 <span>→</span> 说说道理{" "}
                <span>→</span> 独立再做
              </p>
            </div>
            <span className="path-note">
              慢慢来，
              <br />
              每一次尝试都算数。
            </span>
          </section>
        </main>
      ) : page === "notebooks" ? (
        notebook ? (
          <NotebookLesson
            key={notebook.book + notebook.number + ":" + visit}
            address={notebook}
            onExit={() => {
              setNotebook(null);
              window.scrollTo({ top: 0 });
            }}
          />
        ) : (
          <NotebookMap
            onChoose={(a) => {
              setNotebook(a);
              window.scrollTo({ top: 0 });
            }}
            onBack={() => navigate("home")}
          />
        )
      ) : page === "pdf" ? (
        pdfId ? (
          <PdfLesson
            key={pdfId + ":" + visit}
            id={pdfId}
            onExit={() => {
              setPdfId(null);
              window.scrollTo({ top: 0 });
            }}
          />
        ) : (
          <PdfMap
            onChoose={(id) => {
              setPdfId(id);
              window.scrollTo({ top: 0 });
            }}
            onBack={() => navigate("home")}
          />
        )
      ) : page === "report" ? (
        <Report onBack={() => navigate("home")} />
      ) : page === "queue" && !queueKind ? (
        <QueueMap onChoose={setQueueKind} onBack={() => navigate("home")} />
      ) : (
        <ConfiguredLesson
          key={page + visit + (queueKind ?? "")}
          id={page as keyof Settings | "queue"}
          queueKind={queueKind ?? undefined}
          onExit={() =>
            page === "queue" ? setQueueKind(null) : navigate("home")
          }
        />
      )}
      <footer className="site-footer page-width">
        <Brand />
        <p>
          为好奇心留一点空间。<span>学习记录仅保存在你的浏览器中。</span>
        </p>
        <span className="version">探索版 V1.3 · 适合 8–10 岁</span>
      </footer>
    </>
  );
}
