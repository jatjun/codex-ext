import { useEffect, useRef } from "react";
import { defaults, type LessonModel } from "../questions/models";
import { makeAnimals, makePatterns } from "../questions/builders";
import { QueueScene } from "./QueueScene";
import type { ClockSnapshot } from "../animation/timeline";
import { type LevelId, type Question } from "../questions/data";

export type SceneProps = {
  level: LevelId;
  model: LessonModel;
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
      data-coin={n}
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
  const a = p.animation,
    { count, price, groups } = p.model.shop,
    total = count * price,
    each = total / groups;
  const observing = p.observing || (p.guiding && p.question.id === "total");
  const canShare =
    !observing && !p.transfer && p.question.interaction === "coins";
  const demo = p.guiding && !p.transfer && p.question.id === "share";
  const demoCount = Math.min(total, a.frame + (a.progress >= 0.6 ? 1 : 0));
  const display = demo
    ? range(total).map((i) => (i < demoCount ? i % groups : null))
    : p.coins;
  const numbers = range(groups).map(
    (g) => display.filter((v) => v === g).length,
  );
  const cols = Math.min(6, Math.max(3, Math.floor((580 / groups - 30) / 30)));
  const basketHeight = Math.max(
    169,
    90 + Math.ceil(Math.max(each, ...numbers) / cols) * 29,
  );
  const give = (g: number) => {
    if (p.paused || !canShare || demo || p.solved) return;
    const chosen = p.selected?.startsWith("coin")
      ? Number(p.selected.slice(4))
      : p.coins.indexOf(null);
    if (chosen < 0 || p.coins[chosen] !== null) return;
    const next = [...p.coins];
    next[chosen] = g;
    p.setCoins(next);
    p.setSelected(null);
  };
  const toys = observing ? Math.max(0, Math.min(count, a.frame)) : count;
  const paid = observing
    ? a.frame === 0
      ? 0
      : a.frame <= count
        ? (a.frame - 1) * price +
          Math.min(price, Math.floor(a.progress * (price + 0.99)))
        : total
    : total;
  const source = (i: number) => ({
    x: 75 + (i % 8) * 70,
    y: 282 + Math.floor(i / 8) * 34,
  });
  const checkout = (i: number) => ({
    x: 372 + (i % 8) * 29,
    y: 105 + Math.floor(i / 8) * 30,
  });
  return (
    <div className="scene shop-scene">
      <div className="scene-top">
        <span className="scene-label">小熊玩具铺</span>
        <span className="pill">每只 {price} 元</span>
      </div>
      {!p.transfer && (
        <p className="scene-math-readout" aria-live="polite">
          每只 {price} 元 · 阳阳已付 {paid} 元
        </p>
      )}
      {p.transfer ? (
        <div className="transfer-sketch">
          <p>新购物篮，先自己画一画、算一算。</p>
          <div className="toy-strip">
            {range(count).map((i) => (
              <span key={i}>
                🧸<small>{price}元</small>
              </span>
            ))}
          </div>
          <p>同样的钱 → 另买 {groups} 只玩具</p>
          <div className="toy-strip">
            {range(groups).map((i) => (
              <span key={i}>🧸</span>
            ))}
          </div>
        </div>
      ) : (
        <svg
          viewBox={"0 0 640 " + (401 + basketHeight)}
          className="math-svg"
          aria-label={
            count +
            "只玩具，每只" +
            price +
            "元；金币平均分给" +
            groups +
            "只玩具"
          }
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
          <text x="35" y="78" fontSize="18" fill="#694c3c">
            阳阳的购物篮
          </text>
          {range(toys).map((i) => (
            <Toy
              key={i}
              x={
                i === toys - 1 && observing && a.frame <= count
                  ? lerp(-30, 48 + (i * 250) / count, a.progress)
                  : 48 + (i * 250) / count
              }
              y={120}
              label={price + "元"}
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
          <text x="355" y="69" fontSize="18" fill="#694c3c">
            {observing && a.frame <= count
              ? "收银台：" + paid + " 枚金币"
              : "总钱数：" + total + " 元"}
          </text>
          {observing &&
            a.frame <= count &&
            range(paid).map((i) => (
              <Coin
                key={i}
                n={i}
                x={lerp(
                  290,
                  checkout(i).x,
                  Math.min(1, a.progress * price - (i % price) + 1),
                )}
                y={checkout(i).y}
              />
            ))}
          <text x="28" y="217" className="equation">
            {observing && a.frame <= count
              ? "每只" + price + "元，逐只付钱"
              : count + " × " + price + " ＝ " + total + " 元"}
          </text>
          <text x="28" y="252" fontSize="18" fill="#694c3c">
            乐乐：同样的钱，买{groups}只玩具；待分金币
          </text>
          <rect
            x="28"
            y="262"
            width="584"
            height="108"
            rx="15"
            fill="#fff5df"
          />
          {(!observing || a.frame > count) &&
            range(total)
              .filter((i) => display[i] === null)
              .map((i) => (
                <Coin
                  key={i}
                  n={i}
                  x={
                    observing
                      ? lerp(checkout(i).x, source(i).x, a.progress)
                      : source(i).x
                  }
                  y={
                    observing
                      ? lerp(checkout(i).y, source(i).y, a.progress)
                      : source(i).y
                  }
                  selected={p.selected === "coin" + i}
                  onClick={
                    canShare && !p.paused && !demo
                      ? () => p.setSelected("coin" + i)
                      : undefined
                  }
                />
              ))}
          {range(groups).map((g) => {
            const left = 25 + (g * 600) / groups,
              width = 580 / groups;
            return (
              <g key={g}>
                <rect
                  x={left}
                  y="389"
                  width={width}
                  height={basketHeight}
                  rx="16"
                  fill="#f4e0c9"
                  stroke="#d9b48f"
                />
                <Toy x={left + width / 2} y={420} />
                <text
                  x={left + width / 2}
                  y="452"
                  textAnchor="middle"
                  fontSize="19"
                >
                  {numbers[g]} 枚
                </text>
                {range(total)
                  .filter((i) => display[i] === g)
                  .map((i, j) => {
                    return (
                      <Coin
                        key={i}
                        n={i}
                        x={
                          left + width / 2 + ((j % cols) - (cols - 1) / 2) * 30
                        }
                        y={479 + Math.floor(j / cols) * 29}
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>
      )}
      {canShare && (
        <div className="coin-controls">
          <p>先点金币再点下面按钮，也可以直接点按钮，每次分1枚。</p>
          <div className="button-row">
            {range(groups).map((g) => (
              <button
                key={g}
                disabled={p.paused || demo || p.solved}
                onClick={() => give(g)}
              >
                {groups === 2
                  ? g === 0
                    ? "给左边玩具 1 枚"
                    : "给右边玩具 1 枚"
                  : "给第" + (g + 1) + "只玩具 1 枚"}
              </button>
            ))}
            <button
              className="quiet"
              disabled={p.paused || p.solved}
              onClick={() => {
                p.setCoins(Array(total).fill(null));
                p.setSelected(null);
              }}
            >
              重新分配
            </button>
          </div>
          <p aria-live="polite">
            {groups === 2
              ? "左边 " + numbers[0] + " 枚 · 右边 " + numbers[1] + " 枚"
              : numbers
                  .map((n, i) => "第" + (i + 1) + "只 " + n + " 枚")
                  .join(" · ")}{" "}
            · 还剩 {display.filter((v) => v === null).length} 枚
          </p>
          {(p.solved || demo) && (
            <p className="earned-equation">
              {total} ÷ {groups} ＝ {each} 元
            </p>
          )}
        </div>
      )}
    </div>
  );
}
const dotPosition = (i: number, _total: number, x = 190, y = 65) => ({
  x: x + (i % 10) * 26,
  y: y + Math.floor(i / 10) * 24,
});
function Shapes(p: SceneProps) {
  const a = p.animation;
  const model = p.model.shapes;
  const star = model.starValue,
    tri = model.triangleValue;
  const triangle = p.observing ? a.frame >= 3 : p.question.id === "triangle";
  const count = triangle ? model.triangles * tri : model.stars * star,
    groups = triangle ? model.triangles : model.stars,
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
            ? "☆＝" +
              star +
              "，△＝" +
              tri +
              " · " +
              (product
                ? star + "组，每组" + tri + "个"
                : "把" + star + "个和" + tri + "个合起来")
            : count +
              " 点能量 → " +
              groups +
              " 个格子" +
              (progress === 1 ? " · 每格 " + each + " 点" : "")}
        </p>
      )}
      {p.transfer ? (
        <div className="transfer-sketch">
          <div className="symbol-line">○ ＋ ○ ＝ {model.stars * star}</div>
          <div className="symbol-line">
            □ ＋ □ ＋ □ ＝ {model.triangles * tri}
          </div>
          <p>先找出图形的秘密，再看清 ＋ 或 ×。</p>
        </div>
      ) : (
        <svg
          viewBox="0 0 640 360"
          className="math-svg"
          aria-label={
            calculation
              ? "星星" + star + "，三角形" + tri + "，探索加法和乘法"
              : "能量点平均分配"
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
                const start = dotPosition(i, count, 190, 65);
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
                ☆ ＝ {star}
              </text>
              <text
                x="430"
                y="45"
                textAnchor="middle"
                className="equation symbol-arrival triangle-arrival"
              >
                △ ＝ {tri}
              </text>
              <text x="320" y="93" textAnchor="middle" className="equation">
                {star} {product ? "×" : "＋"} {tri} ＝{" "}
                {showResult ? (product ? star * tri : star + tri) : "？"}
              </text>
              {product
                ? range(star * tri).map((i) => (
                    <g
                      key={i}
                      className="multiplication-group"
                      style={{
                        animationDelay: Math.floor(i / tri) * 0.3 + "s",
                      }}
                    >
                      <circle
                        cx={180 + ((i % tri) * 400) / Math.max(1, tri - 1)}
                        cy={
                          132 +
                          (Math.floor(i / tri) * 210) / Math.max(1, star - 1)
                        }
                        r="11"
                        fill="#9b83d5"
                      />
                      {i % tri === 0 && (
                        <text
                          x="100"
                          y={
                            138 +
                            (Math.floor(i / tri) * 210) / Math.max(1, star - 1)
                          }
                          fontSize="14"
                        >
                          第{Math.floor(i / tri) + 1}组
                        </text>
                      )}
                    </g>
                  ))
                : range(star + tri).map((i) => (
                    <g
                      key={i}
                      className="energy-dot"
                      style={{
                        transform:
                          p.merge || p.hint >= 2
                            ? "translate(0px, 0px)"
                            : "translate(" +
                              (i < star ? -35 : 35) +
                              "px, " +
                              (i < star ? -10 : 40) +
                              "px)",
                      }}
                    >
                      <circle
                        cx={
                          70 +
                          ((i % 10) * 500) /
                            Math.max(1, Math.min(10, star + tri) - 1)
                        }
                        cy={180 + Math.floor(i / 10) * 80}
                        r="17"
                        fill={i < star ? "#b38ade" : "#53aa98"}
                      />
                      {(p.merge || p.hint >= 2) && (
                        <text
                          x={
                            70 +
                            ((i % 10) * 500) /
                              Math.max(1, Math.min(10, star + tri) - 1)
                          }
                          y={219 + Math.floor(i / 10) * 80}
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
            ? "乘法：" + star + "组，每组" + tri + "个。"
            : "加法：把" + star + "个和" + tri + "个合起来。"
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
  const animals = makeAnimals(p.model.detective),
    patterns = makePatterns(p.model.detective.patternCount);
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
        <span className="pill">
          {isPattern ? patterns.length + " 个图案" : animals.length + " 位朋友"}
        </span>
      </div>
      <p className="scene-caption">
        先点一个{isPattern ? "图案" : "动物"}，再点分类框。也可以拖动。
        {selectedLabel
          ? "已选：" + selectedLabel
          : "点已分类的朋友可以重新放置。"}
      </p>
      <div
        className="classification-field"
        aria-label="可操作的分类场景"
        style={{
          height: Math.max(
            500,
            Math.ceil(objects.length / 5) * 70 + 100,
            Math.max(
              ...counts.map((n) =>
                Math.ceil(n / (groupNames.length === 2 ? 3 : 2)),
              ),
            ) *
              75 +
              150,
          ),
        }}
      >
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
              (Math.floor(ordered / columns) * 30) /
                Math.max(1, Math.ceil(Math.max(...counts) / columns) - 1)
            : 12 +
              (Math.floor(i / 5) * 28) /
                Math.max(1, Math.ceil(objects.length / 5) - 1);
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
            ? counts.join("＋") +
              "＝" +
              objects.length +
              "，分类标准变了，总数不变！"
            : isPattern
              ? "两种分类，总数都是" + objects.length + "。"
              : counts.join("＋") + "＝" + objects.length + "，没有遗漏！"}
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
  const side = p.model.square.rank * 2 - 1,
    center = Math.floor(side / 2),
    a = p.animation;
  const rank = center + 1;
  const frame = p.observing
    ? a.frame
    : p.guiding
      ? p.question.id === "side" || p.transfer
        ? a.frame + side
        : a.frame + side + 4 * rank
      : -1;
  const direction =
    frame >= side && frame < side + 4 * rank
      ? Math.floor((frame - side) / rank)
      : -1;
  const counted = direction >= 0 ? ((frame - side) % rank) + 1 : 0;
  const rowStart = side + 4 * rank;
  const rowHighlight =
    frame >= rowStart && frame < rowStart + side ? frame - rowStart : -1;
  const point = (r: number, c: number) => ({
    x: 320 + (c - center) * Math.min(85, 420 / Math.max(1, side - 1)),
    y: side === 1 ? 190 : 65 + r * Math.min(70, 250 / Math.max(1, side - 1)),
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
          const visible = !p.observing || a.frame >= side || r <= a.frame;
          const enter =
            p.observing && a.frame === r
              ? Math.max(
                  0,
                  Math.min(1, a.progress * (1 + (side - 1) * 0.14) - c * 0.14),
                )
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
            ? rank - 1 + " ＋ 1 ＋ " + (rank - 1) + " ＝ " + side
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
      {props.level === "queue" ? (
        <QueueScene {...props} />
      ) : props.level === "shop" ? (
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
