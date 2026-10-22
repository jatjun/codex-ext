import { WorkbookCanvas } from "../workbooks/Scene";
import { AdvancedScene } from "../notebooks/Scene";
import type { CSSProperties } from "react";
import {
  demonstrationCounts,
  basketTotal,
  payable,
  type Scene,
  type Piece,
  type Task,
} from "./model";
const mix = (a: number, b: number, t: number) =>
  a + (b - a) * Math.max(0, Math.min(1, t));
const colors = [
  "#8b6cb6",
  "#328eaa",
  "#dc8654",
  "#4c987c",
  "#c283ba",
  "#bd931f",
];
export function ShapeGlyph({ piece: p }: { piece: Piece }) {
  const fill =
    p.kind === "蓝色三角形"
      ? "#27a6e1"
      : p.kind === "绿色三角形"
        ? "#7cb342"
        : "#fff9ec";
  const attrs = {
    fill,
    stroke: "#344a56",
    strokeWidth: 2.5,
    vectorEffect: "non-scaling-stroke" as const,
  };
  return (
    <g transform={`rotate(${p.rotate ?? 0} ${p.w / 2} ${p.h / 2})`}>
      {p.kind === "圆" ? (
        <ellipse
          cx={p.w / 2}
          cy={p.h / 2}
          rx={p.w / 2}
          ry={p.h / 2}
          {...attrs}
        />
      ) : p.kind.includes("三角形") ? (
        <polygon points={`0,${p.h} ${p.w / 2},0 ${p.w},${p.h}`} {...attrs} />
      ) : p.kind === "平行四边形" ? (
        <polygon
          points={`${p.w * 0.25},0 ${p.w},0 ${p.w * 0.75},${p.h} 0,${p.h}`}
          {...attrs}
        />
      ) : (
        <rect width={p.w} height={p.h} {...attrs} />
      )}
    </g>
  );
}
function Solid({ kind }: { kind: string }) {
  return kind === "球" ? (
    <g>
      <circle r="21" fill="#f5d785" stroke="#63543c" />
      <path d="M-19-6Q0 12 19-6M-6-20Q10 0-6 20" fill="none" stroke="#63543c" />
    </g>
  ) : kind === "圆柱" ? (
    <g fill="#a8d9d1" stroke="#396e68">
      <path d="M-20-18V18C-20 30 20 30 20 18V-18Z" />
      <ellipse cy="-18" rx="20" ry="8" />
    </g>
  ) : (
    <g fill={kind === "正方体" ? "#b4a0d6" : "#96c8df"} stroke="#4a526d">
      <path
        d={`M-22-15L-9-26H${kind === "正方体" ? 22 : 35}V12L${kind === "正方体" ? 9 : 22} 23H-22Z`}
      />
      <path
        d={`M-22-15H${kind === "正方体" ? 9 : 22}V23M${kind === "正方体" ? 9 : 22}-15L${kind === "正方体" ? 22 : 35}-26`}
        fill="none"
      />
    </g>
  );
}
export function PdfScene({
  scene,
  paused = false,
  task,
  frame,
  progress,
  running,
  selected,
  onSelect,
  grouped,
  onGroup,
  counts,
  onCount,
  counting,
  demonstrating,
}: {
  scene: Scene;
  paused?: boolean;
  task: Task;
  frame: number;
  progress: number;
  running: boolean;
  selected: string[];
  onSelect: (id: string) => void;
  grouped: boolean;
  onGroup: () => void;
  counts: number[];
  onCount: (i: number, delta: number) => void;
  counting: boolean;
  demonstrating: boolean;
}) {
  if (scene.type === "workbook")
    return (
      <WorkbookCanvas
        {...{
          scene,
          task,
          frame,
          progress,
          running,
          paused,
          selected,
          onSelect,
          grouped,
          demonstrating,
        }}
      />
    );
  if (scene.type === "extension")
    return (
      <AdvancedScene
        spec={scene.spec}
        task={task}
        frame={frame}
        progress={progress}
        running={running}
        paused={paused}
        selected={selected}
        onSelect={onSelect}
        grouped={grouped}
        onGroup={onGroup}
        counting={counting}
        demonstrating={demonstrating}
      />
    );
  const stage = running
    ? frame === 0
      ? 0
      : frame === 1
        ? progress
        : 1
    : grouped
      ? 1
      : 0;
  if (scene.type === "shop" && demonstrating) {
    const plan = demonstrationCounts(scene, task),
      n = plan.reduce((a, b) => a + b, 0);
    let remaining = Math.floor(stage * n);
    counts = plan.map((c) => {
      const chosen = Math.min(remaining, c);
      remaining -= chosen;
      return chosen;
    });
  }
  if (scene.type === "shop")
    return (
      <div className="pdf-shop">
        <div className="pdf-shop-rule">
          {scene.threshold
            ? `每单满${scene.threshold}元减${scene.discount}元（减一次）`
            : scene.repeat
              ? "可以买两件同款；每份球拍按一副计价"
              : "购买两件不同商品，不能重复选同款"}
        </div>
        {counting && (
          <div className="pdf-price-line" aria-label="单价比较">
            单价从低到高：
            {[...scene.items]
              .sort((a, b) => a.price! - b.price!)
              .map((i) => (
                <span key={i.id}>
                  {i.icon} {i.name} {i.price}元
                </span>
              ))}
          </div>
        )}
        <div className="pdf-goods">
          {scene.items.map((it, i) => (
            <article
              key={it.id}
              data-goods={it.id}
              style={
                {
                  "--entry": i,
                  transform: `translateY(${running && frame === 0 ? 60 * (1 - Math.max(0, Math.min(1, progress * 2 - i / scene.items.length))) : 0}px)`,
                  opacity:
                    running && frame === 0
                      ? Math.max(
                          0,
                          Math.min(1, progress * 2 - i / scene.items.length),
                        )
                      : 1,
                } as CSSProperties
              }
            >
              <span className="goods-icon" aria-hidden="true">
                {it.icon}
              </span>
              <h3>{it.name}</h3>
              <strong>{it.price}元</strong>
              <div className="goods-controls">
                <button
                  aria-label={`减少${it.name}`}
                  disabled={running || demonstrating || !counts[i]}
                  onClick={() => onCount(i, -1)}
                >
                  −
                </button>
                <output aria-label={`${it.name}已选数量`}>
                  {counts[i] ?? 0}
                </output>
                <button
                  aria-label={`选择${it.name}`}
                  disabled={
                    running ||
                    demonstrating ||
                    (scene.repeat
                      ? counts.reduce((a, b) => a + b, 0) >= 3
                      : !!counts[i])
                  }
                  onClick={() => onCount(i, 1)}
                >
                  ＋
                </button>
              </div>
            </article>
          ))}
        </div>
        <p>
          购物篮：已选 {counts.reduce((a, b) => a + b, 0)}{" "}
          件。先自己算总价，再判断购买条件。
        </p>
        <div className="pdf-basket" aria-label="购物篮">
          {scene.items.flatMap((it, i) =>
            Array.from({ length: counts[i] ?? 0 }, (_, j) => (
              <span key={it.id + j} className="basket-arrival">
                {it.icon} {it.name}
              </span>
            )),
          )}
        </div>
        {demonstrating && stage === 1 && (
          <p className="pdf-demo-total">
            演示购物篮：总价{basketTotal(scene, counts)}元
            {scene.threshold
              ? `，${basketTotal(scene, counts) >= scene.threshold ? "达到" : "未达到"}门槛；应付${payable(scene, counts)}元`
              : ""}
            。
          </p>
        )}
      </div>
    );
  if (scene.type === "pieces") {
    const kinds = [...new Set(scene.pieces.map((p) => p.kind))];
    const height = Math.max(420, kinds.length * 95 + 70);
    return (
      <>
        <div className="pdf-scene-tools">
          <button onClick={onGroup} disabled={running}>
            {grouped ? "拼回原图" : "拆开并按形状排队"}
          </button>
          <span>点部件做记号，再点取消；有色编号表示数过。</span>
        </div>
        <svg
          viewBox={`0 0 680 ${height}`}
          className="pdf-svg"
          aria-label="可以拆开的图形拼图"
          role="group"
        >
          {scene.original && (
            <g opacity={1 - stage} aria-hidden="true">
              {scene.title === "图形轮船" && (
                <path
                  d="M80 254H510L465 334H125Z"
                  fill="#eaf5f7"
                  stroke="#344a56"
                  strokeWidth="2"
                />
              )}
              {scene.title === "彩色三角火车" && (
                <g>
                  {[0, 1, 2, 3].map((i) => (
                    <g key={i}>
                      <rect
                        x={190 + i * 98}
                        y="195"
                        width="60"
                        height="58"
                        fill="#ffe9a0"
                        stroke="#344a56"
                      />
                      <circle
                        cx={220 + i * 98}
                        cy="275"
                        r="22"
                        fill="#475d64"
                      />
                      <rect
                        x={155 + i * 98}
                        y="215"
                        width="35"
                        height="14"
                        fill="#e4b85b"
                        stroke="#344a56"
                      />
                    </g>
                  ))}
                  <rect
                    x="85"
                    y="165"
                    width="95"
                    height="88"
                    fill="#b5dfa6"
                    stroke="#344a56"
                  />
                  {[108, 157].map((x) => (
                    <circle key={x} cx={x} cy="275" r="21" fill="#475d64" />
                  ))}
                </g>
              )}
            </g>
          )}
          {stage > 0 &&
            kinds.map((k, g) => (
              <text key={k} x="12" y={65 + g * 95} fontSize="14" fill="#576a73">
                {k}
              </text>
            ))}
          {scene.pieces.map((p, i) => {
            const g = kinds.indexOf(p.kind),
              idx = scene.pieces
                .slice(0, i)
                .filter((q) => q.kind === p.kind).length;
            const gx = 115 + idx * 52,
              gy = 40 + g * 95;
            const scale = mix(1, Math.min(40 / p.w, 42 / p.h, 1), stage);
            const marked = selected.includes(p.id),
              focus = task.focus === p.kind;
            return (
              <g
                key={p.id}
                data-piece={p.kind}
                role="button"
                aria-label={`${p.kind}部件${i + 1}`}
                aria-pressed={marked}
                tabIndex={running ? -1 : 0}
                onClick={() => !running && onSelect(p.id)}
                onKeyDown={(e) => {
                  if (!running && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(p.id);
                  }
                }}
                transform={`translate(${mix(p.x, gx, stage)} ${mix(p.y, gy, stage)})`}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="-10"
                  y="-10"
                  width={Math.max(44, p.w * scale + 20)}
                  height={Math.max(44, p.h * scale + 20)}
                  fill={marked ? "#ffe5a0" : "transparent"}
                  rx="8"
                  stroke={focus && counting ? "#e6a145" : "none"}
                />
                <g transform={`scale(${scale})`}>
                  <ShapeGlyph piece={p} />
                </g>
                {marked && (
                  <text x="0" y="-13" fontSize="19" fill="#7b4d0d">
                    ✓ {selected.indexOf(p.id) + 1}
                  </text>
                )}
                {counting && focus && (
                  <text x="0" y="60" fontSize="19" fill="#9c5e13">
                    {idx + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="footnote">
          按基本部件分类；正方形单列，不再重复算进长方形。
        </p>
      </>
    );
  }
  if (scene.type === "line" || scene.type === "solids") {
    const items = scene.items,
      width = Math.max(680, items.length * 88 + 50),
      direction = scene.type === "line" ? scene.direction : "left";
    return (
      <>
        <div className="pdf-direction">
          {scene.type === "line"
            ? `行进方向：${direction === "left" ? "← 向左，左端是队头" : "向右 →，右端是队头"}`
            : "按题目要求从左或从右计数；积木不交换位置。"}
        </div>
        <div className="pdf-scroll">
          <svg
            className="pdf-svg"
            viewBox={`0 0 ${width} ${scene.type === "line" && scene.race ? 390 : 260}`}
            style={{ minWidth: Math.min(width, 1000) }}
            role="group"
            aria-label={scene.type === "line" ? "前后位置动画" : "立体积木队伍"}
          >
            <path
              d={`M20 180H${width - 20}`}
              stroke="#cad9d2"
              strokeWidth="5"
            />
            {items.map((item, i) => {
              const slot =
                scene.type === "solids"
                  ? i
                  : direction === "left"
                    ? i
                    : items.length - 1 - i;
              const finalX = 55 + slot * 88,
                y = scene.type === "line" && scene.race ? 70 + i * 80 : 140;
              const entry =
                running && frame === 0
                  ? Math.max(0, Math.min(1, progress * 2 - i / items.length))
                  : 1;
              const x = mix(
                direction === "left" ? width + 60 : -60,
                finalX,
                entry,
              );
              const marked = selected.includes(item.id);
              return (
                <g
                  key={item.id}
                  data-object={item.id}
                  transform={`translate(${x} ${y})`}
                  role="button"
                  aria-label={`选择${item.name}`}
                  aria-pressed={marked}
                  tabIndex={running ? -1 : 0}
                  onClick={() => !running && onSelect(item.id)}
                  onKeyDown={(e) => {
                    if (!running && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelect(item.id);
                    }
                  }}
                >
                  <rect
                    x="-36"
                    y="-43"
                    width="72"
                    height="85"
                    rx="14"
                    fill={marked ? "#fbe0a0" : "#f6f4ec"}
                    stroke={
                      scene.type === "line" && i === scene.target
                        ? "#c17d45"
                        : "#d8e0db"
                    }
                    strokeWidth="3"
                  />
                  {scene.type === "solids" ? (
                    <Solid kind={item.kind!} />
                  ) : (
                    <text
                      y="8"
                      fontSize="42"
                      textAnchor="middle"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </text>
                  )}
                  <text y="62" fontSize="17" textAnchor="middle">
                    {scene.type === "solids" ? item.kind : item.name}
                  </text>
                  {counting && (
                    <text
                      y="-53"
                      textAnchor="middle"
                      fontSize="22"
                      fill="#997021"
                    >
                      {scene.type === "line"
                        ? i + 1
                        : task.id === "right"
                          ? items.length - i
                          : i + 1}
                    </text>
                  )}
                  {marked && (
                    <text x="22" y="-30" fontSize="23">
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p>
          点选伙伴或积木，再点一次可以取消。
          {task.pick?.length === 0
            ? "如果没有符合条件的伙伴，可以不选直接提交。"
            : ""}
        </p>
      </>
    );
  }
  const { a, b, kind } = scene;
  let objects: {
    id: string;
    icon: string;
    x: number;
    y: number;
    toX: number;
    toY: number;
    faded?: boolean;
  }[] = [];
  const slot = (i: number, offsetX = 30, offsetY = 90) => ({
    x: offsetX + (i % 8) * 43,
    y: offsetY + Math.floor(i / 8) * 45,
  });
  if (kind === "balls")
    objects = Array.from({ length: a + b }, (_, i) => {
      const source = i < a ? slot(i, 35) : slot(i - a, 365);
      const isBasket = i % 2 === 0,
        rank = Array.from({ length: i }, (_, j) => j).filter(
          (j) => (j % 2 === 0) === isBasket,
        ).length;
      const to = slot(rank, isBasket ? 35 : 365);
      return {
        id: "ball-" + i,
        icon: isBasket ? "🏀" : "⚽",
        ...source,
        toX: to.x,
        toY: to.y,
      };
    });
  if (kind === "eggs")
    objects = Array.from({ length: a + b }, (_, i) => {
      const source = slot(i < a ? i : i - a, i < a ? 30 : 365);
      const to = slot(i, 140);
      return { id: "egg-" + i, icon: "🥚", ...source, toX: to.x, toY: to.y };
    });
  if (kind === "chairs")
    objects = Array.from({ length: a }, (_, i) => {
      const source = slot(i, 90);
      return {
        id: "chair-" + i,
        icon: i < b ? "🪑" : "🧒",
        ...source,
        toX: source.x,
        toY: source.y + (i < b ? 48 : 0),
      };
    });
  if (kind === "bus")
    objects = Array.from({ length: a }, (_, i) => {
      const source = slot(i, 135);
      const to = i < a - b ? slot(i, 30) : slot(i - (a - b), 430);
      return { id: "person-" + i, icon: "🧒", ...source, toX: to.x, toY: to.y };
    });
  const height = Math.max(330, 170 + Math.ceil((a + b) / 8) * 48);
  return (
    <>
      <div className="pdf-scene-tools">
        <button onClick={onGroup} disabled={running}>
          {grouped
            ? "回到题目摆法"
            : kind === "balls"
              ? "改成按种类分组"
              : kind === "eggs"
                ? "把吃掉的鸡蛋放回原来的篮子"
                : kind === "chairs"
                  ? "给已有椅子配上小朋友"
                  : "把小汽车的人移到另一边"}
        </button>
      </div>
      <svg
        viewBox={`0 0 720 ${height}`}
        className="pdf-svg"
        role="group"
        aria-label="数量关系实物动画"
      >
        <text x="30" y="35" fontSize="18">
          {kind === "balls"
            ? stage > 0.5
              ? "篮球"
              : "左边一堆"
            : kind === "eggs"
              ? stage > 0.5
                ? "原来的篮子"
                : "剩下的鸡蛋"
              : kind === "chairs"
                ? `每人一把，共${a}位小朋友`
                : stage > 0.5
                  ? "大巴"
                  : "两车总人数"}
        </text>
        <text x="365" y="35" fontSize="18">
          {kind === "balls"
            ? stage > 0.5
              ? "足球"
              : "右边一堆"
            : kind === "eggs"
              ? stage > 0.5
                ? ""
                : "吃掉的鸡蛋"
              : kind === "chairs"
                ? `已有${b}把椅子`
                : stage > 0.5
                  ? "小汽车"
                  : ""}
        </text>
        {objects.map((o, i) => (
          <g
            key={o.id}
            data-quantity={o.id}
            role="button"
            aria-label={`标记物体${i + 1}`}
            aria-pressed={selected.includes(o.id)}
            tabIndex={running ? -1 : 0}
            onClick={() => !running && onSelect(o.id)}
            onKeyDown={(e) => {
              if (!running && (e.key === " " || e.key === "Enter")) {
                e.preventDefault();
                onSelect(o.id);
              }
            }}
            transform={`translate(${mix(o.x, o.toX, stage)} ${mix(o.y, o.toY, stage)})`}
          >
            <rect
              x="-5"
              y="-30"
              width="43"
              height="43"
              rx="9"
              fill={selected.includes(o.id) ? "#fbe0a0" : "transparent"}
            />
            <text fontSize="32" aria-hidden="true">
              {o.icon}
            </text>
            {selected.includes(o.id) && (
              <text y="-33" fontSize="17">
                ✓
              </text>
            )}
            {kind === "chairs" && i < b && stage > 0 && (
              <text y="-35" fontSize="30" opacity={stage} aria-hidden="true">
                🧒
              </text>
            )}
            {counting && (
              <text x="10" y="30" fontSize="17" textAnchor="middle">
                {i + 1}
              </text>
            )}
          </g>
        ))}
      </svg>
    </>
  );
}
