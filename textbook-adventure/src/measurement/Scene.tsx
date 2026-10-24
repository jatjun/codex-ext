import { foldPoints } from "./geometry";
import { conversions, routes, routeNames, type Kind, type N } from "./model";
const C = {
  green: "#217c69",
  gold: "#df942d",
  blue: "#247baa",
  red: "#cc6650",
  ink: "#203e42",
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
function Label({
  x,
  y,
  children,
  fill = C.ink,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  fill?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={fill}
      fontSize="19"
      fontWeight="600"
    >
      {children}
    </text>
  );
}
function Person({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={C.gold}>
      <circle cy="-17" r="10" />
      <path
        d="M-13 12V-3Q0 -17 13 -3V12ZM-8 10V28M8 10V28"
        stroke={C.gold}
        strokeWidth="7"
      />
    </g>
  );
}
function Fruit({
  x,
  y,
  color = C.red,
}: {
  x: number;
  y: number;
  color?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0 -18Q-32 -33 -30 0Q-25 28 0 24Q25 28 30 0Q32 -33 0 -18"
        fill={color}
      />
      <path
        d="M0 -18Q0 -38 15 -35"
        fill="none"
        stroke={C.green}
        strokeWidth="6"
      />
    </g>
  );
}
export function Scene({
  kind: k,
  n,
  step,
  p,
  route = 0,
  grid = false,
  massUnit = "千克",
  transfer = false,
  zoom = false,
}: {
  kind: Kind;
  n: N;
  step: number;
  p: number;
  route?: number;
  grid?: boolean;
  massUnit?: string;
  transfer?: boolean;
  zoom?: boolean;
}) {
  const { a, b, c } = n;
  let content: React.ReactNode;
  let summary = "";
  if (k === "ruler") {
    const x = (mm: number) => 50 + mm * 5;
    const end = a + b;
    summary =
      step === 0
        ? "找左端刻度"
        : step === 1
          ? "找右端刻度"
          : "观察两端之间的间隔";
    content = (
      <>
        <rect x="35" y="170" width="530" height="85" rx="8" fill="#f8e9b8" />
        {Array.from({ length: 101 }, (_, i) => (
          <g key={i}>
            <path
              d={`M${x(i)} 170v${i % 10 === 0 ? 35 : i % 5 === 0 ? 25 : 14}`}
              stroke={C.ink}
            />
            {i % 10 === 0 && (
              <text x={x(i)} y="238" textAnchor="middle" fontSize="17">
                {i / 10}
              </text>
            )}
          </g>
        ))}
        <Label x={540} y={280}>
          厘米
        </Label>
        <g transform={`translate(0 ${step === 0 ? lerp(-55, 0, p) : 0})`}>
          <rect
            x={x(a)}
            y="130"
            width={b * 5}
            height="24"
            rx="5"
            fill={C.green}
          />
          <path
            d={`M${x(a)} 120v145M${x(end)} 120v145`}
            stroke={C.red}
            strokeDasharray="4 4"
            strokeWidth="2"
          />
        </g>
        <Label x={300} y={65}>
          每1小格＝1毫米 · 每10小格＝1厘米
        </Label>
        {step > 0 && (
          <path
            d={`M${x(a)} 105H${x(a + (step === 1 ? b * p : b))}`}
            stroke={C.gold}
            strokeWidth="10"
          />
        )}
        {step === 2 &&
          Array.from({ length: b }, (_, i) => (
            <circle
              key={i}
              cx={x(a + i + 0.5)}
              cy={105}
              r="2"
              fill={i / b <= p ? C.red : "#ffffff"}
            />
          ))}
        <Label x={300} y={330}>
          虚拟刻度尺，不是屏幕上的实际厘米
        </Label>
      </>
    );
  } else if (k === "units") {
    const [u, v, f] = conversions[b];
    const count = step === 0 ? 1 : a;
    const part = f === 1000 ? 100 : 1;
    summary = `${count}个${u}；每条代表1${u}，每小块代表${part}${v}`;
    content = (
      <>
        <Label x={300} y={40}>
          {u} ⇄ {v} · 总量不变
        </Label>
        {Array.from({ length: count }, (_, i) => (
          <g key={i} transform={`translate(65 ${65 + i * 31})`}>
            <rect width="460" height="23" rx="4" fill="#c4e1d7" />
            {Array.from({ length: 10 }, (_, j) => (
              <rect
                key={j}
                x={j * 46 + (step === 2 ? 1 - p : p) * j * 1.2}
                y="0"
                width={44 - (step === 2 ? 1 - p : p) * 8}
                height="23"
                fill={j / 10 <= p || step === 2 ? C.green : "#c4e1d7"}
              />
            ))}
            <text x="480" y="18" fontSize="16">
              {i + 1}份
            </text>
          </g>
        ))}
        <Label x={300} y={375}>
          {f === 1000 ? `10块，每块100${v}；不是每块1${v}` : `10块，每块1${v}`}
        </Label>
      </>
    );
  } else if (k === "overlap") {
    const scale = 480 / (a + b),
      overlap = step === 0 ? 0 : step === 1 ? c * p : c;
    const start = 60 + (a - overlap) * scale;
    summary = `两块板${a}厘米、${b}厘米；当前重叠${Math.round(overlap)}厘米`;
    content = (
      <>
        <Label x={300} y={50}>
          先统一成厘米，再找重复部分
        </Label>
        <rect
          x="60"
          y="130"
          width={a * scale}
          height="50"
          rx="5"
          fill="#c48e57"
        />
        <rect
          x={start}
          y="165"
          width={b * scale}
          height="50"
          rx="5"
          fill="#e9b579"
        />
        <Label x={60 + (a * scale) / 2} y={115}>
          {a}厘米
        </Label>
        <Label x={start + (b * scale) / 2} y={248}>
          {b}厘米
        </Label>
        {overlap > 0 && (
          <rect
            x={start}
            y="125"
            width={overlap * scale}
            height="95"
            fill="#c94d3c66"
          />
        )}
        <path
          d={`M60 285v20H${start + b * scale}v-20`}
          stroke={C.green}
          strokeWidth="4"
          fill="none"
        />
        <Label x={300} y={355}>
          {step === 0 ? "首尾相接，没有重叠" : "红色区域只计算一次"}
        </Label>
      </>
    );
  } else if (k === "fold") {
    // Each hinge rotates an entire half; recursive transforms preserve segment length.
    const levels = step === 0 ? 0 : step === 1 ? 1 : b;
    const length = 440;
    const rope = foldPoints(length, levels, p);
    // Progress folds the outer hinge first, then both overlapping halves together.
    summary =
      step === 0
        ? `整根${a}厘米`
        : p === 1
          ? `${2 ** levels}个等长部分，总长仍是${a}厘米`
          : "转动折点，绳子的每一段长度不变";
    content = (
      <>
        <Label x={300} y={40}>
          总长{a}厘米 · 对折不是剪掉
        </Label>
        <g transform="translate(80 100)">
          <polyline
            data-testid="folded-rope"
            points={rope.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke={C.gold}
            strokeWidth="9"
            strokeLinecap="round"
          />
          {rope.slice(1, -1).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={C.red} />
          ))}
        </g>
        <path d="M80 340H520" stroke="#c7d6cd" strokeWidth="8" />
        {Array.from({ length: 2 ** levels + 1 }, (_, i) => (
          <path
            key={i}
            d={`M${80 + (i * length) / 2 ** levels} 328v24`}
            stroke={C.ink}
            strokeWidth="2"
          />
        ))}
        {levels > 0 && p > 0.95 && (
          <g>
            <text x="445" y="65" textAnchor="middle" fontSize="16">
              层数示意（同一根绳）
            </text>
            {Array.from({ length: 2 ** levels }, (_, i) => (
              <path
                key={i}
                d={`M390 ${90 + i * 23}H500`}
                stroke={i % 2 ? C.green : C.gold}
                strokeWidth="8"
              />
            ))}
            <Label x={445} y={110 + 2 ** levels * 23}>
              {2 ** levels}层
            </Label>
          </g>
        )}
        <Label x={300} y={385}>
          展开对照：{2 ** levels}个相等部分
        </Label>
      </>
    );
  } else if (k === "track") {
    const rounds = step === 2 ? b : 1;
    const legs = step === 0 ? 1 : c + 1;
    const distance = a * rounds * legs;
    const travelled = Math.min(distance, Math.round(distance * p));
    summary = `累计${travelled}米（${c ? "去和回都累计" : "绕一圈累计一次"}）`;
    if (c) {
      const pos = rounds * legs * p;
      const leg = Math.min(Math.floor(pos), rounds * legs - 1),
        fraction = pos - leg;
      const x = 80 + 440 * (leg % 2 === 0 ? fraction : 1 - fraction);
      content = (
        <>
          <rect
            x="60"
            y="110"
            width="480"
            height="135"
            rx="15"
            fill="#b9e3ed"
          />
          {[140, 180, 220].map((y) => (
            <path
              key={y}
              d={`M70 ${y}H530`}
              stroke="#ffffff"
              strokeDasharray="10 8"
            />
          ))}
          <g transform={`translate(${x} 180)`}>
            <circle r="13" fill={C.gold} />
            <path
              d="M-25 8Q0 -12 25 8"
              stroke={C.green}
              strokeWidth="5"
              fill="none"
            />
          </g>
          <Label x={300} y={75}>
            池长{a}米
          </Label>
          <Label x={300} y={290}>
            去→　←回；两程才是一个来回
          </Label>
          <Label x={300} y={345}>
            已走{travelled}米
          </Label>
        </>
      );
    } else {
      const angle = p * rounds * Math.PI * 2 - Math.PI / 2;
      content = (
        <>
          <ellipse
            cx="300"
            cy="190"
            rx="215"
            ry="125"
            fill="none"
            stroke="#e0a08b"
            strokeWidth="32"
          />
          <ellipse cx="300" cy="190" rx="175" ry="90" fill="#b9dcb4" />
          <Person
            x={300 + 215 * Math.cos(angle)}
            y={190 + 125 * Math.sin(angle)}
          />
          <Label x={300} y={185}>
            每圈{a}米
          </Label>
          <Label x={300} y={220}>
            {travelled}米
          </Label>
          <Label x={300} y={370}>
            完成{Math.floor(rounds * p)}圈
          </Label>
        </>
      );
    }
  } else if (k === "journey") {
    const max = Math.max(a, b * c),
      travel = b * c * p,
      x = 60 + (480 * travel) / max;
    summary = `已用${(c * p).toFixed(1)}分钟，可行进${Math.round(travel)}米`;
    content = (
      <>
        <Label x={300} y={55}>
          每分钟约{b}米 · 可用{c}分钟
        </Label>
        <path d="M60 220H540" stroke="#c7d7cc" strokeWidth="24" />
        <path d={`M60 220H${x}`} stroke={C.green} strokeWidth="12" />
        <Person x={x} y={185} />
        <path
          d={`M${60 + (480 * a) / max} 215v-100l40 15-40 15`}
          stroke={C.red}
          strokeWidth="4"
          fill="#f1c3a1"
        />
        <Label x={300} y={300}>
          目标：{a}米
        </Label>
        <Label x={300} y={345}>
          里程：{Math.round(travel)}米
        </Label>
      </>
    );
  } else if (k === "route") {
    const nodes = [
      [60, 290],
      [60, 90],
      [280, 90],
      [280, 290],
      [510, 290],
      [510, 90],
    ];
    const edges = [
      [0, 1, a],
      [1, 2, 600],
      [2, 5, 900],
      [0, 3, b],
      [3, 2, 500],
      [3, 4, c],
      [4, 5, 300],
    ];
    const paths = [
        [0, 1, 2, 5],
        [0, 3, 2, 5],
        [0, 3, 4, 5],
        [0, 1, 2, 3, 4, 5],
      ],
      selected = step < 2 ? step : route,
      path = paths[selected];
    const length = routes(n)[selected];
    let left = p * length,
      x = 60,
      y = 290;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i],
        to = path[i + 1],
        len = edges.find(
          ([u, v]) => (u === from && v === to) || (v === from && u === to),
        )![2];
      const t = Math.min(1, left / len);
      x = lerp(nodes[from][0], nodes[to][0], t);
      y = lerp(nodes[from][1], nodes[to][1], t);
      left -= len;
      if (left <= 0) break;
    }
    summary = `${routeNames[selected]}：累计${Math.round(p * length)}米`;
    content = (
      <>
        {edges.map(([u, v, d], i) => (
          <g key={i}>
            <path
              d={`M${nodes[u]}L${nodes[v]}`}
              stroke="#d7c19a"
              strokeWidth="13"
            />
            <text
              x={(nodes[u][0] + nodes[v][0]) / 2 + 10}
              y={(nodes[u][1] + nodes[v][1]) / 2 - 12}
              textAnchor="middle"
              fontSize="17"
              fill={C.ink}
            >
              {d}米
            </text>
          </g>
        ))}
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <rect
              x={x - 18}
              y={y - 15}
              width="36"
              height="30"
              rx="5"
              fill={C.green}
            />
            <Label x={x} y={y + 45}>
              {["家", "超市", "医院", "花园", "宾馆", "少年宫"][i]}
            </Label>
          </g>
        ))}
        <circle
          cx={x}
          cy={y}
          r="12"
          fill={C.gold}
          stroke="white"
          strokeWidth="3"
        />
      </>
    );
  } else if (k === "scale") {
    const weight = step === 0 ? a : step === 1 ? b : a - b;
    summary = step < 2 ? "量程1000克，每小格50克" : "比较同单位的质量";
    const angle = ((-135 + ((270 * weight) / 1000) * p) * Math.PI) / 180;
    content =
      step < 2 ? (
        <>
          <Label x={300} y={45}>
            克 · 每格50克
          </Label>
          <circle
            cx="300"
            cy="230"
            r="120"
            fill="#fff5d5"
            stroke={C.green}
            strokeWidth="7"
          />
          {Array.from({ length: 21 }, (_, i) => {
            const ang = ((-135 + (270 * i) / 20) * Math.PI) / 180;
            return (
              <g key={i}>
                <path
                  d={`M${300 + 100 * Math.sin(ang)} ${230 - 100 * Math.cos(ang)}L${300 + 113 * Math.sin(ang)} ${230 - 113 * Math.cos(ang)}`}
                  stroke={C.ink}
                  strokeWidth="2"
                />
                {i % 5 === 0 && (
                  <text
                    x={300 + 82 * Math.sin(ang)}
                    y={236 - 82 * Math.cos(ang)}
                    textAnchor="middle"
                    fontSize="17"
                  >
                    {i * 50}
                  </text>
                )}
              </g>
            );
          })}
          <path
            d={`M300 230L${300 + 91 * Math.sin(angle)} ${230 - 91 * Math.cos(angle)}`}
            stroke={C.red}
            strokeWidth="6"
          />
          <circle cx="300" cy="230" r="8" fill={C.red} />
          <Fruit x={300} y={lerp(-20, 85, p)} color={step ? C.gold : C.red} />
          <path d="M235 110H365" stroke={C.ink} strokeWidth="7" />
          <Label x={300} y={385}>
            读针尖，不读针尾
          </Label>
        </>
      ) : (
        <>
          <Label x={300} y={50}>
            已称过：{transfer ? "米" : "苹果"}
            {a}克，{transfer ? "豆" : "橙子"}
            {b}克
          </Label>
          <path d="M300 145V315M230 320H370" stroke={C.ink} strokeWidth="10" />
          <g transform={`translate(300 160) rotate(${a === b ? 0 : -12 * p})`}>
            <path d="M-180 0H180" stroke={C.green} strokeWidth="10" />
            <path d="M-150 0v100M150 0v100" stroke={C.ink} strokeWidth="3" />
            <path d="M-210 100h120M90 100h120" stroke={C.ink} strokeWidth="8" />
            {transfer ? (
              <rect
                x="-175"
                y="40"
                width="50"
                height="60"
                rx="12"
                fill={C.red}
              />
            ) : (
              <Fruit x={-150} y={70} />
            )}
            {transfer ? (
              <rect
                x="125"
                y="40"
                width="50"
                height="60"
                rx="12"
                fill={C.gold}
              />
            ) : (
              <Fruit x={150} y={70} color={C.gold} />
            )}
          </g>
          <Label x={300} y={375}>
            较重的一边低一些
          </Label>
        </>
      );
  } else {
    const bags = a / b;
    const added =
      step === 1
        ? Math.min(bags, Math.floor(p * (bags + 1)))
        : step === 2
          ? bags
          : 0;
    const ratio = step === 0 ? p : step === 1 ? added / bags : 1;
    const hullY = 170 + ratio * 50;
    summary =
      step === 0
        ? "观察船下沉后记录水线"
        : step === 1
          ? `已放${added}袋，${added === bags ? "已回到原水线" : "还没到原水线"}`
          : `已称${Math.floor(p * bags)}袋，每袋${b}${massUnit}`;
    content = (
      <>
        <rect x="30" y="225" width="540" height="130" rx="10" fill="#b7dce9" />
        <path d="M30 225H570" stroke={C.blue} strokeWidth="3" />
        <g
          data-testid="boat-hull"
          data-mark={hullY + 5}
          data-waterline="225"
          transform={`translate(0 ${hullY})`}
        >
          <path
            d="M100 -10H500L455 65H150Z"
            fill="#b78a5f"
            stroke="#83664d"
            strokeWidth="3"
          />
          <path
            d="M130 5H470"
            stroke={C.red}
            strokeWidth="4"
            strokeDasharray="8 5"
          />
          {step === 0 ? (
            <g transform={`translate(${lerp(20, 260, p)} -50)`}>
              <ellipse rx="65" ry="43" fill="#aab8b4" />
              <circle cx="55" cy="-15" r="30" fill="#aab8b4" />
              <path
                d="M72 0q20 60 35 10M-35 20v40M25 20v40"
                fill="none"
                stroke="#aab8b4"
                strokeWidth="18"
              />
              <circle cx="65" cy="-22" r="4" />
            </g>
          ) : (
            Array.from({ length: added }, (_, i) => (
              <g
                key={i}
                transform={`translate(${155 + (i % 5) * 65} ${-30 - Math.floor(i / 5) * 42})`}
              >
                <rect
                  x="-23"
                  y="-20"
                  width="46"
                  height="37"
                  rx="12"
                  fill={
                    step === 2 && i < Math.floor(p * bags) ? C.green : "#7f9290"
                  }
                />
                <text textAnchor="middle" y="5" fontSize="16" fill="white">
                  {i + 1}
                </text>
              </g>
            ))
          )}
        </g>
        <Label x={300} y={40}>
          红线在船身上 · 蓝线是水面
        </Label>
        <Label x={300} y={385}>
          {step === 2
            ? `称过的袋子变绿：${Math.floor(p * bags) * b}${massUnit}`
            : "保持同一条船、同一池水"}
        </Label>
      </>
    );
  }
  return (
    <figure className="measure-scene" data-progress={p.toFixed(5)}>
      <div className="measure-pan">
        <svg
          style={{ width: zoom ? "200%" : "100%", maxWidth: "none" }}
          viewBox="0 0 600 410"
          role="img"
          aria-label={summary}
        >
          <rect x="0" y="0" width="600" height="410" rx="18" fill="#f5f7eb" />
          {grid && (
            <pattern
              id="measure-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <path d="M30 0H0V30" stroke="#dae2d5" fill="none" />
            </pattern>
          )}
          {grid && <rect width="600" height="410" fill="url(#measure-grid)" />}
          {content}
        </svg>
      </div>
      <figcaption aria-live="off">{summary}</figcaption>
    </figure>
  );
}
