import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Panel, WorkbookScene } from "./types";
import type { Task } from "../pdf/model";
import { mod, timeText } from "./model";
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const palette = ["#407e76", "#c47c99", "#5b94bd", "#d1a64a"];
function Clock({
  time,
  wrong = false,
  offset = 0,
  seconds = false,
}: {
  time: number;
  wrong?: boolean;
  offset?: number;
  seconds?: boolean;
}) {
  return (
    <g transform="translate(170 155)">
      <circle r="118" fill="#fffcef" stroke="#3c675e" strokeWidth="7" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          y1={i % 5 === 0 ? -108 : -111}
          y2="-116"
          transform={`rotate(${i * 6})`}
          stroke="#476659"
          strokeWidth={i % 5 === 0 ? 3 : 1}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1,
          angle = ((wrong ? -n : n) * Math.PI) / 6;
        return (
          <text
            key={n}
            x={Math.sin(angle) * 94}
            y={-Math.cos(angle) * 94 + 6}
            textAnchor="middle"
            fontSize="20"
            fill="#234d43"
          >
            {n}
          </text>
        );
      })}
      <line
        data-clock-hand="hour"
        y2="-60"
        transform={`rotate(${mod(time / 2 + offset, 360)})`}
        stroke="#32483f"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <line
        data-clock-hand="minute"
        y2="-91"
        transform={`rotate(${mod(time * 6, 360)})`}
        stroke="#3d81ac"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {seconds && (
        <line
          data-clock-hand="second"
          y1="15"
          y2="-102"
          transform={`rotate(${mod(time * 360, 360)})`}
          stroke="#d86d52"
          strokeWidth="2"
        />
      )}
      <circle r="7" fill="#d6a144" />
    </g>
  );
}
function Glyph({
  shape,
  color,
  icon,
  size = 1,
  extra = 0,
  plain = false,
  monochrome = false,
}: {
  shape: number;
  color: number;
  icon: string;
  size?: number;
  extra?: number;
  plain?: boolean;
  monochrome?: boolean;
}) {
  if (plain)
    return (
      <text
        textAnchor="middle"
        y="12"
        fontSize="42"
        fill={
          monochrome
            ? color === 0
              ? "#273c34"
              : "white"
            : ["#e1c767", "#d895b3", "#87bcd0"][color % 3]
        }
        stroke={monochrome ? "#273c34" : "none"}
        strokeWidth="1.2"
      >
        {icon}
      </text>
    );
  if (icon === "杯")
    return (
      <g stroke="#405e59" fill="white">
        <path
          d={shape === 0 ? "M-22-24H22L14 24H-14Z" : "M-18-24H18V24H-18Z"}
        />
        {extra > 0 && (
          <path
            d={
              shape === 0
                ? `M${extra === 1 ? -18 : -21} ${extra === 1 ? 0 : -22}H${extra === 1 ? 18 : 21}L14 24H-14Z`
                : `M-17 ${extra === 1 ? 0 : -22}H17V23H-17Z`
            }
            fill="#89bed2"
          />
        )}
        {shape === 2 && <path d="M18-15H28V15H18" fill="none" />}
      </g>
    );
  const fill = ["#f6df80", "#e1a8c1", "#a8d6e4", "#fff"][color % 4],
    r = 23 * (size ? 1 : 0.8);
  return (
    <g>
      <g fill={fill} stroke="#4c625d" strokeWidth="2">
        {shape === 0 ? (
          <polygon points={`0,${-r} ${r},${r} ${-r},${r}`} />
        ) : shape === 1 ? (
          <rect x={-r} y={-r} width={r * 2} height={r * 2} />
        ) : shape === 3 ? (
          <rect x={-r * 1.25} y={-r * 0.7} width={r * 2.5} height={r * 1.4} />
        ) : (
          <circle r={r} />
        )}
      </g>
      {icon === "杯" ? (
        <g fill="none" stroke="#405e59">
          <path d="M-12-18H12L10 20H-10Z" fill="#fff" />
          {extra > 0 && (
            <path
              d={`M-11 ${extra === 1 ? 0 : -16}H11L10 19H-10Z`}
              fill="#89bed2"
            />
          )}
          {shape === 2 && <path d="M13-10H21V12H12" />}
        </g>
      ) : (
        <text
          textAnchor="middle"
          y="8"
          fontSize="25"
          fill={color === 1 && ["♥", "★"].includes(icon) ? "#fff" : "#233e36"}
          stroke={
            color === 1 && ["♥", "★"].includes(icon) ? "#233e36" : "none"
          }
        >
          {icon}
        </text>
      )}
    </g>
  );
}
function MovingCard({
  id,
  x,
  y,
  paused,
  snap,
  onClick,
  children,
}: {
  id: number;
  x: number;
  y: number;
  paused: boolean;
  snap: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const [pos, setPos] = useState([x, y]),
    current = useRef([x, y]),
    pause = useRef(paused);
  pause.current = paused;
  useEffect(() => {
    if (snap || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = [x, y];
      setPos([x, y]);
      return;
    }
    let raf = 0,
      last = 0,
      elapsed = 0;
    const from = [...current.current];
    const step = (now: number) => {
      if (!pause.current && last) elapsed += Math.min(80, now - last);
      last = now;
      const t = Math.min(1, elapsed / 350),
        next = [mix(from[0], x, t), mix(from[1], y, t)];
      current.current = next;
      setPos(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [x, y, snap]);
  return (
    <g
      data-class-card={id}
      transform={`translate(${pos[0]} ${pos[1]})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {children}
    </g>
  );
}
export function WorkbookCanvas({
  scene,
  task,
  frame,
  progress,
  running,
  paused,
  grouped,
  demonstrating,
  selected,
  onSelect,
}: {
  scene: WorkbookScene;
  task: Task;
  frame: number;
  progress: number;
  running: boolean;
  paused: boolean;
  grouped: boolean;
  demonstrating: boolean;
  selected: string[];
  onSelect: (id: string) => void;
}) {
  const panel = scene.panels[Number(task.focus) || 0];
  return (
    <PanelCanvas
      key={task.id + JSON.stringify(panel)}
      p={panel}
      {...{
        frame,
        progress,
        running,
        paused,
        grouped,
        demonstrating,
        selected,
        onSelect,
      }}
    />
  );
}
function PanelCanvas({
  p,
  frame,
  progress,
  running,
  paused,
  grouped,
  demonstrating,
  selected,
  onSelect,
}: {
  p: Panel;
  frame: number;
  progress: number;
  running: boolean;
  paused: boolean;
  grouped: boolean;
  demonstrating: boolean;
  selected: string[];
  onSelect: (id: string) => void;
}) {
  const [manual, setManual] = useState<number | null>(null),
    [active, setActive] = useState<number | null>(null),
    [draw, setDraw] = useState(0),
    [marks, setMarks] = useState<number[]>([]),
    [aligned, setAligned] = useState(false);
  const pauseRef = useRef(paused);
  pauseRef.current = paused;
  const raf = useRef(0);
  const override = useRef(0);
  useEffect(() => {
    if (running) {
      cancelAnimationFrame(raf.current);
      setManual(null);
      setMarks([]);
      setActive(null);
      setAligned(false);
    }
    return () => cancelAnimationFrame(raf.current);
  }, [running]);
  const animate = () => {
    cancelAnimationFrame(raf.current);
    setManual(0);
    override.current = 0;
    let last = 0;
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 400
      : 2200;
    const tick = (now: number) => {
      if (!pauseRef.current && last)
        override.current = Math.min(
          1,
          override.current + Math.min(80, now - last) / duration,
        );
      last = now;
      setManual(override.current);
      if (override.current < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => {
    if (grouped && !running) animate();
  }, [grouped]);
  const factor = running ? Math.min(1, (frame + progress) / 2) : (manual ?? 1);
  const svg = (children: ReactNode, height = 330, width = 720) => (
    <div className="wb-scroll">
      <svg
        className="wb-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="可操作的数学物体动画"
      >
        {children}
      </svg>
    </div>
  );
  const buttons = (
    <div className="wb-controls">
      <button disabled={running} onClick={animate}>
        再演示一次物体变化
      </button>
      <button
        disabled={running}
        onClick={() => {
          cancelAnimationFrame(raf.current);
          setManual(0);
          setMarks([]);
          setAligned(false);
        }}
      >
        恢复原来位置
      </button>
    </div>
  );
  if (!p) return <p>请返回选择题目。</p>;
  let content: ReactNode;
  if (p.kind === "stack") {
    const scale =
      180 / Math.max(p.block + p.cylinder, 2 * p.block + p.cube + p.cylinder);
    let y = 270;
    const shape = (
      x: number,
      bottom: number,
      h: number,
      w: number,
      fill: string,
      id: string,
    ) => (
      <g
        key={id}
        data-stack-piece={id}
        transform={`translate(${x} ${bottom - h * scale})`}
      >
        {id.includes("cylinder") ? (
          <g fill={fill} stroke="#47695a">
            <path
              d={`M0 5V${h * scale - 5}A${w / 2} 5 0 0 0 ${w} ${h * scale - 5}V5Z`}
            />
            <ellipse data-stack-cylinder cx={w / 2} cy="5" rx={w / 2} ry="5" />
          </g>
        ) : (
          <>
            <rect width={w} height={h * scale} fill={fill} stroke="#47695a" />
            <path
              d={`M0 0L12-10H${w + 12}V${h * scale - 10}L${w} ${h * scale}M${w} 0L${w + 12}-10`}
              fill="none"
              stroke="#47695a"
            />
          </>
        )}
      </g>
    );
    content = svg(
      <>
        <text x="40" y="28" fontSize="18">
          长方体高{p.block}厘米 · 正方体高{p.cube}厘米 · 圆柱高{p.cylinder}厘米
        </text>
        <line x1="30" x2="680" y1="270" y2="270" stroke="#8caa95" />
        {shape(100, 270, p.block, 150, "#9dc6bb", "a-base")}
        {[0, 1].map((i) =>
          shape(
            110 + i * 75,
            270 - p.block * scale - mix(80, 0, factor),
            p.cylinder,
            45,
            "#a4bddc",
            "a-cylinder-" + i,
          ),
        )}
        {shape(430, 270, p.block, 150, "#9dc6bb", "b-base0")}
        {shape(
          430,
          270 - p.block * scale - mix(60, 0, factor),
          p.block,
          150,
          "#9dc6bb",
          "b-base1",
        )}
        {shape(
          465,
          270 - 2 * p.block * scale - mix(90, 0, factor),
          p.cube,
          65,
          "#dbbb75",
          "b-cube",
        )}
        {shape(
          477,
          270 - (2 * p.block + p.cube) * scale - mix(120, 0, factor),
          p.cylinder,
          40,
          "#a4bddc",
          "b-cylinder",
        )}
        <text x="100" y="310" fontSize="20">
          ① 并排不加两次高度
        </text>
        <text x="430" y="310" fontSize="20">
          ② 每层高度依次相加
        </text>
      </>,
      350,
    );
  } else if (p.kind === "transfer") {
    const gray = (p.white + p.give) * p.multiple + p.give,
      total = gray + p.white;
    content = svg(
      <>
        <text x="40" y="25" fontSize="20">
          白兔原来{p.white}个 · 灰兔给白兔{p.give}个 · 给出后灰兔是白兔的
          {p.multiple}倍
        </text>
        <text x="40" y="65" fontSize="28">
          🐰 白兔
        </text>
        <text x="390" y="65" fontSize="28">
          🐇 灰兔
        </text>
        {Array.from({ length: total }, (_, i) => {
          const white = i < p.white,
            transfer = !white && i - p.white < p.give,
            slot = white ? i : i - p.white,
            x0 = white ? 45 + (slot % 8) * 32 : 390 + (slot % 8) * 32,
            y0 = 100 + Math.floor(slot / 8) * 34,
            x1 = transfer ? 45 + ((p.white + slot) % 8) * 32 : x0,
            y1 = transfer ? 100 + Math.floor((p.white + slot) / 8) * 34 : y0;
          return (
            <text
              data-transfer-carrot={i}
              key={i}
              x={mix(x0, x1, transfer ? factor : 0)}
              y={mix(y0, y1, transfer ? factor : 0)}
              fontSize="24"
            >
              🥕
            </text>
          );
        })}
        <text x="40" y="310" fontSize="18">
          胡萝卜只是换主人，总数量始终不变。
        </text>
      </>,
      350,
    );
  } else if (p.kind === "clock") {
    const time = p.draw
      ? draw
      : p.elapsed
        ? p.minutes + p.elapsed * factor
        : Math.floor(p.minutes / 60) * 60 + (p.minutes % 60) * factor;
    content = (
      <>
        <p className="wb-clock-facts">
          {p.draw
            ? `你拨的是 ${timeText(draw)}`
            : p.elapsed
              ? `开始 ${timeText(p.minutes)} → 结束 ${timeText(p.minutes + p.elapsed)}`
              : "蓝色长针是分针，深色短针是时针。"}
        </p>
        {svg(
          <>
            <Clock
              time={time}
              wrong={p.wrongDial}
              offset={p.offset}
              seconds={p.seconds}
            />
            <g className="wb-clock-aside" transform="translate(330 45)">
              <text y="0" fontSize="21" fill="#355c50">
                {p.draw
                  ? "亲手拨动两根针"
                  : p.elapsed
                    ? "同一段时间，两针一起走"
                    : "先看时针，再看分针"}
              </text>
              {p.elapsed ? (
                <>
                  <text y="45" fontSize="21">
                    开始 {timeText(p.minutes)}
                  </text>
                  <text y="80" fontSize="21">
                    结束 {timeText(p.minutes + p.elapsed)}
                  </text>
                  <text y="118" fontSize="21">
                    已过 {Math.floor(p.elapsed * factor)} 分钟
                  </text>
                  {p.seconds && (
                    <text y="153" fontSize="19">
                      秒针已走 {Math.floor(p.elapsed * factor)} 圈
                    </text>
                  )}
                  <line
                    x1="0"
                    y1="195"
                    x2="320"
                    y2="195"
                    stroke="#9bbdb0"
                    strokeWidth="9"
                  />
                  <circle cx={320 * factor} cy="195" r="12" fill="#cf9d3e" />
                </>
              ) : (
                <>
                  <text y="55" fontSize="20">
                    蓝色长针：分针
                  </text>
                  <text y="90" fontSize="20">
                    深色短针：时针
                  </text>
                  {p.seconds && (
                    <text y="125" fontSize="20">
                      红色细针：秒针
                    </text>
                  )}
                  {p.draw && (
                    <text y="180" fontSize="28">
                      你拨的是 {timeText(draw)}
                    </text>
                  )}
                </>
              )}
            </g>
          </>,
          330,
          340,
        )}
        {p.draw ? (
          <div className="wb-controls">
            <label>
              拨动小时
              <select
                aria-label="拨动小时"
                value={Math.floor(draw / 60) || 12}
                onChange={(e) =>
                  setDraw((Number(e.target.value) % 12) * 60 + (draw % 60))
                }
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1}>{i + 1}</option>
                ))}
              </select>
            </label>
            <label>
              拨动分钟
              <input
                aria-label="拨动分钟"
                type="range"
                min="0"
                max="59"
                value={draw % 60}
                onChange={(e) =>
                  setDraw(Math.floor(draw / 60) * 60 + Number(e.target.value))
                }
              />
            </label>
            <button onClick={() => onSelect(`wb-single:clock-${draw}`)}>
              确认这个时刻
            </button>
            <p>
              {selected.length
                ? "已选择 " + timeText(Number(selected[0].split("-").at(-1)))
                : "拨好后确认，再提交答案。"}
            </p>
          </div>
        ) : p.elapsed ? (
          <label className="wb-scrub">
            拖动观察同一段时间
            <input
              aria-label="时间进度"
              type="range"
              min="0"
              max="1000"
              value={Math.round(factor * 1000)}
              disabled={running}
              onChange={(e) => {
                cancelAnimationFrame(raf.current);
                setManual(Number(e.target.value) / 1000);
              }}
            />
          </label>
        ) : null}
        <p className="footnote">
          动画为加速演示；计时长度按题目数据，不是屏幕实际播放的秒数。钟针顺时针连续移动。
        </p>
      </>
    );
  } else if (p.kind === "divide") {
    const quotient = Math.floor(p.total / p.size),
      remainder = p.total % p.size,
      groups = p.mode === "each" ? quotient : p.size,
      per = p.mode === "each" ? p.size : quotient;
    const moved = Math.floor(p.total * factor);
    const rows = Math.ceil(p.total / 12),
      base = 80 + rows * 32,
      h = base + Math.ceil(Math.max(groups, 1) / 6) * 110 + 70;
    content = (
      <>
        {svg(
          <>
            <text x="20" y="25" fontSize="20">
              原来共 {p.total} {p.unit} · 每个图标代表1个
            </text>
            {Array.from({ length: groups }, (_, g) => (
              <g
                key={g}
                transform={`translate(${25 + (g % 6) * 114} ${base + Math.floor(g / 6) * 110})`}
              >
                <rect
                  width="103"
                  height="95"
                  rx="12"
                  fill="#edf5ed"
                  stroke="#91b4a4"
                />
                <text x="8" y="22" fontSize="15">
                  第{g + 1}份
                </text>
              </g>
            ))}
            {Array.from({ length: p.total }, (_, i) => {
              const assigned = i < quotient * p.size,
                g = p.mode === "each" ? Math.floor(i / per) : i % p.size,
                slot = p.mode === "each" ? i % per : Math.floor(i / p.size),
                x0 = 30 + (i % 12) * 55,
                y0 = 60 + Math.floor(i / 12) * 32,
                targetX = assigned
                  ? 42 + (g % 6) * 114 + (slot % 4) * 21
                  : 40 + (i - quotient * p.size) * 40,
                targetY = assigned
                  ? base +
                    48 +
                    Math.floor(g / 6) * 110 +
                    Math.floor(slot / 4) * 22
                  : h - 25,
                done = i < moved;
              return (
                <text
                  data-division-item={i}
                  data-place={
                    done ? (assigned ? "group" : "remainder") : "source"
                  }
                  key={i}
                  x={mix(
                    x0,
                    targetX,
                    Math.max(0, Math.min(1, factor * p.total - i)),
                  )}
                  y={mix(
                    y0,
                    targetY,
                    Math.max(0, Math.min(1, factor * p.total - i)),
                  )}
                  fontSize="21"
                  textAnchor="middle"
                  fill={assigned ? "#3e7769" : "#b56b45"}
                >
                  {p.icon}
                </text>
              );
            })}
            <text x="20" y={h - 50} fontSize="17">
              余下区域：不能凑成完整一份的，留在这里。
            </text>
            {demonstrating && (
              <text x="250" y={h - 22} fontSize="21">
                {p.total}÷{p.size}＝{quotient}……{remainder}
              </text>
            )}
          </>,
          h,
        )}
        <button
          disabled={running}
          onClick={() => {
            cancelAnimationFrame(raf.current);
            setManual(
              Math.min(
                1,
                ((manual === null ? p.total : Math.floor(p.total * manual)) +
                  1) /
                  p.total,
              ),
            );
          }}
        >
          亲手再分1个
        </button>
        <p>先点“恢复原来位置”，再逐个分；可以数完整的份与剩余物体。</p>
      </>
    );
  } else if (p.kind === "objects") {
    const max = Math.max(...p.rows.map((r) => r.count)),
      width = Math.max(720, Math.min(1200, max * 26 + 170));
    let y = 45;
    const groups = p.rows.map((r, ri) => {
      const y0 = y,
        cols = Math.min(25, r.count);
      y += Math.ceil(r.count / cols) * 31 + 45;
      return (
        <g key={ri}>
          <text x="16" y={y0} fontSize="19">
            {r.label}
            {r.value !== undefined ? ` · 每个标${r.value}` : ""}
          </text>
          {Array.from({ length: r.count }, (_, i) => (
            <g
              key={i}
              data-wb-object={`${ri}-${i}`}
              transform={`translate(${mix(30 + (i % 20) * 30, 165 + (i % cols) * 29, factor)} ${mix(35 + ri * 20, y0 - 7 + Math.floor(i / cols) * 31, factor)})`}
              onClick={() =>
                setMarks((m) =>
                  m.includes(ri * 1000 + i)
                    ? m.filter((x) => x !== ri * 1000 + i)
                    : [...m, ri * 1000 + i],
                )
              }
              style={{ cursor: "pointer" }}
            >
              <circle
                r="15"
                fill={marks.includes(ri * 1000 + i) ? "#f2d06d" : "transparent"}
              />
              <text
                textAnchor="middle"
                y="7"
                fontSize="22"
                fill={palette[ri % 4]}
              >
                {r.icon}
              </text>
            </g>
          ))}
        </g>
      );
    });
    content = svg(groups, y + 15, width);
  } else if (p.kind === "line") {
    const max = p.start + p.jump * p.times,
      min = Math.max(0, p.start - 1),
      scale = 640 / Math.max(1, max - min),
      at = p.start + p.jump * p.times * factor;
    content = svg(
      <>
        <line
          x1="40"
          x2="690"
          y1="165"
          y2="165"
          stroke="#486859"
          strokeWidth="3"
        />
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const x = 40 + i * scale,
            val = min + i;
          return (
            <g key={val}>
              <line x1={x} x2={x} y1="158" y2="173" stroke="#486859" />
              {i % Math.max(1, Math.ceil((max - min) / 30)) === 0 && (
                <text x={x} y="196" textAnchor="middle" fontSize="17">
                  {val}
                </text>
              )}
            </g>
          );
        })}
        {Array.from({ length: p.times }, (_, i) => (
          <path
            key={i}
            d={`M${40 + (p.start - min + i * p.jump) * scale} 160Q${40 + (p.start - min + (i + 0.5) * p.jump) * scale} 80 ${40 + (p.start - min + (i + 1) * p.jump) * scale} 160`}
            fill="none"
            stroke={i / p.times <= factor ? "#d4a649" : "#d3ded4"}
            strokeWidth="3"
          />
        ))}
        {p.tree ? (
          Array.from({ length: p.times + 1 }, (_, i) =>
            (p.ends === 1 && i === p.times) ||
            (p.ends === 2 && (i === 0 || i === p.times)) ? null : (
              <text
                key={i}
                x={40 + (p.start - min + i * p.jump) * scale}
                y="146"
                textAnchor="middle"
                fontSize="30"
                opacity={i / (p.times + 1) < factor ? 1 : 0.15}
              >
                🌳
              </text>
            ),
          )
        ) : (
          <text
            data-numberline-mover
            x={40 + (at - min) * scale}
            y={138 - 25 * Math.abs(Math.sin(factor * p.times * Math.PI))}
            textAnchor="middle"
            fontSize="35"
          >
            🐾
          </text>
        )}
        <text x="30" y="250" fontSize="20">
          起点 {p.start} · 每段 {p.jump} · 共 {p.times} 段
        </text>
      </>,
      290,
    );
  } else if (p.kind === "direction") {
    const turnTotal = p.turns.reduce((a, b) => a + (b === 3 ? -1 : b), 0),
      angle = (p.facing + p.north + turnTotal * factor) * 90,
      names = ["北", "东", "南", "西"];
    const route = p.route ?? [];
    content = svg(
      <>
        <g transform="translate(565 95)">
          <circle r="60" fill="#f6edcf" />
          {names.map((n, i) => (
            <text
              key={n}
              x={Math.sin(((i + p.north) * Math.PI) / 2) * 75}
              y={-Math.cos(((i + p.north) * Math.PI) / 2) * 75 + 6}
              textAnchor="middle"
              fontSize="20"
            >
              {n}
            </text>
          ))}
          <path
            d="M0-50L-10-20H10Z"
            transform={`rotate(${p.north * 90})`}
            fill="#c56c4f"
          />
          <text y="110" textAnchor="middle" fontSize="16">
            北箭头 → {["上", "右", "下", "左"][p.north]}
          </text>
        </g>
        {p.places.length ? (
          p.places.map((o, i) => (
            <g
              key={i}
              transform={`translate(${65 + o.x * 145} ${65 + o.y * 100})`}
            >
              <rect
                x="-55"
                y="-25"
                width="120"
                height="56"
                rx="12"
                fill="#edf3e8"
                stroke="#699c88"
              />
              <text textAnchor="middle" y="7" fontSize="19">
                {o.name}
              </text>
            </g>
          ))
        ) : (
          <g
            transform={`translate(220 155) rotate(${angle})`}
            data-direction-mover
          >
            <circle r="48" fill="#e8c56d" />
            <path d="M0-63L-18-30H18Z" fill="#3c7b6b" />
            <circle cx="-17" cy="-7" r="5" />
            <circle cx="17" cy="-7" r="5" />
            <path
              d="M-15 18Q0 33 15 18"
              fill="none"
              stroke="#364d41"
              strokeWidth="4"
            />
          </g>
        )}
        {route.length > 1 && (
          <circle
            r="13"
            fill="#cc9652"
            cx={
              65 +
              mix(
                p.places[
                  route[
                    Math.min(
                      route.length - 2,
                      Math.floor(factor * (route.length - 1)),
                    )
                  ]
                ]?.x ?? 0,
                p.places[
                  route[
                    Math.min(
                      route.length - 1,
                      Math.floor(factor * (route.length - 1)) + 1,
                    )
                  ]
                ]?.x ?? 0,
                factor === 1 ? 1 : mod(factor * (route.length - 1), 1),
              ) *
                145
            }
            cy={
              65 +
              mix(
                p.places[
                  route[
                    Math.min(
                      route.length - 2,
                      Math.floor(factor * (route.length - 1)),
                    )
                  ]
                ]?.y ?? 0,
                p.places[
                  route[
                    Math.min(
                      route.length - 1,
                      Math.floor(factor * (route.length - 1)) + 1,
                    )
                  ]
                ]?.y ?? 0,
                factor === 1 ? 1 : mod(factor * (route.length - 1), 1),
              ) *
                100
            }
          />
        )}
      </>,
      380,
    );
  } else if (p.kind === "sort") {
    const binFor = (i: number) => {
        const s = selected.find((x) => x.startsWith(`wb-sort:${i}:`));
        return s ? Number(s.split(":")[2]) : null;
      },
      counts = p.labels.map(
        (_, b) => p.items.filter((__, i) => binFor(i) === b).length,
      ),
      cell = 65,
      sourceHeight = Math.ceil(p.items.length / 10) * 70 + 45,
      binTop = sourceHeight + 45,
      cols = Math.max(1, Math.floor(9 / p.labels.length)),
      height = binTop + Math.ceil(p.items.length / cols) * 55 + 110;
    content = (
      <>
        {svg(
          <>
            <text x="20" y="24" fontSize="18">
              共 {p.items.length} 张 · 已放入{" "}
              {counts.reduce((a, b) => a + b, 0)} 张
            </text>
            {p.labels.map((label, b) => (
              <g
                key={b}
                transform={`translate(${15 + b * (690 / p.labels.length)} ${binTop})`}
              >
                <rect
                  width={680 / p.labels.length}
                  height={height - binTop - 20}
                  rx="10"
                  fill="#eef3e6"
                  stroke="#85a88f"
                />
                <text x="10" y="25" fontSize="17">
                  {label}：{counts[b]}
                </text>
              </g>
            ))}
            {p.items.map((it, i) => {
              const bin = binFor(i),
                before = p.items
                  .slice(0, i)
                  .filter((_, j) => binFor(j) === bin).length,
                x =
                  bin === null
                    ? 40 + (i % 10) * cell
                    : 45 + (bin * 690) / p.labels.length + (before % cols) * 50,
                y =
                  bin === null
                    ? 65 + Math.floor(i / 10) * 70
                    : binTop + 62 + Math.floor(before / cols) * 53;
              return (
                <MovingCard
                  id={i}
                  key={i}
                  x={mix(330 + (i % 3) * 12, x, factor)}
                  y={mix(60 + Math.floor(i / 3) * 5, y, factor)}
                  paused={paused}
                  snap={running}
                  onClick={() => !running && setActive(i)}
                >
                  <circle
                    r="30"
                    fill={active === i ? "#e8c76e" : "transparent"}
                  />
                  <Glyph
                    {...it}
                    shape={it.frame ?? it.shape}
                    plain={p.items.every((x) =>
                      ["♥", "★", "▬", "●"].includes(x.icon),
                    )}
                    monochrome={p.items.every((x) =>
                      ["♥", "★"].includes(x.icon),
                    )}
                  />
                  <text y="42" textAnchor="middle" fontSize="15">
                    {i + 1}
                  </text>
                </MovingCard>
              );
            })}
          </>,
          Math.max(height, binTop + 180),
        )}
        <div className="wb-controls">
          {p.labels.map((label, bin) => (
            <button
              key={label}
              disabled={running || active === null}
              onClick={() => {
                if (active !== null) onSelect(`wb-sort:${active}:${bin}`);
                setActive(null);
              }}
            >
              放入：{label}
            </button>
          ))}
        </div>
        <p role="status">
          {active === null
            ? "先点卡片，再点分类区按钮。可重新选择已放入的卡片进行修改。"
            : `已选第${active + 1}张，请选分类区。`}
        </p>
        <div className="wb-card-buttons" aria-label="卡片点击替代操作">
          {p.items.map((it, i) => (
            <button
              key={i}
              disabled={running}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            >
              {i + 1} {it.icon}
            </button>
          ))}
        </div>
      </>
    );
  } else if (p.kind === "segments") {
    const xs = p.points.map((p) => p[0]),
      ys = p.points.map((p) => p[1]),
      minX = Math.min(...xs),
      minY = Math.min(...ys),
      scale = Math.min(
        450 / Math.max(1, Math.max(...xs) - minX),
        220 / Math.max(1, Math.max(...ys) - minY),
      ),
      pt = (i: number) => [
        110 + (p.points[i][0] - minX) * scale,
        50 + (p.points[i][1] - minY) * scale,
      ];
    content = (
      <>
        {svg(
          <>
            {p.edges.map(([a, b], i) => {
              const [x, y] = pt(a),
                [xx, yy] = pt(b);
              return (
                <g key={i}>
                  <line
                    data-segment={i}
                    x1={x}
                    y1={y}
                    x2={mix(x, xx, factor)}
                    y2={mix(y, yy, factor)}
                    stroke={marks.includes(i) ? "#d19936" : "#47796c"}
                    strokeWidth={marks.includes(i) ? 8 : 4}
                  />
                  {grouped && (
                    <text
                      x={(x + xx) / 2 + 10}
                      y={(y + yy) / 2 + 12}
                      fontSize="19"
                    >
                      {i + 1}
                    </text>
                  )}
                </g>
              );
            })}
            {p.curves && (
              <>
                <path
                  d="M110 50Q220 100 335 50T560 50M110 270Q220 320 335 270T560 270"
                  fill="none"
                  stroke="#c68b6d"
                  strokeWidth="4"
                />
              </>
            )}
            {p.points.map((_, i) => {
              const [x, y] = pt(i);
              return <circle key={i} cx={x} cy={y} r="5" fill="#344a40" />;
            })}
          </>,
        )}
        <div className="wb-controls">
          {p.edges.map((_, i) => (
            <button
              key={i}
              disabled={running}
              aria-pressed={marks.includes(i)}
              onClick={() =>
                setMarks((m) =>
                  m.includes(i) ? m.filter((j) => j !== i) : [...m, i],
                )
              }
            >
              标记线段 {i + 1}
            </button>
          ))}
        </div>
      </>
    );
  } else if (p.kind === "ribbon") {
    const width = p.inverse ? p.span - p.extra : p.span,
      rope = p.inverse ? p.span : p.span + p.extra,
      straight = 520,
      amplitude = 110 * factor;
    content = svg(
      <>
        <line
          x1="80"
          y1="110"
          x2="600"
          y2="110"
          stroke="#9cb9ab"
          strokeWidth="3"
        />
        {Array.from({ length: width + 1 }, (_, i) => (
          <g key={i}>
            <line
              x1={80 + (i * straight) / width}
              x2={80 + (i * straight) / width}
              y1="94"
              y2="118"
              stroke="#658a78"
            />
            <text
              x={80 + (i * straight) / width}
              y="80"
              textAnchor="middle"
              fontSize="18"
            >
              {i}
            </text>
          </g>
        ))}
        <path
          data-curved-ribbon
          d={`M80 125Q340 ${125 + amplitude * 2} 600 125`}
          fill="none"
          stroke="#d2a13d"
          strokeWidth="8"
        />
        <text x="80" y="290" fontSize="20">
          直线跨度：{width} 单位 · 彩带总长：{rope} 单位
        </text>
        <text x="80" y="325" fontSize="17">
          长度关系由本次预留量确定；曲线只是形状示意，不按像素量长。
        </text>
      </>,
      360,
    );
  } else if (p.kind === "measure") {
    const extent = Math.max(...p.rows.map((r) => r.start + r.length)),
      scale = 570 / Math.max(1, extent);
    content = p.vertical ? (
      <>
        {svg(
          <>
            <text x="25" y="25" fontSize="18">
              彩色标高条代表小狗实际高度，灰台不算身高。
            </text>
            {p.rows.map((r, i) => {
              const unit = 230 / extent,
                base = r.start * (1 - factor),
                x = 90 + i * 180;
              return (
                <g key={i}>
                  <rect
                    x={x - 12}
                    y={300 - base * unit}
                    width="94"
                    height={base * unit}
                    fill="#d6ddcf"
                  />
                  <rect
                    data-measure-object={i}
                    x={x}
                    y={300 - (base + r.length) * unit}
                    width="70"
                    height={r.length * unit}
                    fill={palette[i % 4]}
                  />
                  <text x={x - 5} y="330" fontSize="17">
                    {r.label}
                  </text>
                  <text x={x - 5} y="355" fontSize="14">
                    原底{r.start}，头顶{r.start + r.length}
                  </text>
                </g>
              );
            })}
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i}>
                <line
                  x1="25"
                  x2="660"
                  y1={300 - (i * 230) / 7}
                  y2={300 - (i * 230) / 7}
                  stroke="#a7baaa"
                  strokeDasharray="4 5"
                />
                <text x="665" y={305 - (i * 230) / 7} fontSize="13">
                  {Math.round((extent * i) / 7)}
                </text>
              </g>
            ))}
          </>,
          390,
        )}
        <button
          disabled={running}
          onClick={() => {
            setAligned(true);
            animate();
          }}
        >
          去掉灰台，底部对齐
        </button>
      </>
    ) : (
      <>
        {svg(
          <>
            {Array.from({ length: Math.min(60, extent) + 1 }, (_, i) => {
              const val = extent > 60 ? (i * extent) / 60 : i;
              return (
                <g key={i}>
                  <line
                    x1={100 + val * scale}
                    x2={100 + val * scale}
                    y1="35"
                    y2="50"
                    stroke="#547363"
                  />
                  {i % Math.max(1, Math.ceil(extent / 30)) === 0 && (
                    <text
                      x={100 + val * scale}
                      y="25"
                      textAnchor="middle"
                      fontSize="15"
                    >
                      {Math.round(val * 100) / 100}
                    </text>
                  )}
                </g>
              );
            })}
            {p.rows.map((r, i) => {
              const start = r.start * (1 - factor);
              return (
                <g key={i} transform={`translate(0 ${85 + i * 65})`}>
                  <text x="5" y="20" fontSize="16">
                    {r.label}
                  </text>
                  <rect
                    data-measure-object={i}
                    x={100 + start * scale}
                    y="0"
                    width={r.length * scale}
                    height="25"
                    rx="5"
                    fill={palette[i % 4]}
                  />
                  <text x={100 + start * scale} y="48" fontSize="14">
                    {r.start} → {r.start + r.length} {p.unit}（原来刻度）
                  </text>
                </g>
              );
            })}
          </>,
          110 + p.rows.length * 65,
        )}
        <button
          disabled={running}
          onClick={() => {
            setAligned(true);
            animate();
          }}
        >
          移到同一起点，长度不变
        </button>
      </>
    );
  } else if (p.kind === "pattern") {
    const total = Math.min(60, Math.max(p.index, (p.a + p.b) * 3)),
      cols = 12;
    content = svg(
      <>
        {Array.from({ length: total }, (_, i) => (
          <g
            key={i}
            transform={`translate(${40 + (i % cols) * 56} ${55 + Math.floor(i / cols) * 70})`}
            opacity={i / total <= factor ? 1 : 0.15}
          >
            <rect
              x="-25"
              y="-25"
              width="50"
              height="62"
              fill={i === p.index - 1 ? "#f4db86" : "#eef3e8"}
              rx="8"
            />
            <text y="7" textAnchor="middle" fontSize="24">
              {i % (p.a + p.b) < p.a ? "△" : "○"}
            </text>
            <text y="30" textAnchor="middle" fontSize="13">
              {i + 1}
            </text>
          </g>
        ))}
      </>,
      Math.ceil(total / cols) * 70 + 35,
    );
  } else if (p.kind === "seat") {
    const seats = p.rows.reduce((a, b) => a + b, 0);
    let index = 0;
    content = svg(
      <>
        <text x="20" y="28" fontSize="19">
          屏幕 / 前方 · 红色已售，空心可选
        </text>
        {p.rows.map((count, r) => (
          <g key={r}>
            {Array.from({ length: count }, (_, c) => {
              const id = index++;
              return (
                <g
                  key={id}
                  data-seat-id={id}
                  transform={`translate(${65 + c * 54} ${70 + r * 44})`}
                  opacity={id / seats <= factor ? 1 : 0.1}
                >
                  <rect
                    width="35"
                    height="28"
                    rx="7"
                    fill={p.sold.includes(id) ? "#c96d61" : "#fff"}
                    stroke="#73a293"
                    strokeWidth="2"
                  />
                  {p.people !== undefined && id < p.people && (
                    <text x="17" y="24" fontSize="24" textAnchor="middle">
                      👤
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
        {p.people !== undefined && p.people > seats && (
          <text x="20" y={95 + p.rows.length * 44} fontSize="19">
            还有 {p.people - seats} 人等待座位。
          </text>
        )}
      </>,
      140 + p.rows.length * 44,
    );
  } else if (p.kind === "border") {
    const s = p.perSide - 1,
      coords: Array<[number, number]> = [];
    for (let i = 0; i < s; i++)
      coords.push([i, 0], [s, i], [s - i, s], [0, s - i]);
    content = svg(
      <>
        <rect
          x="180"
          y="50"
          width="250"
          height="250"
          fill="none"
          stroke="#9bb3a5"
          strokeWidth="3"
        />
        {coords.map(([x, y], i) => (
          <g
            key={i}
            data-border-token={i}
            transform={`translate(${180 + (x * 250) / s} ${50 + (y * 250) / s})`}
            opacity={i / coords.length <= factor ? 1 : 0.1}
          >
            <circle
              r="13"
              fill={x % s === 0 && y % s === 0 ? "#d3a445" : "#518b7b"}
            />
            {grouped && (
              <text x="16" y="5" fontSize="16">
                {i + 1}
              </text>
            )}
          </g>
        ))}
      </>,
      350,
    );
  } else {
    content = svg(
      <>
        {p.cards.map((c, i) => {
          const count = Math.min(36, Math.max(0, Math.floor(c.value))),
            x = 20 + i * (680 / p.cards.length);
          return (
            <g
              key={i}
              transform={`translate(${mix(20 + i * 20, x, factor)} ${mix(30 + i * 10, 65, factor)})`}
            >
              <rect
                width={650 / p.cards.length}
                height="205"
                rx="16"
                fill="#edf3e8"
                stroke={palette[i % 4]}
              />
              <text x="12" y="28" fontSize="16">
                {c.label}
              </text>
              <text x="12" y="65" fontSize="27">
                {c.value}
              </text>
              {Array.from({ length: count }, (_, j) => (
                <circle
                  key={j}
                  cx={16 + (j % 6) * 16}
                  cy={90 + Math.floor(j / 6) * 16}
                  r="5"
                  fill={palette[i % 4]}
                />
              ))}
              {c.value > 36 && (
                <text x="12" y="195" fontSize="13">
                  小点仅示意，按标注数值
                </text>
              )}
            </g>
          );
        })}
        {demonstrating && (
          <text x="30" y="320" fontSize="23">
            {p.operation}＝{p.result}
          </text>
        )}
      </>,
      350,
    );
  }
  return (
    <section
      className="wb-scene"
      data-workbook-kind={p.kind}
      data-animation-progress={factor}
      data-aligned={aligned}
    >
      <p className="wb-scroll-note">
        ↔ 画面较宽时，可左右滑动查看全部物体；关键条件也写在题目中。
      </p>
      {p.kind === "measure" && (
        <p className="wb-scale-readings">
          {p.rows
            .map(
              (r) =>
                `${r.label}：原起点${r.start}，原终点${r.start + r.length}${p.unit}`,
            )
            .join("；")}
        </p>
      )}
      {content}
      {buttons}
    </section>
  );
}
