import { useEffect, useRef } from "react";
import type { ClockSnapshot } from "../animation/timeline";
import {
  animals,
  patterns,
  type LevelId,
  type Question,
} from "../questions/data";

export type SceneProps = {
  level: LevelId;
  question: Question;
  index: number;
  transfer: boolean;
  observing: boolean;
  animation: ClockSnapshot;
  hint: number;
  solved: boolean;
  paused: boolean;
  coins: (number | null)[];
  setCoins: (v: (number | null)[]) => void;
  placements: Record<string, string>;
  setPlacements: (v: Record<string, string>) => void;
  selected: string | null;
  setSelected: (v: string | null) => void;
  merge: boolean;
  setMerge: (v: boolean) => void;
  guiding: boolean;
  explaining: boolean;
};
const lerp = (a: number, b: number, p: number) =>
  a + (b - a) * Math.max(0, Math.min(1, p));
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
function Coin({
  x,
  y,
  n,
  onClick,
  selected = false,
}: {
  x: number;
  y: number;
  n: number;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <g
      transform={"translate(" + x + " " + y + ")"}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? "选择第" + (n + 1) + "枚金币" : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={onClick ? "svg-button" : ""}
    >
      {onClick && <circle r="21" fill="transparent" />}
      <circle
        r="13"
        fill="#ffd468"
        stroke={selected ? "#3b6292" : "#d9a338"}
        strokeWidth={selected ? 4 : 2}
      />
      <path
        d="M-4 -5 H4 M0 -7 V7 M-4 5 H4"
        stroke="#a76d1f"
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
}
function Toy({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      <text textAnchor="middle" fontSize="39" y="5">
        🧸
      </text>
      {label && (
        <text textAnchor="middle" y="32" fontSize="16" fill="#654a38">
          {label}
        </text>
      )}
    </g>
  );
}
function Shop(p: SceneProps) {
  const { animation: a, coins, setCoins, paused, selected, setSelected } = p;
  const observing = p.observing || (p.guiding && p.question.id === "total");
  const canShare =
    !observing && !p.transfer && p.question.interaction === "coins";
  const demo = p.guiding && !p.transfer && p.question.id === "share";
  const demoCount = demo
    ? Math.min(12, p.animation.frame + (p.animation.progress >= 0.6 ? 1 : 0))
    : 0;
  const displayCoins = demo
    ? range(12).map((i) => (i < demoCount ? i % 2 : null))
    : coins;
  const count = (side: number) => displayCoins.filter((v) => v === side).length;
  const give = (side: number) => {
    if (paused || !canShare || demo || p.solved) return;
    const idx = selected?.startsWith("coin")
      ? Number(selected.slice(4))
      : coins.indexOf(null);
    if (idx < 0 || coins[idx] !== null) return;
    const next = [...coins];
    next[idx] = side;
    setCoins(next);
    setSelected(null);
  };
  const placedToy = observing ? Math.max(0, Math.min(4, a.frame)) : 4;
  const paid = observing
    ? a.frame === 0
      ? 0
      : a.frame <= 4
        ? (a.frame - 1) * 3 + Math.min(3, Math.floor(a.progress * 3.99))
        : 12
    : 12;
  return (
    <div className="scene shop-scene">
      <div className="scene-top">
        <span className="scene-label">小熊玩具铺</span>
        <span className="pill">每只 3 元</span>
      </div>
      {!p.transfer && (
        <p className="scene-math-readout" aria-live="polite">
          每只 3 元 · 收银台 {paid} 枚金币
        </p>
      )}
      {p.transfer ? (
        <div className="transfer-sketch">
          <p>新的购物篮，试着自己画一画、算一算。</p>
          <div className="toy-strip">
            {range(3).map((i) => (
              <span key={i}>
                🧸<small>4元</small>
              </span>
            ))}
          </div>
          <p>同样的钱 → 另买 2 只玩具</p>
          <div className="toy-strip">
            <span>🧸</span>
            <span>🧸</span>
          </div>
        </div>
      ) : (
        <svg
          viewBox="0 0 640 400"
          className="math-svg"
          aria-label="4只玩具，每只3元；12枚金币平均分配给两个玩具"
        >
          <rect
            x="25"
            y="90"
            width="280"
            height="86"
            rx="18"
            fill="#f9dfc9"
            stroke="#c59978"
            strokeDasharray="5 5"
          />
          <text x="35" y="78" fontSize="16" fill="#694c3c">
            阳阳的购物篮
          </text>
          {range(placedToy).map((i) => (
            <Toy
              key={i}
              x={
                i === placedToy - 1 && observing && a.frame <= 4
                  ? lerp(-30, 65 + i * 65, a.progress)
                  : 65 + i * 65
              }
              y={120}
              label="3元"
            />
          ))}
          <rect
            x="350"
            y="82"
            width="265"
            height="102"
            rx="16"
            fill="#fff9e9"
            stroke="#d5bd81"
          />
          <text x="365" y="69" fontSize="16" fill="#694c3c">
            收银台：{paid} 枚金币
          </text>
          {observing &&
            a.frame <= 4 &&
            range(paid).map((i) => (
              <Coin
                key={i}
                n={i}
                x={lerp(
                  290,
                  377 + (i % 6) * 40,
                  Math.min(1, a.progress * 3 - (i % 3) + 1),
                )}
                y={113 + Math.floor(i / 6) * 42}
              />
            ))}
          <text x="28" y="215" className="equation">
            {observing && a.frame < 5 ? "每只3元，逐只付钱" : "4 × 3 ＝ 12 元"}
          </text>
          <text x="28" y="250" fontSize="16" fill="#694c3c">
            乐乐：同样的总钱数，买2只玩具
          </text>
          <rect
            x="23"
            y="268"
            width="594"
            height="112"
            rx="18"
            fill="#fff5e5"
          />
          {[0, 1].map((side) => (
            <g key={side}>
              <rect
                x={side === 0 ? 28 : 438}
                y="274"
                width="172"
                height="100"
                rx="14"
                fill="#f4e0c9"
                stroke="#d9b48f"
              />
              <Toy x={side === 0 ? 61 : 472} y={310} />
              <text
                x={side === 0 ? 116 : 525}
                y="298"
                fontSize="15"
                fill="#694c3c"
              >
                {count(side)} 枚
              </text>
              {range(12)
                .filter((i) => displayCoins[i] === side)
                .map((i, j) => (
                  <Coin
                    key={i}
                    n={i}
                    x={(side === 0 ? 85 : 495) + (j % 4) * 28}
                    y={316 + Math.floor(j / 4) * 24}
                  />
                ))}
            </g>
          ))}
          {(!observing || a.frame >= 5) &&
            range(12)
              .filter((i) => displayCoins[i] === null)
              .map((i) => (
                <Coin
                  key={i}
                  n={i}
                  x={
                    observing
                      ? lerp(377 + (i % 6) * 40, 237 + (i % 4) * 43, a.progress)
                      : 237 + (i % 4) * 43
                  }
                  y={
                    observing
                      ? lerp(
                          113 + Math.floor(i / 6) * 42,
                          282 + Math.floor(i / 4) * 38,
                          a.progress,
                        )
                      : 282 + Math.floor(i / 4) * 38
                  }
                  selected={selected === "coin" + i}
                  onClick={
                    canShare && !paused && !demo
                      ? () => setSelected("coin" + i)
                      : undefined
                  }
                />
              ))}
        </svg>
      )}
      {canShare && (
        <div className="coin-controls">
          <p>先点一枚金币，再点玩具；也可以直接点下面按钮，每次分1枚。</p>
          <div className="button-row">
            <button
              disabled={paused || demo || p.solved}
              onClick={() => give(0)}
            >
              给左边玩具 1 枚
            </button>
            <button
              disabled={paused || demo || p.solved}
              onClick={() => give(1)}
            >
              给右边玩具 1 枚
            </button>
            <button
              className="quiet"
              disabled={paused || p.solved}
              onClick={() => {
                setCoins(Array(12).fill(null));
                setSelected(null);
              }}
            >
              重新分配
            </button>
          </div>
          <p aria-live="polite">
            左边 {count(0)} 枚 · 右边 {count(1)} 枚 · 还剩{" "}
            {displayCoins.filter((v) => v === null).length} 枚
          </p>
          {(p.solved || demo) && (
            <p className="earned-equation">12 ÷ 2 ＝ 6 元</p>
          )}
        </div>
      )}
    </div>
  );
}
const dotPosition = (i: number, total: number, x = 30, y = 60) => ({
  x: x + (i % Math.min(total, 9)) * 27,
  y: y + Math.floor(i / Math.min(total, 9)) * 30,
});
function Shapes(p: SceneProps) {
  const a = p.animation;
  const triangle = p.observing ? a.frame >= 3 : p.question.id === "triangle";
  const count = triangle ? 16 : 18,
    groups = triangle ? 4 : 3,
    each = count / groups;
  const distributing = p.observing
    ? triangle
      ? a.frame === 4
      : a.frame === 1
    : true;
  const distributed = p.observing
    ? triangle
      ? a.frame >= 5
      : a.frame >= 2
    : true;
  const progress =
    p.guiding && !p.transfer && p.index < 2
      ? Math.min(1, (a.frame + a.progress) / 2)
      : distributed
        ? 1
        : distributing
          ? a.progress
          : 0;
  const calculation = !p.observing && !p.transfer && p.index >= 2;
  const product = p.question.id === "product";
  const showResult = p.solved || p.hint >= 2;
  return (
    <div className="scene shape-scene">
      <div className="scene-top">
        <span className="scene-label">能量实验站</span>
        <span className="pill">相同图形 · 相同的数</span>
      </div>
      {!p.transfer && (
        <p className="scene-math-readout">
          {calculation
            ? "☆＝6，△＝4 · " + (product ? "6组，每组4个" : "把6个和4个合起来")
            : count +
              " 点能量 → " +
              groups +
              " 个格子" +
              (progress === 1 ? " · 每格 " + each + " 点" : "")}
        </p>
      )}
      {p.transfer ? (
        <div className="transfer-sketch">
          <div className="symbol-line">○ ＋ ○ ＝ 14</div>
          <div className="symbol-line">□ ＋ □ ＋ □ ＝ 12</div>
          <p>先找出图形的秘密，再看清 ＋ 或 ×。</p>
        </div>
      ) : (
        <svg
          viewBox="0 0 640 360"
          className="math-svg"
          aria-label={
            calculation ? "星星6，三角形4，探索加法和乘法" : "能量点平均分配"
          }
        >
          {!calculation ? (
            <>
              <text x="320" y="42" textAnchor="middle" className="equation">
                {range(groups)
                  .map(() => (triangle ? "△" : "☆"))
                  .join(" ＋ ")}{" "}
                ＝ {count}
              </text>
              {range(groups).map((g) => (
                <g key={g}>
                  <rect
                    x={20 + g * (600 / groups)}
                    y="145"
                    width={580 / groups}
                    height="182"
                    rx="18"
                    fill={triangle ? "#e0f0ee" : "#eee4ff"}
                    stroke="#bbb1d2"
                  />
                  <text
                    x={20 + g * (600 / groups) + 290 / groups}
                    y="185"
                    textAnchor="middle"
                    fontSize="36"
                  >
                    {triangle ? "△" : "☆"}
                  </text>
                  {progress === 1 && (
                    <text
                      x={20 + g * (600 / groups) + 290 / groups}
                      y="311"
                      textAnchor="middle"
                      fontSize="18"
                    >
                      {each} 点能量
                    </text>
                  )}
                </g>
              ))}
              {range(count).map((i) => {
                const start = dotPosition(i, count, 199, 72);
                const g = i % groups,
                  j = Math.floor(i / groups);
                return (
                  <circle
                    key={i}
                    cx={lerp(
                      start.x,
                      48 + g * (600 / groups) + (j % 3) * 35,
                      progress,
                    )}
                    cy={lerp(start.y, 219 + Math.floor(j / 3) * 32, progress)}
                    r="10"
                    fill={triangle ? "#47a68d" : "#a47cda"}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </>
          ) : (
            <>
              <text
                x="210"
                y="45"
                textAnchor="middle"
                className="equation symbol-arrival"
              >
                ☆ ＝ 6
              </text>
              <text
                x="430"
                y="45"
                textAnchor="middle"
                className="equation symbol-arrival triangle-arrival"
              >
                △ ＝ 4
              </text>
              <text x="320" y="93" textAnchor="middle" className="equation">
                6 {product ? "×" : "＋"} 4 ＝{" "}
                {showResult ? (product ? "24" : "10") : "？"}
              </text>
              {product
                ? range(24).map((i) => (
                    <g
                      key={i}
                      className="multiplication-group"
                      style={{ animationDelay: Math.floor(i / 4) * 0.3 + "s" }}
                    >
                      <circle
                        cx={210 + (i % 4) * 58}
                        cy={132 + Math.floor(i / 4) * 36}
                        r="11"
                        fill="#9b83d5"
                      />
                      {i % 4 === 0 && (
                        <text
                          x="160"
                          y={138 + Math.floor(i / 4) * 36}
                          fontSize="14"
                        >
                          第{Math.floor(i / 4) + 1}组
                        </text>
                      )}
                    </g>
                  ))
                : range(10).map((i) => (
                    <g
                      key={i}
                      className="energy-dot"
                      style={{
                        transform:
                          p.merge || p.hint >= 2
                            ? "translate(0px, 0px)"
                            : "translate(" +
                              (i < 6 ? -35 : 35) +
                              "px, " +
                              (i < 6 ? -10 : 40) +
                              "px)",
                      }}
                    >
                      <circle
                        cx={98 + i * 49}
                        cy="217"
                        r="17"
                        fill={i < 6 ? "#b38ade" : "#53aa98"}
                      />
                      {(p.merge || p.hint >= 2) && (
                        <text
                          x={98 + i * 49}
                          y="261"
                          textAnchor="middle"
                          fontSize="18"
                          className="count-in"
                          style={{ animationDelay: i * 0.22 + "s" }}
                        >
                          {i + 1}
                        </text>
                      )}
                    </g>
                  ))}
            </>
          )}
        </svg>
      )}
      {calculation && !product && (
        <button disabled={p.paused} onClick={() => p.setMerge(!p.merge)}>
          {p.merge ? "把能量分开" : "合并能量，逐个数一数"}
        </button>
      )}
      <p className="scene-caption">
        {calculation
          ? product
            ? "乘法：6组，每组4个。"
            : "加法：把6个和4个合起来。"
          : "让能量点公平地住进每个格子。"}
      </p>
    </div>
  );
}
function Dragonfly() {
  return (
    <svg viewBox="0 0 50 40" aria-hidden="true">
      <ellipse
        cx="14"
        cy="14"
        rx="13"
        ry="5"
        fill="#a8e0e1"
        transform="rotate(20 14 14)"
      />
      <ellipse
        cx="36"
        cy="14"
        rx="13"
        ry="5"
        fill="#a8e0e1"
        transform="rotate(-20 36 14)"
      />
      <ellipse cx="14" cy="23" rx="12" ry="4" fill="#b7e9e6" />
      <ellipse cx="36" cy="23" rx="12" ry="4" fill="#b7e9e6" />
      <path d="M25 9V36" stroke="#3d787c" strokeWidth="4" />
      <circle cx="25" cy="7" r="5" fill="#3d787c" />
    </svg>
  );
}
function Detective(p: SceneProps) {
  const mode = p.question.interaction || "animals";
  const isPattern = p.transfer;
  const groupNames =
    mode === "habitat"
      ? ["天上飞", "水里游"]
      : mode === "color"
        ? ["红色", "蓝色", "黄色"]
        : mode === "form"
          ? ["圆形", "三角形", "正方形"]
          : ["蝴蝶", "蜻蜓", "鱼"];
  const objects = isPattern
    ? patterns.map((x) => ({
        id: x.id,
        label: x.color + x.form,
        group: mode === "color" ? x.color : x.form,
        color: x.color,
        form: x.form,
        icon: "",
      }))
    : animals.map((x) => ({
        id: x.id,
        label: x.kind,
        group: mode === "habitat" ? x.habitat : x.kind,
        color: "",
        form: "",
        icon: x.icon,
      }));
  const placements = p.explaining
    ? Object.fromEntries(
        objects
          .slice(0, Math.max(0, p.animation.frame))
          .map((o) => [o.id, o.group]),
      )
    : p.placements;
  const counts = groupNames.map(
    (g) => objects.filter((o) => placements[o.id] === g).length,
  );
  const assigned = objects.filter((o) => placements[o.id]).length;
  const move = (id: string, group: string) => {
    if (p.paused || p.observing || p.solved) return;
    p.setPlacements({ ...p.placements, [id]: group });
    p.setSelected(null);
  };
  const selectedLabel = objects.find((o) => o.id === p.selected)?.label;
  return (
    <div className="scene detective-scene">
      <div className="scene-top">
        <span className="scene-label">
          {isPattern ? "图案工作室" : "动物朋友聚会"}
        </span>
        <span className="pill">{isPattern ? "12 个图案" : "20 位朋友"}</span>
      </div>
      <p className="scene-caption">
        先点一个{isPattern ? "图案" : "动物"}，再点分类框。也可以拖动。
        {selectedLabel
          ? "已选：" + selectedLabel
          : "点已分类的朋友可以重新放置。"}
      </p>
      <div className="classification-field" aria-label="可操作的分类场景">
        <div className="source-label">
          还没分类：{objects.length - assigned}
        </div>
        {groupNames.map((g, idx) => (
          <div
            key={g}
            className="drop-zone"
            style={{
              left: (idx * 100) / groupNames.length + 1 + "%",
              width: 100 / groupNames.length - 2 + "%",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              move(e.dataTransfer.getData("text/plain"), g);
            }}
          >
            <button
              className="drop-action"
              disabled={p.paused || p.observing || p.solved}
              onClick={() => {
                if (p.selected) move(p.selected, g);
              }}
              aria-label={"放入" + g}
            >
              {g} <b>{counts[idx]}</b>
            </button>
          </div>
        ))}
        {objects.map((o, i) => {
          const dest = placements[o.id];
          const groupIndex = groupNames.indexOf(dest);
          const ordered = objects
            .filter((x) => placements[x.id] === dest)
            .findIndex((x) => x.id === o.id);
          const inGroup = groupIndex >= 0;
          const columns = groupNames.length === 2 ? 3 : 2;
          const left = inGroup
            ? ((groupIndex + ((ordered % columns) + 0.6) / (columns + 0.1)) *
                100) /
              groupNames.length
            : 10 + (i % 5) * 20;
          const top = inGroup
            ? 64 +
              Math.floor(ordered / columns) * (groupNames.length === 2 ? 7 : 9)
            : 12 + Math.floor(i / 5) * 10;
          return (
            <button
              key={o.id}
              data-object-id={o.id}
              title={o.label}
              aria-label={
                o.label + " " + (i + 1) + (dest ? "，在" + dest : "，未分类")
              }
              className={
                "animal-token " +
                (p.selected === o.id ? "selected " : "") +
                (p.hint >= 2 && !dest ? "unplaced-highlight " : "") +
                (o.form
                  ? "pattern-token"
                  : "ambient-" +
                    (o.icon === "🐟"
                      ? "fish"
                      : o.icon === "🦋"
                        ? "butterfly"
                        : "dragonfly"))
              }
              style={{
                left: left + "%",
                top: top + "%",
                animationDelay: (i % 5) * 0.25 + "s",
              }}
              draggable={!p.paused && !p.observing && !p.solved}
              disabled={p.paused || p.observing || p.solved}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", o.id);
                p.setSelected(o.id);
              }}
              onClick={() => p.setSelected(p.selected === o.id ? null : o.id)}
            >
              {o.form ? (
                <span
                  className={
                    "pattern " +
                    (o.form === "圆形"
                      ? "circle"
                      : o.form === "三角形"
                        ? "triangle"
                        : "square")
                  }
                  style={
                    {
                      "--pattern-color":
                        o.color === "红色"
                          ? "#d66d69"
                          : o.color === "蓝色"
                            ? "#5799c2"
                            : "#e4af43",
                    } as React.CSSProperties
                  }
                />
              ) : o.icon === "蜻蜓" ? (
                <Dragonfly />
              ) : (
                <span>{o.icon}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="classification-sum" aria-live="polite">
        {counts.join(" ＋ ")} ＝ {assigned}　/　{objects.length}
      </p>
      {p.solved && (
        <p className="earned-equation">
          {mode === "habitat"
            ? "14＋6＝20，分类标准变了，总数不变！"
            : isPattern
              ? "两种分类，总数都是12。"
              : "8＋6＋6＝20，没有遗漏！"}
        </p>
      )}
      <button
        className="quiet"
        disabled={p.paused || p.solved}
        onClick={() => {
          p.setPlacements({});
          p.setSelected(null);
        }}
      >
        重新分类
      </button>
    </div>
  );
}
function Person({
  x,
  y,
  center,
  highlight,
  label,
}: {
  x: number;
  y: number;
  center: boolean;
  highlight: boolean;
  label?: number;
}) {
  return (
    <g transform={"translate(" + x + " " + y + ")"}>
      {highlight && (
        <circle cy="7" r="22" fill="#ffdf79" stroke="#d4a540" strokeWidth="2" />
      )}
      <circle cy="-9" r="8" fill="#efc3a0" />
      <path
        d="M-9 4 Q0 -1 9 4 L11 19 H-11Z"
        fill={center ? "#e27969" : "#62989e"}
      />
      <path
        d="M-5 19V26M5 19V26"
        stroke="#41616d"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {center && <path d="M-6 -17 L0 -24 L6 -17" fill="#e9b349" />}
      {label && (
        <g>
          <circle cx="17" cy="-19" r="17" fill="#3e676c" />
          <text x="17" y="-11" textAnchor="middle" fill="white" fontSize="24">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
function Square(p: SceneProps) {
  const side = p.transfer ? 3 : 5,
    center = Math.floor(side / 2),
    a = p.animation;
  const rank = center + 1;
  const frame = p.observing
    ? a.frame
    : p.guiding
      ? p.question.id === "side" || p.transfer
        ? a.frame + 5
        : a.frame + 17
      : -1;
  const direction =
    frame >= 5 && frame < 5 + 4 * rank ? Math.floor((frame - 5) / rank) : -1;
  const counted = direction >= 0 ? ((frame - 5) % rank) + 1 : 0;
  const rowStart = 5 + 4 * rank;
  const rowHighlight =
    frame >= rowStart && frame < rowStart + side ? frame - rowStart : -1;
  const point = (r: number, c: number) => ({
    x: 320 + (c - center) * (p.transfer ? 85 : 70),
    y: 76 + r * (p.transfer ? 90 : 62),
  });
  const path =
    direction === 0
      ? range(rank).map((r) => [r, center])
      : direction === 1
        ? range(rank).map((i) => [side - 1 - i, center])
        : direction === 2
          ? range(rank).map((c) => [center, c])
          : range(rank).map((i) => [center, side - 1 - i]);
  return (
    <div className="scene square-scene">
      <div className="scene-top">
        <span className="scene-label">阳光操场</span>
        <span className="pill">实心方阵 · 里面也有人</span>
      </div>
      {direction >= 0 && (
        <p className="scene-math-readout" aria-live="polite">
          {["从前往后", "从后往前", "从左往右", "从右往左"][direction]}：
          {range(counted)
            .map((i) => i + 1)
            .join(" → ")}
        </p>
      )}
      <svg
        viewBox="0 0 640 410"
        className="math-svg"
        aria-label={side + "行" + side + "列实心方阵"}
      >
        <rect
          x="78"
          y="28"
          width="484"
          height="350"
          rx="30"
          fill="#e4eee1"
          stroke="#c1d4bc"
        />
        <text x="320" y="23" textAnchor="middle" fontSize="17" fill="#617257">
          前
        </text>
        <text x="320" y="402" textAnchor="middle" fontSize="17" fill="#617257">
          后
        </text>
        <text x="52" y="210" fontSize="17" fill="#617257">
          左
        </text>
        <text x="575" y="210" fontSize="17" fill="#617257">
          右
        </text>
        {range(side * side).map((i) => {
          const r = Math.floor(i / side),
            c = i % side,
            t = point(r, c);
          const visible = !p.observing || a.frame >= 5 || r <= a.frame;
          const enter =
            p.observing && a.frame === r
              ? Math.max(0, Math.min(1, a.progress * 2 - c * 0.18))
              : 1;
          const mark =
            direction >= 0
              ? path.findIndex(([rr, cc]) => r === rr && c === cc)
              : -1;
          const manual = p.selected === String(r);
          return (
            <g key={i} data-position={r + "," + c}>
              <circle cx={t.x} cy={t.y + 11} r="5" fill="#b3c7a9" />
              {visible && (
                <Person
                  x={lerp(30, t.x, enter)}
                  y={lerp(365, t.y, enter)}
                  center={r === center && c === center}
                  highlight={
                    r === rowHighlight ||
                    manual ||
                    (mark >= 0 && mark < counted)
                  }
                  label={mark >= 0 && mark < counted ? mark + 1 : undefined}
                />
              )}
            </g>
          );
        })}
        {direction >= 0 && (
          <text
            x="320"
            y="365"
            textAnchor="middle"
            fontSize="21"
            fill="#3e676c"
          >
            {["从前往后", "从后往前", "从左往右", "从右往左"][direction]}：
            {range(counted)
              .map((i) => i + 1)
              .join(" → ")}
          </text>
        )}
      </svg>
      {!p.observing && (
        <div className="row-controls">
          <p>点一行，把这一行的小朋友点亮，再自己数一遍。</p>
          <div className="button-row">
            {range(side).map((r) => (
              <button
                key={r}
                aria-pressed={p.selected === String(r)}
                disabled={p.paused}
                onClick={() =>
                  p.setSelected(p.selected === String(r) ? null : String(r))
                }
              >
                第{r + 1}行
              </button>
            ))}
          </div>
        </div>
      )}
      {(p.solved || p.hint >= 2) && (
        <p className="earned-equation">
          {p.question.id === "side"
            ? "2 ＋ 1 ＋ 2 ＝ 5"
            : side + " × " + side + " ＝ " + side * side + " 人"}
        </p>
      )}
    </div>
  );
}
export default function Scenes(props: SceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const animations = ref.current?.getAnimations({ subtree: true }) ?? [];
    animations.forEach((a) => {
      if (props.paused) a.pause();
      else a.play();
    });
  }, [props.paused]);
  return (
    <div
      ref={ref}
      className={props.paused ? "scene-wrapper paused" : "scene-wrapper"}
    >
      {props.level === "shop" ? (
        <Shop {...props} />
      ) : props.level === "shapes" ? (
        <Shapes {...props} />
      ) : props.level === "detective" ? (
        <Detective {...props} />
      ) : (
        <Square {...props} />
      )}
    </div>
  );
}
