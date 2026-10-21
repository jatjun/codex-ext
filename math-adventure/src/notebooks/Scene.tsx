import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Task } from "../pdf/model";
import {
  foldNet,
  netAnalysis,
  project3,
  voxelView,
  pattern,
  type V3,
  type PatternKind,
  type View,
} from "./geometry";
import {
  evaluate,
  exprText,
  unitName,
  toGrams,
  type AdvancedSpec,
  type Expr,
} from "./types";
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const color = [
  "#83b6a0",
  "#d3b76c",
  "#9e8ec4",
  "#70a8bd",
  "#d99a89",
  "#b3bd77",
];
function useManualProgress(
  target: boolean,
  paused: boolean,
  instantReset = false,
) {
  const [value, setValue] = useState(0),
    current = useRef(0);
  useEffect(() => {
    if (paused) return;
    if (!target && instantReset) {
      current.current = 0;
      setValue(0);
      return;
    }
    let raf = 0,
      last = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const to = target ? 1 : 0;
    const tick = (now: number) => {
      const delta = last ? Math.min(now - last, 80) : 0;
      last = now;
      current.current +=
        Math.sign(to - current.current) *
        Math.min(
          Math.abs(to - current.current),
          delta / (reduced ? 250 : 1400),
        );
      if (Math.abs(to - current.current) <= 0.001) current.current = to;
      setValue(current.current);
      if (current.current !== to) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, paused, instantReset]);
  return value;
}
function ClickGroup({
  id,
  label,
  selected,
  onSelect,
  children,
  transform,
}: {
  id: string;
  label: string;
  selected: string[];
  onSelect: (id: string) => void;
  children: ReactNode;
  transform?: string;
}) {
  return (
    <g
      transform={transform}
      role="button"
      aria-label={label}
      aria-pressed={selected.includes(id)}
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
    >
      {children}
    </g>
  );
}
function SolidGlyph({ kind, scale = 1 }: { kind: string; scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      {kind === "球" ? (
        <g>
          <circle r="22" fill="#f0d28b" stroke="#69543e" strokeWidth="2" />
          <path
            d="M-19-8Q0 9 19-8M-7-20Q8 0-7 20"
            fill="none"
            stroke="#69543e"
          />
        </g>
      ) : kind === "圆柱" ? (
        <g fill="#a2d0c6" stroke="#456e67" strokeWidth="2">
          <path d="M-18-24V22C-18 33 18 33 18 22V-24Z" />
          <ellipse cy="-24" rx="18" ry="7" />
        </g>
      ) : (
        <g
          fill={kind === "正方体" ? "#ac99cc" : "#95bcd3"}
          stroke="#4d6171"
          strokeWidth="2"
        >
          <path
            d={
              kind === "正方体"
                ? "M-22-15L-8-28H24V8L10 22H-22Z"
                : "M-35-9L-20-22H38V5L23 18H-35Z"
            }
          />
          <path
            d={
              kind === "正方体"
                ? "M-22-15H10V22M10-15L24-28"
                : "M-35-9H23V18M23-9L38-22"
            }
            fill="none"
          />
        </g>
      )}
    </g>
  );
}
function PatternGraphic({
  kind,
  stroke = "#3b525b",
  fill = "#e4e0d4",
}: {
  kind: PatternKind;
  stroke?: string;
  fill?: string;
}) {
  const p = pattern(kind);
  return (
    <g stroke={stroke} strokeWidth="2" fill={fill}>
      {p.polygons.map((pts, i) => (
        <polygon key={"p" + i} points={pts.map((p) => p.join(",")).join(" ")} />
      ))}
      {p.circles.map((c, i) => (
        <circle key={"c" + i} cx={c.x} cy={c.y} r={c.r} fill="none" />
      ))}
      {p.lines.map((pts, i) => (
        <polyline
          key={"l" + i}
          points={pts.map((p) => p.join(",")).join(" ")}
          fill="none"
        />
      ))}
    </g>
  );
}
function Rose({ outline = false }: { outline?: boolean }) {
  return (
    <g
      fill={outline ? "none" : "#ca535e"}
      stroke={outline ? "#9bada3" : "#69404a"}
      strokeWidth="2"
      strokeDasharray={outline ? "4 3" : undefined}
    >
      <path d="M-2-15L-10 65H-5L3-15Z" fill={outline ? "none" : "#659b6b"} />
      <path
        d="M-6 30Q-37 18-28 5Q-5 5-6 30M-3 5Q15-24 27-10Q25 12-3 5"
        fill={outline ? "none" : "#659b6b"}
      />
      <path d="M0-16Q-27-16-25-46Q-10-46-4-35L0-60Q12-55 16-47L28-52Q26-18 0-16Z" />
      <path d="M-20-45Q0-42 9-20M15-46Q5-31 0-16" fill="none" />
    </g>
  );
}
function MotionIcon({ kind, angle }: { kind: string; angle: number }) {
  if (kind === "window")
    return (
      <g stroke="#587a83" fill="#d7e9ed">
        <rect x="-65" y="-55" width="130" height="110" />
        <rect x="-55" y="-45" width="52" height="90" fill="#f7fcfc" />
        <rect x="4" y="-45" width="52" height="90" />
      </g>
    );
  if (kind === "elevator")
    return (
      <g fill="#b9d4df" stroke="#4c6a7a">
        <rect x="-45" y="-55" width="90" height="110" rx="8" />
        <path d="M0-50V50" />
        <text y="10" fontSize="38" textAnchor="middle">
          🧒
        </text>
      </g>
    );
  if (kind === "block")
    return (
      <g>
        <rect
          x="-40"
          y="-30"
          width="80"
          height="60"
          rx="4"
          fill="#a1c853"
          stroke="#587332"
        />
        <circle cx="-20" cy="-15" r="5" fill="#965b44" />
      </g>
    );
  return (
    <>
      <g fill="none" stroke="#bfcfc6" strokeWidth="4">
        {kind === "clock" || kind === "wheel" ? <circle r="62" /> : null}
      </g>
      {kind === "clock" &&
        [12, 3, 6, 9].map((n, i) => (
          <text
            key={n}
            x={[0, 48, 0, -48][i]}
            y={[-45, 8, 55, 8][i]}
            fontSize="16"
            textAnchor="middle"
          >
            {n}
          </text>
        ))}
      <g transform={`rotate(${angle})`} data-motion-transform="rotor">
        {kind === "fan" ? (
          Array.from({ length: 4 }, (_, i) => (
            <path
              key={i}
              transform={`rotate(${i * 90})`}
              d="M0 0Q-42-64-10-65Q12-60 14-12Z"
              fill={color[i]}
              stroke="#527269"
            />
          ))
        ) : kind === "clock" ? (
          <>
            <path d="M0 0V-38M0 0L25-8" stroke="#47665f" strokeWidth="6" />
          </>
        ) : kind === "wheel" ? (
          <g stroke="#4a6971" strokeWidth="8" fill="none">
            <circle r="50" />
            <path d="M-48 0H48M0 0V48" />
          </g>
        ) : (
          <g fill="#d8aa57" stroke="#71613b">
            <path d="M0-55L55 0L0 58L-55 0Z" />
            <ellipse cy="-2" rx="55" ry="12" fill="#90b991" />
          </g>
        )}
        <circle cy="-45" r="6" fill="#cd6651" />
      </g>
      <circle r="7" fill="#516d65" />
    </>
  );
}
export function AdvancedScene({
  spec,
  task,
  frame,
  progress,
  running,
  paused,
  selected,
  onSelect,
  grouped,
  onGroup,
  counting,
  demonstrating,
}: {
  spec: AdvancedSpec;
  task: Task;
  frame: number;
  progress: number;
  running: boolean;
  paused: boolean;
  selected: string[];
  onSelect: (id: string) => void;
  grouped: boolean;
  onGroup: () => void;
  counting: boolean;
  demonstrating: boolean;
}) {
  const [index, setIndex] = useState(0),
    [angle, setAngle] = useState<number | null>(null),
    [view, setView] = useState<View | null>(null),
    [magnify, setMagnify] = useState(10);
  const manual = useManualProgress(grouped, paused, spec.kind === "motion");
  const stage = running
    ? frame === 0
      ? 0
      : frame === 1
        ? progress
        : 1
    : manual;
  useEffect(() => {
    if (!grouped) {
      setAngle(null);
      setView(null);
    }
  }, [grouped]);
  const previous = useRef(spec);
  useEffect(() => {
    if (previous.current !== spec) {
      setIndex(0);
      setAngle(null);
      setView(null);
      previous.current = spec;
    }
  }, [spec]);
  const controls = (label = "移动并分组") => (
    <div className="nb-tools">
      <button
        onClick={() => {
          setAngle(null);
          if (spec.kind === "view") setView(null);
          onGroup();
        }}
        disabled={running}
      >
        {grouped ? "恢复原摆法" : label}
      </button>
      <span>先观察，再操作；点物体可以做记号。</span>
    </div>
  );
  const marker = (
    id: string,
    x: number,
    y: number,
    icon: string,
    label?: string,
    fill = "#e9ecdb",
  ) => (
    <ClickGroup
      key={id}
      id={id}
      label={`标记${label ?? id}`}
      selected={selected}
      onSelect={onSelect}
      transform={`translate(${x} ${y})`}
    >
      <rect
        x="-20"
        y="-22"
        width="42"
        height="44"
        rx="10"
        fill={selected.includes(id) ? "#f6ce79" : fill}
      />
      <text
        fontSize={icon.length > 2 ? 18 : 25}
        textAnchor="middle"
        y="9"
        aria-hidden="true"
      >
        {icon}
      </text>
      {counting && (
        <text y="-26" textAnchor="middle" fontSize="13">
          {label}
        </text>
      )}
    </ClickGroup>
  );
  if (spec.kind === "ruler")
    return (
      <div className="nb-scene">
        {controls("重新对齐零刻度")}
        <p>小棒一端对准0。每个小格是1毫米，每10小格是1厘米。</p>
        <svg className="nb-svg" viewBox="0 0 720 250" aria-label="毫米刻度尺">
          <rect x="45" y="100" width="600" height="85" rx="8" fill="#f1dc9c" />
          {Array.from({ length: 101 }, (_, i) => (
            <g key={i} transform={`translate(${50 + i * 5.8} 100)`}>
              <path
                d={`M0 0V${i % 10 === 0 ? 45 : i % 5 === 0 ? 32 : 20}`}
                stroke="#59676c"
                strokeWidth={i % 10 === 0 ? 2 : 1}
              />
              {i % 10 === 0 && (
                <text y="70" textAnchor="middle" fontSize="18">
                  {i}
                </text>
              )}
            </g>
          ))}
          <rect
            data-ruler-stick="true"
            x={50 + 90 * (running ? 1 - stage : grouped ? 1 - manual : 0)}
            y="65"
            width={spec.mm * 5.8}
            height="22"
            rx="5"
            fill="#6b9a85"
          />
          <path
            d={`M${50 + spec.mm * 5.8} 55V190`}
            stroke="#cb7964"
            strokeDasharray="5 4"
          />
          <text x="45" y="220" fontSize="16">
            单位：毫米
          </text>
        </svg>
        <label className="nb-slider">
          移动放大镜
          <input
            type="range"
            min="0"
            max="90"
            value={magnify}
            onChange={(e) => setMagnify(Number(e.target.value))}
          />
        </label>
        <svg
          className="nb-zoom"
          viewBox="0 0 500 110"
          aria-label="局部刻度放大"
        >
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i} transform={`translate(${30 + i * 43} 10)`}>
              <path
                d={`M0 0V${(magnify + i) % 10 === 0 ? 45 : 25}`}
                stroke="#4e6c64"
              />
              <text y="80" textAnchor="middle" fontSize="19">
                {magnify + i}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  if (spec.kind === "mass") {
    const normalized = spec.values.map((i) => ({
      ...i,
      grams: toGrams(i.amount, i.unit),
    }));
    if (spec.mode === "bottle") {
      const water = normalized[0].grams - normalized[1].grams,
        cups = spec.cupCount!;
      return (
        <div className="nb-scene">
          {controls("把纯水平均倒入各杯")}
          <p>
            连瓶{spec.values[0].amount}千克；空瓶{spec.values[1].amount}克；共有
            {cups}杯水。先扣瓶重，再平均分水。
          </p>
          <svg
            className="nb-svg"
            viewBox={`0 0 720 ${cups > 5 ? 470 : 350}`}
            aria-label="扣除瓶重后平均分水"
          >
            <path
              d="M80 90V55H140V90L165 130V285H55V130Z"
              fill="#e0f1f1"
              stroke="#749ca0"
              strokeWidth="3"
            />
            <rect
              x="60"
              y={140 + 130 * stage}
              width="100"
              height={130 * (1 - stage)}
              fill="#80bfcc"
            />
            <text x="110" y="325" fontSize="17" textAnchor="middle">
              瓶子留在这里
            </text>
            {Array.from({ length: cups }, (_, i) => {
              const x = 240 + (i % 5) * 90,
                y = 130 + Math.floor(i / 5) * 190;
              return (
                <g
                  key={i}
                  data-water-cup={i}
                  transform={`translate(${x} ${y})`}
                >
                  <path
                    d="M-30-15L-22 85H22L30-15Z"
                    fill="#f4fcfc"
                    stroke="#6e9496"
                    strokeWidth="2"
                  />
                  <path
                    d={`M-24 ${82 - stage * 75}H24L21 81H-21Z`}
                    fill="#7eb8c8"
                  />
                  {stage > 0 && stage < 1 && (
                    <circle
                      cx={mix(130, x, stage) - x}
                      cy={mix(130, y, stage) - y}
                      r="6"
                      fill="#67a4bd"
                    />
                  )}
                  <text y="115" textAnchor="middle" fontSize="15">
                    第{i + 1}杯
                  </text>
                  {demonstrating && (
                    <text y="140" textAnchor="middle" fontSize="16">
                      {water / cups}克
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      );
    }
    if (spec.mode === "bags") {
      const n = spec.bagCount!,
        h = 100 + Math.ceil(n / 10) * 60;
      return (
        <div className="nb-scene">
          {controls("把米袋整齐装入目标区")}
          <p>
            每袋{spec.values[0].amount}千克，目标共{spec.target}
            千克。每个米袋图标都代表1袋。
          </p>
          <svg
            className="nb-svg"
            viewBox={`0 0 720 ${h}`}
            aria-label="米袋装载动画"
          >
            {Array.from({ length: n }, (_, i) => {
              const x = 40 + (i % 10) * 66,
                y = 75 + Math.floor(i / 10) * 60;
              return (
                <g
                  key={i}
                  data-rice-bag={i}
                  transform={`translate(${mix(x + (i % 2 ? 10 : -10), x, stage)} ${mix(y + Math.sin(i) * 18, y, stage)})`}
                >
                  {marker("bag-" + i, 0, 0, "🌾", String(i + 1))}
                  <text y="33" fontSize="11" textAnchor="middle">
                    {spec.values[0].amount}kg
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }
    const masses = normalized.map((m, i) => {
      const split =
        spec.mode === "convert" &&
        (m.unit === "t" || (m.unit === "kg" && m.amount <= 9));
      let unit = split ? (m.unit === "t" ? 100000 : 100) : 1;
      while (Math.ceil(m.grams / unit) > (split ? 100 : 12)) unit *= 10;
      const chunks = Array.from(
        { length: Math.floor(m.grams / unit) },
        () => unit,
      );
      if (m.grams % unit) chunks.push(m.grams % unit);
      return { ...m, chunks, index: i, split };
    });
    const compare = spec.mode === "equal";
    const delta = compare
      ? Math.sign(normalized[0].grams - normalized[1].grams)
      : 0;
    return (
      <div className="nb-scene">
        {controls(
          spec.mode === "units" ? "查看有标注的质量块" : "统一单位，拆开质量块",
        )}
        <p className="nb-legend">
          每个质量块代表块内标出的质量。单位改变，实际质量不变；图标不是按实物大小比例绘制。
        </p>
        {spec.target && <p>比较目标：{spec.target}千克</p>}
        {compare && (
          <svg
            viewBox="0 0 720 180"
            className="nb-svg nb-balance"
            aria-label="质量天平"
          >
            <path d="M360 80L325 160H395Z" fill="#9db7a1" />
            <g transform={`rotate(${-delta * stage * 10} 360 80)`}>
              <path d="M120 80H600" stroke="#637f74" strokeWidth="8" />
              <path
                d="M180 80V125H300V80M420 80V125H540V80"
                fill="none"
                stroke="#637f74"
              />
              <text x="240" y="67" textAnchor="middle" fontSize="26">
                铁
              </text>
              <text x="480" y="67" textAnchor="middle" fontSize="26">
                沙
              </text>
            </g>
          </svg>
        )}
        <div className="nb-mass-grid">
          {masses.map((m) => (
            <article key={m.index}>
              <h3>
                {m.icon} {m.label}
              </h3>
              <strong>
                {m.amount}
                {unitName[m.unit]}
              </strong>
              <svg
                viewBox={`0 0 340 ${Math.max(170, Math.ceil(m.chunks.length / 6) * 55 + 40)}`}
                className="nb-mass-blocks"
                role="group"
                aria-label={m.label + "质量块"}
              >
                {m.chunks.map((g, i) => {
                  const amount = m.split
                    ? m.unit === "t"
                      ? `${g / 1000}kg`
                      : `${g}g`
                    : stage > 0.5
                      ? m.unit === "t"
                        ? `${g / 1000}kg`
                        : g >= 1000
                          ? `${g / 1000}kg`
                          : `${g}g`
                      : m.unit === "t"
                        ? `${g / 1000000}t`
                        : m.unit === "kg"
                          ? `${g / 1000}kg`
                          : `${g}g`;
                  return (
                    <g
                      key={i}
                      data-mass-block={g}
                      opacity={m.split ? stage : 1}
                      transform={`translate(${mix(35 + ((m.split ? Math.floor(i / 10) : i) % 3) * 95, 35 + (i % 6) * 50, stage)} ${mix(35 + Math.floor((m.split ? Math.floor(i / 10) : i) / 3) * 55, 35 + Math.floor(i / 6) * 55, stage)})`}
                    >
                      <rect
                        x="-24"
                        y="-21"
                        width="48"
                        height="44"
                        rx="7"
                        fill={color[m.index % 6]}
                        opacity=".8"
                      />
                      <text y="5" textAnchor="middle" fontSize="11">
                        {amount}
                      </text>
                    </g>
                  );
                })}
                {m.split &&
                  Array.from({ length: m.amount }, (_, i) => (
                    <g
                      key={"bundle-" + i}
                      opacity={1 - stage}
                      transform={`translate(${35 + (i % 3) * 95} ${35 + Math.floor(i / 3) * 55})`}
                    >
                      <rect
                        x="-28"
                        y="-22"
                        width="57"
                        height="44"
                        rx="8"
                        fill={color[m.index % 6]}
                        stroke="#547868"
                      />
                      <text textAnchor="middle" y="6" fontSize="16">
                        1{m.unit === "t" ? "吨" : "kg"}
                      </text>
                    </g>
                  ))}
              </svg>
              {(counting || demonstrating) && spec.mode !== "units" && (
                <p>
                  {m.grams % 1000 === 0
                    ? `统一成千克：${m.grams / 1000}kg`
                    : `${m.grams}克，不足${Math.floor(m.grams / 1000) + 1}千克`}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    );
  }
  if (spec.kind === "groups") {
    const batches = spec.batches;
    const total = batches.reduce((a, b) => a + b.per * b.copies, 0);
    const groupCount =
      spec.distribution === "separate" ? total / spec.groups : spec.groups;
    const perGroup =
      spec.distribution === "separate"
        ? spec.groups
        : Math.ceil(total / groupCount);
    const maxCategory = Math.max(
        ...batches.map((b) => (b.per * b.copies) / groupCount),
      ),
      sectionH = Math.ceil(maxCategory / 6) * 44 + 30;
    const rowH = spec.difference
        ? sectionH * 2 + 50
        : Math.max(120, Math.ceil(perGroup / 6) * 44 + 60),
      height = Math.max(
        300,
        Math.ceil(groupCount / 2) * rowH + 30,
        ...batches.map((b) => Math.ceil((b.per * b.copies) / 6) * 44 + 90),
      );
    let beforeCount = 0;
    return (
      <div className="nb-scene">
        {controls(
          spec.distribution === "copies"
            ? "把同样的每一份排出来"
            : "按题意平均分组",
        )}
        {spec.difference && (
          <p>
            两种物体逐个配对，再看每份多出的部分。不同颜色代表不同类别，不是把两类数量相加。
          </p>
        )}
        <div className="nb-batch-labels">
          {batches.map((b, i) => (
            <span key={i} style={{ borderColor: b.color }}>
              {b.label}：
              {b.copies > 1 ? `每份${b.per}，共${b.copies}份` : `${b.per}个`}
              {b.value !== 1 ? `，每件${b.value}元` : ""}
            </span>
          ))}
        </div>
        <svg
          className="nb-svg"
          viewBox={`0 0 720 ${height}`}
          aria-label="分组与两种方法实物动画"
        >
          {stage > 0.01 &&
            Array.from({ length: groupCount }, (_, i) => (
              <g key={i} opacity={stage}>
                <rect
                  x={18 + (i % 2) * 350}
                  y={12 + Math.floor(i / 2) * rowH}
                  width="330"
                  height={rowH - 14}
                  rx="15"
                  fill="none"
                  stroke="#c1d5c9"
                  strokeDasharray="5 4"
                />
                <text
                  x={32 + (i % 2) * 350}
                  y={38 + Math.floor(i / 2) * rowH}
                  fontSize="15"
                >
                  第{i + 1}
                  {spec.distribution === "compare" ? "个年级" : "份"}
                </text>
              </g>
            ))}
          {batches.flatMap((b, g) => {
            const offset = beforeCount;
            beforeCount += b.per * b.copies;
            return Array.from({ length: b.per * b.copies }, (_, i) => {
              let bucket = 0,
                slot = 0;
              if (spec.distribution === "separate") {
                bucket = Math.floor(i / spec.groups) + offset / spec.groups;
                slot = i % spec.groups;
              } else if (
                spec.distribution === "mixed" ||
                spec.distribution === "compare"
              ) {
                bucket = i % spec.groups;
                slot = Math.floor(i / spec.groups) + offset / spec.groups;
              } else {
                bucket = b.copies > 1 ? Math.floor(i / b.per) : i % spec.groups;
                slot =
                  (b.copies > 1 ? i % b.per : Math.floor(i / spec.groups)) +
                  offset / spec.groups;
              }
              if (spec.difference) slot -= offset / spec.groups;
              const rawX = 40 + g * 350 + (i % 6) * 45,
                rawY = 70 + Math.floor(i / 6) * 44;
              const x = 55 + (bucket % 2) * 350 + (slot % 6) * 45,
                y =
                  76 +
                  Math.floor(bucket / 2) * rowH +
                  Math.floor(slot / 6) * 44 +
                  (spec.difference ? g * sectionH : 0);
              const id = `batch-${g}-${i}`;
              return (
                <g
                  key={id}
                  data-batch-object={g}
                  data-unit-value={b.value}
                  transform={`translate(${mix(rawX, x, stage)} ${mix(rawY, y, stage)})`}
                >
                  <ClickGroup
                    id={id}
                    label={`${b.label}物体${i + 1}`}
                    selected={selected}
                    onSelect={onSelect}
                  >
                    <rect
                      x="-20"
                      y="-21"
                      width="42"
                      height="43"
                      rx="9"
                      fill={selected.includes(id) ? "#f8d284" : b.color}
                      opacity=".7"
                    />
                    <text
                      y="8"
                      textAnchor="middle"
                      fontSize={b.icon === "●" ? 24 : 23}
                      fill={b.icon === "●" ? b.color : "#364d52"}
                    >
                      {b.icon}
                    </text>
                    {b.value !== 1 && (
                      <text y="25" fontSize="11" textAnchor="middle">
                        {b.value}元
                      </text>
                    )}
                    {counting && (
                      <text y="-24" fontSize="12" textAnchor="middle">
                        {i + 1}
                      </text>
                    )}
                  </ClickGroup>
                </g>
              );
            });
          })}
        </svg>
        {demonstrating && (
          <div className="nb-methods">
            {spec.methods.map((m) => (
              <p key={m}>{m}</p>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (spec.kind === "bus") {
    const { before, off, on } = spec,
      n = before + on,
      height = 180 + Math.ceil(Math.max(before - off + on, off) / 10) * 48;
    return (
      <div className="nb-scene">
        {controls("演示下车，再上车")}
        <p>
          原有{before}人，先下车{off}人，再上车{on}
          人。蓝色为原乘客，黄色为新乘客。
        </p>
        <svg
          className="nb-svg"
          viewBox={`0 0 720 ${height}`}
          aria-label="公交车乘客上下车"
        >
          <rect
            x="22"
            y="60"
            width="670"
            height={height - 90}
            rx="24"
            fill="#e3f0df"
            stroke="#9cb98a"
          />
          <text x="40" y="40" fontSize="20">
            车厢
          </text>
          {Array.from({ length: n }, (_, i) => {
            const existing = i < before,
              leaving = existing && i < off,
              rank = existing ? i - off : before - off + i - before;
            const initialX = existing
                ? 55 + (i % 10) * 65
                : 55 + ((i - before) % 10) * 65,
              initialY = existing
                ? 115 + Math.floor(i / 10) * 47
                : height + 40 + Math.floor((i - before) / 10) * 47;
            const endX = leaving ? 55 + (i % 10) * 65 : 55 + (rank % 10) * 65,
              endY = leaving
                ? -50 - Math.floor(i / 10) * 47
                : 115 + Math.floor(rank / 10) * 47;
            const local = existing
              ? Math.min(1, stage * 2)
              : Math.max(0, stage * 2 - 1);
            return (
              <g
                key={i}
                data-bus-person={i}
                data-onboard={stage === 1 ? String(!leaving) : undefined}
                transform={`translate(${mix(initialX, endX, local)} ${mix(initialY, endY, local)})`}
                opacity={
                  leaving
                    ? 1 - Math.min(1, stage * 2) * 0.9
                    : existing
                      ? 1
                      : Math.max(0, stage * 2 - 1)
                }
              >
                <circle r="19" fill={existing ? "#99bfcc" : "#e4c47a"} />
                <text y="8" fontSize="26" textAnchor="middle">
                  🧒
                </text>
              </g>
            );
          })}
        </svg>
        <p>先下后上，每个人只移动一次；车外的人不计入车内。</p>
      </div>
    );
  }
  if (spec.kind === "race")
    return (
      <div className="nb-scene">
        {controls("开始相向跑步")}
        <p>
          起点相距{spec.distance}米。每秒分别跑{spec.a}米和{spec.b}米，时间
          {spec.seconds}秒。
        </p>
        <svg
          className="nb-svg"
          viewBox="0 0 720 330"
          aria-label="相向跑步距离动画"
        >
          <path d="M60 180H660" stroke="#b4c6b5" strokeWidth="14" />
          <path
            d={`M60 180H${60 + ((600 * spec.a * spec.seconds) / spec.distance) * stage}`}
            stroke="#8c83b4"
            strokeWidth="14"
          />
          <path
            d={`M660 180H${660 - ((600 * spec.b * spec.seconds) / spec.distance) * stage}`}
            stroke="#d7a257"
            strokeWidth="14"
          />
          {[0, 1].map((k) => (
            <g
              key={k}
              data-runner={k}
              transform={`translate(${k ? 660 - ((600 * spec.b * spec.seconds) / spec.distance) * stage : 60 + ((600 * spec.a * spec.seconds) / spec.distance) * stage} 150)`}
            >
              <text textAnchor="middle" fontSize="45">
                {k ? "🏃" : "🏃‍♀️"}
              </text>
            </g>
          ))}
          <path d="M60 235V255H660V235" fill="none" stroke="#6b867b" />
          <text x="360" y="290" textAnchor="middle" fontSize="22">
            起点总距离 {spec.distance}米
          </text>
          <text x="60" y="65" fontSize="20">
            {spec.a}米/秒 →
          </text>
          <text x="520" y="65" fontSize="20">
            ← {spec.b}米/秒
          </text>
          {counting && (
            <text x="360" y="108" textAnchor="middle" fontSize="18">
              两条已跑路段合起来，才是“靠近的距离”
            </text>
          )}
        </svg>
      </div>
    );
  if (spec.kind === "operations") {
    const base = task.focus?.startsWith("cmp")
        ? Number(task.focus.slice(3)) * 2
        : 0,
      idx = Math.max(0, Math.min(spec.expressions.length - 1, index + base)),
      expr = spec.expressions[idx];
    type Node = { id: string; e: Expr; x: number; y: number; parent?: Node };
    const nodes: Node[] = [];
    let leaf = 0;
    const walk = (e: Expr, depth: number, id: string, parent?: Node): Node => {
      const node: Node = { id, e, x: 0, y: 350 - depth * 90, parent };
      nodes.push(node);
      if (typeof e === "number") node.x = 90 + leaf++ * 105;
      else {
        const a = walk(e.a, depth + 1, id + "a", node),
          b = walk(e.b, depth + 1, id + "b", node);
        node.x = (a.x + b.x) / 2;
      }
      return node;
    };
    walk(expr, 0, "root");
    const width = Math.max(720, leaf * 110 + 90);
    return (
      <div className="nb-scene">
        {controls("让数字卡片沿计算树合并")}
        <div className="nb-tools">
          {spec.expressions.map((_, i) => (
            <button
              key={i}
              disabled={running}
              onClick={() => setIndex(i - base)}
            >
              观察{spec.captions[i] ?? `算式${i + 1}`}
            </button>
          ))}
        </div>
        <p className="nb-expression">{exprText(expr)}</p>
        {spec.working && <p className="nb-working">{spec.working[idx]}</p>}
        <svg
          className="nb-svg"
          viewBox={`0 0 ${width} 440`}
          aria-label="运算顺序计算树"
        >
          {nodes
            .filter((n) => n.parent)
            .map((n) => (
              <path
                key={"p" + n.id}
                d={`M${n.x} ${n.y}L${n.parent!.x} ${n.parent!.y}`}
                stroke="#b4c8bb"
                strokeWidth="3"
              />
            ))}
          {nodes.map((n) => {
            const x = n.parent ? mix(n.x, n.parent.x, stage * 0.3) : n.x,
              y = n.parent ? mix(n.y, n.parent.y, stage * 0.3) : n.y;
            return (
              <g
                key={n.id}
                data-expression-node={n.id}
                transform={`translate(${x} ${y}) scale(${n.parent ? 1 - stage * 0.15 : 1})`}
                opacity={n.parent ? 1 - stage * 0.25 : 1}
              >
                <rect
                  x="-42"
                  y="-25"
                  width="84"
                  height="50"
                  rx="12"
                  fill={typeof n.e === "number" ? "#f5dc9e" : "#b0cdbb"}
                  stroke="#6a8778"
                />
                <text fontSize="23" y="8" textAnchor="middle">
                  {typeof n.e === "number"
                    ? n.e
                    : demonstrating || (counting && n.id !== "root")
                      ? evaluate(n.e)
                      : n.e.op}
                </text>
              </g>
            );
          })}
        </svg>
        <p>数字卡片沿连线靠近对应的运算框，括号里的部分先形成一个整体。</p>
      </div>
    );
  }
  if (spec.kind === "solids") {
    const h = 420;
    const arrangement: Record<string, number[][]> =
      spec.construction === 1
        ? {
            正方体: [
              [240, 330],
              [440, 330],
            ],
            长方体: [
              [190, 145],
              [470, 145],
              [330, 190],
              [190, 180],
              [475, 180],
            ],
            圆柱: [
              [240, 265],
              [440, 265],
              [465, 90],
            ],
            球: [
              [190, 350],
              [485, 350],
              [190, 100],
              [465, 37],
            ],
          }
        : {
            长方体: [
              [220, 130],
              [320, 190],
              [235, 230],
              [205, 265],
            ],
            球: [
              [215, 90],
              [255, 100],
            ],
            正方体: [[280, 85]],
            圆柱: [
              [245, 165],
              [430, 160],
              [410, 245],
              [455, 260],
            ],
          };
    return (
      <div className="nb-scene">
        {controls("把立体部件拆开分类")}
        <svg
          className="nb-svg"
          viewBox={`0 0 720 ${h}`}
          aria-label="立体积木模型拆分"
        >
          {spec.counts.flatMap((c, g) =>
            Array.from({ length: c.count }, (_, i) => {
              const raw = arrangement[c.kind][i] ?? [
                80 + (i % 8) * 75,
                100 + g * 70,
              ];
              return (
                <ClickGroup
                  key={g + "-" + i}
                  id={`solid-${g}-${i}`}
                  label={`${c.kind}部件${i + 1}`}
                  selected={selected}
                  onSelect={onSelect}
                  transform={`translate(${mix(raw[0], 65 + i * 65, stage)} ${mix(raw[1], 70 + g * 95, stage)})`}
                >
                  <rect
                    x="-28"
                    y="-34"
                    width="57"
                    height="70"
                    rx="10"
                    fill={
                      selected.includes(`solid-${g}-${i}`)
                        ? "#f6d489"
                        : "transparent"
                    }
                  />
                  <g data-solid-piece={c.kind}>
                    <SolidGlyph kind={c.kind} />
                  </g>
                  {counting && task.focus === c.kind && (
                    <text y="52" textAnchor="middle" fontSize="17">
                      {i + 1}
                    </text>
                  )}
                </ClickGroup>
              );
            }),
          )}
        </svg>
        <p>每个部件只数一次。拆开以后检查有没有被遮挡的小球或圆柱。</p>
      </div>
    );
  }
  if (spec.kind === "net") {
    const idx = Math.min(index, spec.nets.length - 1),
      net = spec.nets[idx],
      a = running
        ? (stage * Math.PI) / 2
        : ((angle ?? manual * 90) * Math.PI) / 180;
    const folded = foldNet(net, a),
      analysis = netAnalysis(net),
      projected = folded.map((f) => ({
        ...f,
        points: f.vertices.map((p) => project3(p, spec.yaw, 45)),
      }));
    const pts = projected.flatMap((f) => f.points),
      minX = Math.min(...pts.map((p) => p[0])),
      maxX = Math.max(...pts.map((p) => p[0])),
      minY = Math.min(...pts.map((p) => p[1])),
      maxY = Math.max(...pts.map((p) => p[1]));
    const scale = Math.min(
      110 / Math.max(spec.length, spec.short),
      560 / Math.max(1, maxX - minX),
      320 / Math.max(1, maxY - minY),
    );
    const point = (p: number[]) => [
      360 + (p[0] - (minX + maxX) / 2) * scale,
      210 + (p[1] - (minY + maxY) / 2) * scale,
    ];
    return (
      <div className="nb-scene">
        <div className="nb-net-options">
          {spec.nets.map((net, i) => {
            const mx = Math.max(...net.map((f) => f.x + f.w)),
              my = Math.max(...net.map((f) => f.y + f.h)),
              x0 = Math.min(...net.map((f) => f.x)),
              y0 = Math.min(...net.map((f) => f.y));
            return (
              <article key={i} className={idx === i ? "observing" : ""}>
                <strong>图{String.fromCharCode(65 + i)}</strong>
                <svg
                  viewBox={`${x0 - 0.2} ${y0 - 0.2} ${mx - x0 + 0.4} ${my - y0 + 0.4}`}
                  aria-label={`展开图${String.fromCharCode(65 + i)}`}
                >
                  {net.map((f) => (
                    <rect
                      key={f.id}
                      x={f.x}
                      y={f.y}
                      width={f.w}
                      height={f.h}
                      fill="#edf2e5"
                      stroke="#4d7062"
                      strokeWidth=".04"
                    />
                  ))}
                </svg>
                <button
                  disabled={running}
                  onClick={() => {
                    setIndex(i);
                    setAngle(null);
                  }}
                >
                  查看图{String.fromCharCode(65 + i)}
                </button>
                <button
                  aria-pressed={selected.includes("option-" + i)}
                  disabled={running}
                  onClick={() => onSelect("option-" + i)}
                >
                  选{String.fromCharCode(65 + i)}
                  {selected.includes("option-" + i) ? " ✓" : ""}
                </button>
              </article>
            );
          })}
        </div>
        {controls("沿棱折叠")}
        <label className="nb-slider">
          亲手控制折叠角度
          <input
            aria-label="折叠角度"
            type="range"
            min="0"
            max="90"
            value={running ? stage * 90 : (angle ?? manual * 90)}
            disabled={running}
            onChange={(e) => setAngle(Number(e.target.value))}
          />
          <output>{Math.round((a * 180) / Math.PI)}°</output>
        </label>
        <svg
          className="nb-svg"
          viewBox="0 0 720 450"
          aria-label="真正沿棱转动的三维折叠"
        >
          {projected
            .sort(
              (a, b) =>
                b.points.reduce((n, p) => n + p[2], 0) -
                a.points.reduce((n, p) => n + p[2], 0),
            )
            .map((f) => {
              const polygon = f.points.map((p) => point(p).join(",")).join(" "),
                center = point(project3(f.center, spec.yaw, 45));
              return (
                <g
                  key={f.id}
                  data-fold-face={f.id}
                  data-face-normal={f.n.map((v) => v.toFixed(3)).join(",")}
                >
                  <polygon
                    points={polygon}
                    fill={
                      a > 1.5 && analysis.overlap.includes(f.id)
                        ? "#d78879"
                        : color[Number(f.id.split("-")[1]) % 6]
                    }
                    stroke="#4e6d65"
                    strokeWidth="2.5"
                    opacity=".88"
                  />
                  <text
                    x={center[0]}
                    y={center[1] + 7}
                    fontSize="22"
                    textAnchor="middle"
                  >
                    {Number(f.id.split("-")[1]) + 1}
                  </text>
                </g>
              );
            })}
        </svg>
        <p>
          每个面围绕相邻的棱转动。折起后看看是否恰好围住六个方向，有没有两个面叠到同一位置。
        </p>
        {demonstrating && (
          <p className="nb-explanation">
            当前图{String.fromCharCode(65 + idx)}：
            {analysis.valid
              ? "六个面尺寸吻合，能围成封闭立体。"
              : "出现重合或缺口，不能围成要求的封闭立体。"}
          </p>
        )}
      </div>
    );
  }
  if (spec.kind === "view") {
    const target = voxelView(spec.voxels, spec.target),
      camera = view ?? null;
    const desired = camera ?? (stage > 0.5 ? spec.target : null);
    let yaw =
        desired === "前"
          ? 0
          : desired === "左"
            ? 90
            : desired === "右"
              ? -90
              : 0,
      pitch = desired === "上" ? 90 : 0;
    if (!desired) {
      yaw = spec.yaw;
      pitch = 35;
    }
    if (running || !camera) {
      yaw = mix(
        spec.yaw,
        spec.target === "前"
          ? 0
          : spec.target === "左"
            ? 90
            : spec.target === "右"
              ? -90
              : 0,
        stage,
      );
      pitch = mix(35, spec.target === "上" ? 90 : 0, stage);
    }
    const polys = spec.voxels.flatMap(([x, y, z], i) =>
      [
        [
          [x, y, z + 1],
          [x + 1, y, z + 1],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
        ],
        [
          [x, y, z],
          [x + 1, y, z],
          [x + 1, y, z + 1],
          [x, y, z + 1],
        ],
        [
          [x + 1, y, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          [x + 1, y, z + 1],
        ],
        [
          [x, y, z],
          [x, y + 1, z],
          [x, y + 1, z + 1],
          [x, y, z + 1],
        ],
        [
          [x, y + 1, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
        ],
        [
          [x, y, z],
          [x + 1, y, z],
          [x + 1, y + 1, z],
          [x, y + 1, z],
        ],
      ].map((ps, j) => ({
        id: i + "-" + j,
        shade: j,
        points: ps.map((p) => project3(p as V3, yaw, pitch)),
      })),
    );
    const pts = polys.flatMap((p) => p.points),
      cx =
        (Math.min(...pts.map((p) => p[0])) +
          Math.max(...pts.map((p) => p[0]))) /
        2,
      cy =
        (Math.min(...pts.map((p) => p[1])) +
          Math.max(...pts.map((p) => p[1]))) /
        2;
    const scale = 65;
    return (
      <div className="nb-scene">
        {controls("改变视角观察投影")}
        <div className="nb-tools">
          {(["上", "前", "左", "右"] as View[]).map((v) => (
            <button key={v} disabled={running} onClick={() => setView(v)}>
              从{v}面看
            </button>
          ))}
        </div>
        <svg
          className="nb-svg"
          viewBox="0 0 720 440"
          aria-label="积木三维视角与目标投影"
        >
          <text x="70" y="40" fontSize="20">
            立体模型
          </text>
          <text x="495" y="40" fontSize="20">
            题目目标图
          </text>
          {polys
            .sort(
              (a, b) =>
                b.points.reduce((n, p) => n + p[2], 0) -
                a.points.reduce((n, p) => n + p[2], 0),
            )
            .map((p) => (
              <polygon
                key={p.id}
                data-voxel-face={p.id}
                points={p.points
                  .map((pt) =>
                    [
                      240 + (pt[0] - cx) * scale,
                      220 + (pt[1] - cy) * scale,
                    ].join(","),
                  )
                  .join(" ")}
                fill={["#bfd5c1", "#91b2a5", "#74988b"][p.shade % 3]}
                stroke="#4c6e61"
                strokeWidth="2"
              />
            ))}
          {target.map(([x, y]) => (
            <rect
              key={x + "," + y}
              data-projection-cell={`${x},${y}`}
              x={490 + x * 40}
              y={160 + y * 40}
              width="40"
              height="40"
              fill="#f6eedb"
              stroke="#4f7165"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
    );
  }
  if (spec.kind === "motion")
    return (
      <div className="nb-scene">
        {controls("再看物体怎样运动")}
        <div className="nb-motion-grid">
          {spec.objects.map((o, i) => {
            const factor = running || grouped ? stage : manual;
            return (
              <article key={i}>
                <h3>
                  图{String.fromCharCode(65 + i)} · {o.label}
                </h3>
                <svg viewBox="0 0 360 310" aria-label={o.label + "运动演示"}>
                  {o.dx || o.dy ? (
                    <>
                      <path
                        d={`M${80} ${180}l${o.dx} ${o.dy}`}
                        stroke="#b9c7bd"
                        strokeDasharray="7 6"
                        strokeWidth="3"
                      />
                      <rect
                        x="40"
                        y="150"
                        width="80"
                        height="60"
                        fill="none"
                        stroke="#b9c7bd"
                        strokeDasharray="5 4"
                      />
                    </>
                  ) : null}
                  <g
                    data-moving-object={i}
                    transform={`translate(${o.dx ? 80 + o.dx * factor : 180} ${o.dy ? 180 + o.dy * factor : 150})`}
                  >
                    <g
                      transform={
                        o.icon === "block"
                          ? `rotate(${o.rotation * factor})`
                          : undefined
                      }
                    >
                      <MotionIcon kind={o.icon} angle={o.rotation * factor} />
                    </g>
                  </g>
                  {o.rotation !== 0 && (
                    <path
                      d={
                        o.rotation > 0
                          ? "M130 60A75 75 0 0 1 242 95L229 87M242 95L241 79"
                          : "M242 70A75 75 0 0 0 126 95L139 87M126 95L126 79"
                      }
                      fill="none"
                      stroke="#c16f57"
                      strokeWidth="3"
                    />
                  )}
                </svg>
                {task.pick && (
                  <button
                    aria-pressed={selected.includes("option-" + i)}
                    disabled={running}
                    onClick={() => onSelect("option-" + i)}
                  >
                    选{String.fromCharCode(65 + i)}
                    {selected.includes("option-" + i) ? " ✓" : ""}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    );
  if (spec.kind === "symmetry")
    return (
      <div className="nb-scene">
        {controls("沿虚线对折")}
        <p>灰色保留原图，橙色部分沿虚线对折。图形的方向和对称轴一起转动。</p>
        <div className="nb-pattern-grid">
          {spec.patterns.map((kind, i) => {
            const id = `clip-${kind}-${i}`,
              focus = task.focus === "pattern-" + i;
            return (
              <article key={i} className={focus ? "focused" : ""}>
                <h3>图{i + 1}</h3>
                <svg viewBox="0 0 240 240" aria-label={`图${i + 1}对折演示`}>
                  <defs>
                    <clipPath id={id}>
                      <rect x="-100" y="-100" width="100" height="200" />
                    </clipPath>
                  </defs>
                  <g
                    transform={`translate(120 120) rotate(${spec.angle}) scale(${spec.size / 100})`}
                  >
                    <PatternGraphic
                      kind={kind}
                      stroke="#a9b7ad"
                      fill="#e9ece6"
                    />
                    <path
                      d="M0-98V98"
                      stroke="#4f8874"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                    <g
                      transform={`scale(${Math.cos(stage * Math.PI)} 1)`}
                      data-symmetry-fold={i}
                    >
                      <g clipPath={`url(#${id})`}>
                        <PatternGraphic
                          kind={kind}
                          stroke="#c57b4d"
                          fill="#efd2a0"
                        />
                      </g>
                    </g>
                  </g>
                </svg>
                {task.pick && (
                  <button
                    aria-pressed={selected.includes("option-" + i)}
                    disabled={running}
                    onClick={() => onSelect("option-" + i)}
                  >
                    选图{i + 1}
                    {selected.includes("option-" + i) ? " ✓" : ""}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    );
  const roseSpec = spec;
  return (
    <div className="nb-scene">
      {controls("只移动花朵，试着与灰色目标重合")}
      <p>
        只许平移，不转动、不翻面、不改变大小。每格里的灰色轮廓都是同一朵目标花。
      </p>
      <div className="nb-rose-grid">
        {roseSpec.options.map((r, i) => {
          const x = mix(65, 165, stage),
            y = mix(160, 90, stage);
          return (
            <article key={i}>
              <strong>{String.fromCharCode(65 + i)}</strong>
              <svg
                viewBox="0 0 250 260"
                aria-label={`玫瑰选项${String.fromCharCode(65 + i)}`}
              >
                <g
                  transform={`translate(165 90) rotate(${roseSpec.target.angle}) scale(${roseSpec.target.size / 120})`}
                >
                  <Rose outline />
                </g>
                <g
                  data-rose={i}
                  transform={`translate(${x} ${y}) rotate(${r.angle}) scale(${((r.mirror ? -1 : 1) * r.size) / 120} ${r.size / 120})`}
                >
                  <Rose />
                </g>
              </svg>
              <button
                aria-pressed={selected.includes("option-" + i)}
                disabled={running}
                onClick={() => onSelect("option-" + i)}
              >
                选{String.fromCharCode(65 + i)}
                {selected.includes("option-" + i) ? " ✓" : ""}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
