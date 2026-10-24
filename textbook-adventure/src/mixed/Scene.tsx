import { model, type Kind, type Numbers } from "./model";
function Token({
  kind,
  variant,
  fill,
}: {
  kind: Kind;
  variant: boolean;
  fill: string;
}) {
  if (variant)
    return (
      <g>
        <rect x="-11" y="-10" width="22" height="20" rx="3" fill={fill} />
        <path d="M-7 -6H7M-7 0H7M-7 6H4" stroke="white" strokeWidth="2" />
      </g>
    );
  if (kind === "bus")
    return (
      <g fill={fill}>
        <circle cy="-7" r="6" />
        <path d="M-9 12V4Q0 -7 9 4V12Z" />
      </g>
    );
  if (kind === "yogurt")
    return (
      <g>
        <path d="M-10 -8H10L7 12H-7Z" fill={fill} />
        <path d="M-12 -9H12" stroke="#284a49" strokeWidth="3" />
        <path d="M-5 -2H5" stroke="white" strokeWidth="3" />
      </g>
    );
  if (kind === "peaches")
    return (
      <g>
        <ellipse ry="11" rx="12" fill="#ef9b7e" />
        <path
          d="M0 -9Q4 -18 10 -13"
          fill="none"
          stroke="#499568"
          strokeWidth="3"
        />
        <path d="M1 -7Q-3 2 1 9" fill="none" stroke="#c46e63" />
      </g>
    );
  if (kind === "paper")
    return (
      <g fill={fill}>
        <path d="M0 -13L13 0L0 13L-13 0Z" />
        <path d="M-7 0H7M0 -7V7" stroke="white" strokeWidth="2" />
      </g>
    );
  if (kind === "flowers")
    return (
      <g>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cy="-7"
            rx="5"
            ry="7"
            fill="#e0ac48"
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="4" fill="#81642b" />
      </g>
    );
  return <circle r="11" fill={fill} stroke="#fff" strokeWidth="2" />;
}
export function Scene({
  kind,
  n,
  step,
  progress,
  bars,
  variant = false,
  displayUnit,
}: {
  kind: Kind;
  n: Numbers;
  step: number;
  progress: number;
  bars: boolean;
  variant?: boolean;
  displayUnit?: string;
}) {
  const m = model(kind, n),
    start = step === 0 ? (kind === "yogurt" ? 0 : n.a) : m.first,
    end = step === 0 ? m.first : m.total;
  const grouping = step === 1 && (kind === "peaches" || kind === "beads");
  const multiply =
    (kind === "yogurt" && step === 0) || (kind === "flowers" && step === 1);
  const size = grouping ? n.c : kind === "yogurt" ? n.a : m.first;
  const count = grouping ? start : Math.round(start + (end - start) * progress);
  const max = grouping ? start : Math.max(start, end);
  const groups = grouping ? m.total : multiply ? end / size : 0;
  const completed = grouping
    ? Math.floor(groups * progress)
    : multiply
      ? Math.floor(count / size)
      : 0;
  const unit =
    displayUnit ||
    (variant
      ? "个"
      : kind === "bus"
        ? "人"
        : kind === "paper"
          ? "张"
          : kind === "flowers"
            ? "朵"
            : kind === "yogurt"
              ? "盒"
              : kind === "beads"
                ? "颗"
                : "个");
  return (
    <div className="mix-scene">
      <svg
        viewBox="0 0 600 430"
        role="img"
        aria-label={grouping ? "把实物圈成组" : "实物数量变化"}
      >
        {bars ? (
          <>
            <rect x="30" y="70" width={start * 5} height="44" fill="#bddbd5" />
            <text x="30" y="52">
              变化前：{start}
              {unit}
            </text>
            <rect x="30" y="165" width={count * 5} height="44" fill="#3c9a80" />
            <text x="30" y="150">
              当前：{count}
              {unit}
            </text>
            {grouping && (
              <text x="30" y="265">
                每组 {n.c} 个，已分 {completed} 组
              </text>
            )}
          </>
        ) : (
          <>
            {Array.from({ length: completed }, (_, i) => (
              <g key={"group" + i}>
                <rect
                  x="17"
                  y={14 + i * Math.min(49, 335 / groups)}
                  width={size * 43 + 10}
                  height="32"
                  rx="12"
                  fill="#e3eee2"
                  stroke="#719c79"
                />
                <text
                  x={size * 43 + 37}
                  y={36 + i * Math.min(49, 335 / groups)}
                  fontSize="13"
                >
                  第{i + 1}组
                </text>
              </g>
            ))}
            {Array.from({ length: max }, (_, i) => {
              const active = i < count;
              const grouped = (grouping && i < completed * size) || multiply;
              const x = grouped ? 35 + (i % size) * 43 : 35 + (i % 10) * 53;
              const y = grouped
                ? 30 + Math.floor(i / size) * Math.min(49, 335 / groups)
                : 30 + Math.floor(i / 10) * 34;
              return (
                <g
                  key={i}
                  data-object="true"
                  data-active={active}
                  style={{
                    transform: `translate(${x}px,${active ? y : 385}px)`,
                    opacity: active ? 1 : 0.12,
                    transition: "transform .2s, opacity .2s",
                  }}
                >
                  <Token
                    kind={kind}
                    variant={variant}
                    fill={i < start ? "#378d79" : "#d78f44"}
                  />
                </g>
              );
            })}
          </>
        )}
        <text x="25" y="420" fontSize="16">
          {grouping
            ? `实物共 ${start}${unit}；每组 ${size} 个；已分 ${completed} 组`
            : `场景内 ${count}${unit} · 淡色物体已移出或尚未加入`}
        </text>
      </svg>
    </div>
  );
}
