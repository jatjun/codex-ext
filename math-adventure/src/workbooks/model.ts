import type { Lesson, Task } from "../pdf/model";
import type { Definition, Field, Panel, Values } from "./types";
export const books = [
  { name: "长度、线段与分类", time: "08:48:11", count: 25 },
  { name: "分组、钟表与生活", time: "08:53:16", count: 25 },
  { name: "余数与倍数", time: "07:33:13", count: 25 },
  { name: "方向、分类与彩带", time: "08:50:04", count: 25 },
  { name: "果园与余数专练", time: "08:55:14", count: 2 },
  { name: "时钟与带余除法", time: "07:36:56", count: 25 },
  { name: "乘除法与图形关系", time: "08:51:50", count: 25 },
  { name: "读图、钟表与排队", time: "07:30:51", count: 25 },
];
const F = (
  key: string,
  label: string,
  value: number,
  min = 1,
  max = 30,
  choices?: string[],
): Field => ({ key, label, value, min, max, choices });
export const catalog: Definition[] = [];
function add(
  book: number,
  n: number,
  title: string,
  fields: Field[],
  make: Definition["make"],
  valid?: Definition["valid"],
  note?: string,
) {
  const d: Definition = {
    book,
    n,
    id: `morning-${book}-${n}`,
    title,
    topic: title,
    fields,
    make,
    valid,
    note,
  };
  catalog.push(d);
  return d;
}
const Q = (
  prompt: string,
  answer: string | number,
  hint: string,
  explanation: string,
  extra: Partial<Task> = {},
): Task => ({
  id: "",
  prompt,
  answer: String(answer),
  hint,
  explanation,
  ...extra,
});
const num = (prompt: string, answer: number, explanation: string) =>
  Q(prompt, answer, "先看物体每份的数量，再检查是否全部计算。", explanation);
const choose = (
  prompt: string,
  answer: string,
  options: string[],
  hint: string,
) =>
  Q(prompt, answer, hint, `检查物体与条件，可以确定：${answer}。`, { options });
const row = (label: string, count: number, icon = "●", value?: number) => ({
  label,
  count,
  icon,
  value,
});
const objects = (
  rows: Extract<Panel, { kind: "objects" }>["rows"],
  compare = false,
): Panel => ({ kind: "objects", rows, compare });
const cards = (
  labels: string[],
  values: number[],
  operation: string,
  result: number,
): Panel => ({
  kind: "cards",
  cards: labels.map((label, i) => ({ label, value: values[i] })),
  operation,
  result,
});
const result = (
  story: string,
  panels: Panel[],
  tasks: Task[],
  summary: string,
) => ({ story, panels, tasks, summary });
const directionNames = ["北", "东", "南", "西"];
export const mod = (n: number, m: number) => ((n % m) + m) % m;
export function direction(dx: number, dy: number, north = 0) {
  if (dx && dy) throw Error("Only cardinal comparisons");
  return directionNames[
    mod((dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0) - north, 4)
  ];
}
const D = (minutes: number, elapsed = 0, draw = false): Panel => ({
  kind: "clock",
  minutes,
  elapsed,
  draw,
});
export function timeText(t: number) {
  t = mod(t, 720);
  return `${Math.floor(t / 60) || 12}:${String(Math.round(t % 60)).padStart(2, "0")}`;
}
function clockRead(
  b: number,
  n: number,
  times: number[],
  draw = false,
  note?: string,
) {
  return add(
    b,
    n,
    draw ? "亲手画钟针" : "看钟面读时间",
    times.flatMap((t, i) => [
      F("h" + i, `钟${i + 1}小时`, Math.floor(t / 60) || 12, 1, 12),
      F("m" + i, `钟${i + 1}分钟`, t % 60, 0, 59),
    ]),
    (v) => {
      const ts = times.map((_, i) => (v["h" + i] % 12) * 60 + v["m" + i]);
      return result(
        draw
          ? `请把钟针拨到：${ts.map(timeText).join("、")}。先调时针与分针，再确认。`
          : "短粗的是时针，长的是分针。先看时针走过哪个数，再数分钟。",
        ts.map((t) => D(t, 0, draw)),
        ts.map((t, i) =>
          draw
            ? Q(
                `把第${i + 1}个钟拨到${timeText(t)}，再点“确认这个时刻”。`,
                "",
                "分针每小格1分钟；时针也会随分钟慢慢移动。",
                `两针应共同表示${timeText(t)}。`,
                { pick: [`wb-single:clock-${t}`] },
              )
            : Q(
                `第${i + 1}个钟是几点？用“小时:分钟”填写。`,
                timeText(t),
                "分针指向的数字要乘5；时针在两个数之间时，还没到后面的整时。",
                `${timeText(t)}，时针角度为${t / 2}°，分针角度为${(t % 60) * 6}°。`,
                {
                  accepted: [
                    `${Math.floor(t / 60) || 12}:${t % 60}`,
                    `${Math.floor(t / 60) || 12}时${t % 60}分`,
                  ],
                },
              ),
        ),
        "时针走1大格，分针走1整圈；分钟变化时，时针也在慢慢移动。",
      );
    },
    undefined,
    note,
  );
}
function elapsed(b: number, n: number, start: number, end: number, rest = 0) {
  return add(
    b,
    n,
    "时间经过了多久",
    [
      F("start", "开始时刻（当天第几分钟）", start, 0, 1380),
      F("duration", "经过时间（分钟）", end - start, 5, 600),
      F("rest", "休息时间（分钟）", rest, 0, 240),
    ],
    (v) =>
      result(
        `从${Math.floor(v.start / 60)}:${String(v.start % 60).padStart(2, "0")}开始，结束时刻见钟面与时间轴。中间休息${v.rest}分钟。当天不跨午夜。`,
        [D(v.start, v.duration)],
        [
          num(
            "从开始到结束，一共经过多少分钟？",
            v.duration,
            `${v.duration}分钟，可先走到整时再数剩余部分。`,
          ),
          num(
            "扣除休息，实际用了多少分钟？",
            v.duration - v.rest,
            `${v.duration}−${v.rest}=${v.duration - v.rest}分钟。`,
          ),
        ],
        "经过时间与时刻不同；工作时间还要扣除休息。",
      ),
    (v) =>
      v.start + v.duration > 1440 || v.rest > v.duration
        ? ["结束需在当天以内，休息不能超过经过时间。"]
        : [],
  );
}
function division(
  b: number,
  n: number,
  total: number,
  size: number,
  icon = "●",
  mode: "each" | "groups" = "each",
  title = "分完还有多少",
  round = false,
) {
  return add(
    b,
    n,
    title,
    [
      F("total", "物体总数", total, 1, 80),
      F("size", mode === "each" ? "每份数量" : "平均分成几份", size, 2, 12),
    ],
    (v) => {
      const q = Math.floor(v.total / v.size),
        r = v.total % v.size;
      return result(
        mode === "each"
          ? `有${v.total}个${icon}，每${v.size}个一份。亲手分一分，看看完整的份和剩余部分。`
          : `有${v.total}个${icon}，平均分给${v.size}份。每一轮给每份1个，检查余下的还能不能再分一轮。`,
        [
          {
            kind: "divide",
            total: v.total,
            size: v.size,
            icon,
            mode,
            unit: "个",
          },
        ],
        [
          num(
            mode === "each" ? "最多能分成多少完整的份？" : "每份可以分到几个？",
            q,
            `${v.total}÷${v.size}的整数商是${q}。`,
          ),
          num(
            "最后还剩几个？",
            r,
            `${v.total}=${v.size}×${q}+${r}，余数必须小于${v.size}。`,
          ),
          ...(round
            ? [
                num(
                  "要让所有人都有座位，至少需要几条船？",
                  q + (r ? 1 : 0),
                  r
                    ? "剩下的人也要坐船，再多租1条。"
                    : "刚好坐满，不用额外租船。",
                ),
              ]
            : []),
        ],
        "被除数＝除数×商＋余数；余数小于除数。",
      );
    },
  );
}
function remainder(
  b: number,
  n: number,
  q: number,
  r: number,
  mode:
    | "minDivisor"
    | "maxRemainder"
    | "minDividend"
    | "maxDividend" = "minDivisor",
) {
  return add(
    b,
    n,
    "余数与除数的边界",
    [
      F("q", "商", q, 1, 9),
      F("r", mode === "minDivisor" ? "余数" : "已知除数", r, 2, 12),
    ],
    (v) => {
      const d = mode === "minDivisor" ? v.r + 1 : v.r,
        rem = mode === "minDivisor" ? v.r : mode === "minDividend" ? 1 : d - 1,
        total = d * v.q + rem;
      return result(
        mode === "minDivisor"
          ? `□÷○=${v.q}……${v.r}。除数○最小是多少？此时被除数是多少？`
          : `□÷${d}=${v.q}……△。这是有余数的除法，余数至少1。求${mode === "minDividend" ? "最小" : "最大"}的被除数及对应余数。`,
        [
          {
            kind: "divide",
            total,
            size: d,
            icon: "●",
            mode: "each",
            unit: "个",
          },
        ],
        mode === "minDivisor"
          ? [
              num(
                "除数最小是多少？",
                d,
                `余数${v.r}必须小于除数，所以除数至少${d}。`,
              ),
              num("此时被除数是多少？", total, `${d}×${v.q}+${rem}=${total}。`),
            ]
          : [
              num(
                "对应的余数是多少？",
                rem,
                `有余数时最小是1，最大是除数减1。这里是${rem}。`,
              ),
              num("此时被除数是多少？", total, `${d}×${v.q}+${rem}=${total}。`),
            ],
        "比较余数与除数，再用乘加关系还原被除数。",
      );
    },
    (v) => (v.q * (v.r + 1) + v.r > 100 ? ["物体总量请控制在100以内。"] : []),
  );
}
function product(
  b: number,
  n: number,
  a: number,
  k: number,
  icon = "●",
  title = "同样的几份",
  other?: number,
) {
  return add(
    b,
    n,
    title,
    [
      F("a", "每份数量", a, 1, 10),
      F("k", "份数", k, 1, 9),
      ...(other ? [F("j", "另一种份数", other, 1, 9)] : []),
    ],
    (v) =>
      result(
        `每份有${v.a}个${icon}，有${v.k}份${other ? `，另一组有${v.j}份` : ""}。把每一份保留完整再合并。`,
        [
          objects([
            row(`${v.k}份`, v.a * v.k, icon),
            ...(other ? [row(`${v.j}份`, v.a * v.j, icon)] : []),
          ]),
        ],
        [
          num(
            `${v.k}个${v.a}一共是多少？`,
            v.a * v.k,
            `${v.a}×${v.k}=${v.a * v.k}。`,
          ),
          ...(other
            ? [
                num(
                  `${v.j}个${v.a}一共是多少？`,
                  v.a * v.j,
                  `${v.a}×${v.j}=${v.a * v.j}。`,
                ),
              ]
            : []),
        ],
        "相同加数重复几次，就表示几份；每份数×份数＝总数。",
      ),
  );
}
function orchard(b: number, n: number) {
  return product(b, n, 8, 3, "🌳", "果树的几倍", 5);
}
function ratio(
  b: number,
  n: number,
  base: number,
  multipliers: number[] = [2],
  title = "找到一倍的量",
) {
  return add(
    b,
    n,
    title,
    [
      F("base", "一倍的数量", base, 1, 12),
      ...multipliers.map((k, i) => F("k" + i, `第${i + 1}组倍数`, k, 1, 8)),
    ],
    (v) =>
      result(
        `第一组有${v.base}个。其余各组分别是一倍量的${multipliers.map((_, i) => v["k" + i]).join("、")}倍。移动分组，检查每份是否和第一组一样多。`,
        [
          objects(
            [
              row("一倍量", v.base),
              ...multipliers.map((_, i) =>
                row(`第${i + 1}组`, v.base * v["k" + i]),
              ),
            ],
            true,
          ),
        ],
        multipliers.map((_, i) =>
          num(
            `第${i + 1}组是一倍量的多少倍？`,
            v["k" + i],
            `${v.base * v["k" + i]}÷${v.base}=${v["k" + i]}。`,
          ),
        ),
        "求倍数，用比较量÷一倍量；一倍的量要先找准。",
      ),
  );
}
function jump(
  b: number,
  n: number,
  start: number,
  step: number,
  times: number,
  title = "数轴上跳一跳",
) {
  return add(
    b,
    n,
    title,
    [
      F("start", "起点", start, 0, 10),
      F("jump", "每次跳几格", step, 1, 8),
      F("times", "跳几次", times, 1, 8),
    ],
    (v) =>
      result(
        `从${v.start}出发，每次跳${v.jump}格，共跳${v.times}次。注意起点不算跳过的距离。`,
        [{ kind: "line", start: v.start, jump: v.jump, times: v.times }],
        [
          num(
            "一共跳了多少格？",
            v.jump * v.times,
            `${v.jump}×${v.times}=${v.jump * v.times}格。`,
          ),
          num(
            "最后落在哪个数？",
            v.start + v.jump * v.times,
            `${v.start}+${v.jump * v.times}=${v.start + v.jump * v.times}。`,
          ),
        ],
        "跳的总距离与终点数字不同，起点不是0时尤其要分清。",
      ),
  );
}
function trees(
  b: number,
  n: number,
  length: number,
  gap: number,
  inverse = false,
) {
  return add(
    b,
    n,
    "路边种树与间隔",
    [
      F("gaps", "间隔段数", length / gap, 2, 12),
      F("gap", "每段距离（米）", gap, 1, 10),
      F("ends", "端点种树方案", 0, 0, 2, ["两端都种", "只种一端", "两端不种"]),
    ],
    (v) => {
      const count = v.gaps + 1 - v.ends;
      return result(
        `路长${v.gaps * v.gap}米，${["两端都种", "只种一端", "两端不种"][v.ends]}。${inverse ? `一共${count}棵树，求等距间隔。` : `每隔${v.gap}米种一棵。`}`,
        [
          {
            kind: "line",
            start: 0,
            jump: v.gap,
            times: v.gaps,
            tree: true,
            ends: v.ends,
          },
        ],
        [
          num(
            inverse ? "每隔多少米种一棵？" : "一共种几棵树？",
            inverse ? v.gap : count,
            inverse
              ? `${v.gaps * v.gap}÷${v.gaps}=${v.gap}米。`
              : `有${v.gaps}段间隔，按端点方案得到${count}棵树。`,
          ),
        ],
        "先数间隔，再按两端是否种树确定棵数。",
      );
    },
  );
}
function ribbon(b: number, n: number, span: number, inverse = false) {
  return add(
    b,
    n,
    "弯曲彩带与直线跨度",
    [
      F(
        "span",
        inverse ? "彩带拉直后的单位长度" : "墙面直线跨度（单位长）",
        span,
        2,
        10,
      ),
      F("extra", "这次预留的长度（单位长）", 1, 1, 3),
    ],
    (v) =>
      result(
        inverse
          ? `彩带拉直后长${v.span}个单位，本次挂法预留${v.extra}个单位用于下垂，能跨过多长的墙？`
          : `墙面直线跨度${v.span}个单位，本次挂法另预留${v.extra}个单位用于下垂，需要多长的彩带？`,
        [{ kind: "ribbon", span: v.span, extra: v.extra, inverse }],
        [
          num(
            inverse
              ? "墙面跨度是多少个单位长？"
              : "这次需要多少个单位长的彩带？",
            inverse ? v.span - v.extra : v.span + v.extra,
            inverse
              ? `${v.span}−${v.extra}=${v.span - v.extra}。`
              : `${v.span}+${v.extra}=${v.span + v.extra}。`,
          ),
        ],
        "同一根带子弯曲后，两端直线距离比拉直长度短。预留量取决于具体挂法，不能把“总加1”当规律。",
      ),
    (v) => (inverse && v.span <= v.extra ? ["彩带长度必须大于预留长度。"] : []),
    "原题是选项中的大致估计；动画明确给出本次预留量，避免由示意图推断唯一精确长度。",
  );
}
function measure(
  b: number,
  n: number,
  rows: { label: string; start: number; length: number }[],
  vertical = false,
) {
  return add(
    b,
    n,
    vertical ? "站台不算身高" : "从两端刻度量长度",
    rows.flatMap((r, i) => [
      F("s" + i, `${r.label}起点刻度`, r.start, 0, 30),
      F("l" + i, `${r.label}实际长度`, r.length, 1, 60),
    ]),
    (v) => {
      const rs = rows.map((r, i) => ({
        ...r,
        start: v["s" + i],
        length: v["l" + i],
      }));
      return result(
        vertical
          ? "物体站在不同高度的台上。把台子去掉、底部对齐，再比较实际高度。"
          : "读出起点与终点刻度。把物体移到零刻度时，物体的长度保持不变。",
        [{ kind: "measure", rows: rs, unit: "厘米", vertical }],
        rs.map((r) =>
          num(
            `${r.label}的${vertical ? "高度" : "长度"}是多少厘米？`,
            r.length,
            `${r.start + r.length}−${r.start}=${r.length}厘米。`,
          ),
        ),
        "实际长度＝末端刻度−起始刻度；不能只看末端数字。",
      );
    },
  );
}
function facing(
  b: number,
  n: number,
  start: number,
  turns: number[],
  relative = 0,
  title = "转身后认方向",
) {
  return add(
    b,
    n,
    title,
    [
      F("face", "开始面向", start, 0, 3, directionNames),
      ...turns.map((t, i) =>
        F("turn" + i, `第${i + 1}次转身`, t, 0, 3, [
          "不转",
          "向右转",
          "向后转",
          "向左转",
        ]),
      ),
      F("relative", "询问身体哪一侧", relative, 0, 3, [
        "前面",
        "右面",
        "后面",
        "左面",
      ]),
    ],
    (v) => {
      const ts = turns.map((_, i) => v["turn" + i]),
        final = mod(v.face + ts.reduce((a, c) => a + c, 0), 4),
        answer = directionNames[mod(final + v.relative, 4)];
      return result(
        `开始面向${directionNames[v.face]}，依次${ts.map((t) => ["不转", "向右转", "向后转", "向左转"][t]).join("、")}。求最后身体${["前面", "右面", "后面", "左面"][v.relative]}的方向。`,
        [
          {
            kind: "direction",
            facing: v.face,
            turns: ts,
            north: 0,
            places: [],
          },
        ],
        [
          choose(
            "最后询问的一侧朝哪个方向？",
            answer,
            directionNames,
            "东南西北不随着身体转；先看最后面向哪，再找身体的一侧。",
          ),
        ],
        "地图方向固定，身体左右会随朝向变化。",
      );
    },
  );
}
function map(
  b: number,
  n: number,
  places: { name: string; x: number; y: number }[],
  pairs: [number, number][],
  route?: number[],
) {
  return add(
    b,
    n,
    "地图上的相对方向",
    [F("north", "地图北箭头朝向", 0, 0, 3, ["上", "右", "下", "左"])],
    (v) =>
      result(
        "先看北箭头，再从“谁在谁的哪一面”中的后一个地点出发寻找。地图转向时，方位名称也要重新判断。",
        pairs.map(([a, c], i) => ({
          kind: "direction" as const,
          facing: 3,
          turns: [],
          north: v.north,
          places,
          route: i === 0 && route ? route : [c, a],
        })),
        pairs.map(([a, c]) =>
          choose(
            `${places[a].name}在${places[c].name}的哪一面？`,
            direction(
              places[a].x - places[c].x,
              places[a].y - places[c].y,
              v.north,
            ),
            directionNames,
            "先找到作为参照的地点，再沿直线寻找另一个地点。",
          ),
        ),
        "比较方向要确定参照物，并以图中北箭头为准。",
      ),
  );
}
export function classOf(
  it: { shape: number; color: number; size: number; extra: number },
  key: string,
) {
  return key === "extraShape"
    ? it.extra * 3 + it.shape
    : key === "shapeExtra"
      ? it.shape * 2 + it.extra
      : it[key as "shape" | "color" | "size" | "extra"];
}
function sort(
  b: number,
  n: number,
  items: Extract<Panel, { kind: "sort" }>["items"],
  criteria: (
    | "shape"
    | "color"
    | "size"
    | "extra"
    | "extraShape"
    | "shapeExtra"
  )[],
  labels: string[][],
  note?: string,
) {
  return add(
    b,
    n,
    "换个标准来分类",
    [F("copies", "整套卡片份数", 1, 1, 3), F("order", "卡片排列方案", 0, 0, 2)],
    (v) => {
      const all = Array.from({ length: v.copies }, () => items).flat(),
        rotate = mod(v.order * 3, all.length),
        arr = [...all.slice(rotate), ...all.slice(0, rotate)];
      return result(
        `共有${arr.length}张卡片。先点一张，再点分类区。换标准后，所有卡片要重新检查，总数不变。`,
        criteria.map((criterion, i) => ({
          kind: "sort",
          items: arr,
          criterion,
          labels: labels[i],
        })),
        criteria.map((criterion, i) =>
          Q(
            `按${{ shape: "形状", color: "颜色", size: "大小", extra: "图案或属性", extraShape: "种类后再按形状", shapeExtra: "形状后再按种类" }[criterion]}分类，把每张卡片放入对应区域。`,
            "",
            "每张卡片只能分到一处，分完再检查总数。",
            `按${labels[i].join("、")}分，共${arr.length}张，分类标准变了，总数不变。`,
            {
              pick: arr.map(
                (it, j) => `wb-sort:${j}:${classOf(it, criterion)}`,
              ),
            },
          ),
        ),
        "同一套卡片可以按不同标准分类；每次既不能漏掉，也不能重复。",
      );
    },
    undefined,
    note,
  );
}
function segments(
  b: number,
  n: number,
  sets: Extract<Panel, { kind: "segments" }>[],
  title = "直直的线段",
) {
  return add(
    b,
    n,
    title,
    [
      F("size", "图形缩放倍数", 1, 1, 3),
      F("rotate", "旋转四分之一圈数", 0, 0, 3),
    ],
    (v) => {
      const ps = sets.map((s) => ({
        ...s,
        points: s.points.map(([x, y]) => {
          for (let i = 0; i < v.rotate; i++) [x, y] = [-y, x];
          return [x * v.size, y * v.size] as [number, number];
        }),
      }));
      return result(
        "线段直直的，有两个端点。点一下给线段做标记；弯曲的边不算线段。",
        ps,
        ps.map((s) =>
          num(
            s.connect
              ? "每两个点相连，最多能连几条不同线段？"
              : "图中共有几条线段？",
            s.edges.length,
            `逐条标记，不重复计算，共${s.edges.length}条。`,
          ),
        ),
        "不以图形转动和大小判断；检查直线、端点与不重不漏。",
      );
    },
  );
}
function units(
  b: number,
  n: number,
  labels: string[],
  amounts: number[],
  answers: string[],
  opts = ["厘米", "米"],
) {
  return add(
    b,
    n,
    "选择合适的单位",
    amounts.map((a, i) =>
      F("a" + i, `${labels[i]}显示数值`, a, 1, Math.max(a + 2, 15)),
    ),
    (v) =>
      result(
        "观察生活情境。选单位时，不能只看数字，还要想物体或活动的实际大小。",
        [
          objects(
            labels.map((label, i) =>
              row(
                label,
                1,
                ["📺", "✋", "🦒", "✏️", "📱", "🐍"][i % 6],
                v["a" + i],
              ),
            ),
          ),
        ],
        labels.map((label, i) =>
          choose(
            `${label}约${v["a" + i]}（ ），填什么单位合适？`,
            answers[i],
            opts,
            "把这个数分别配上不同单位，想一想哪一种符合生活。",
          ),
        ),
        "单位决定每一份有多大；生活估计不是精确测量。",
      ),
  );
}
function convertClock(
  b: number,
  n: number,
  kind: "minute" | "hour" | "second",
  count: number,
) {
  return add(
    b,
    n,
    "三根钟针一起走",
    [
      F(
        "count",
        kind === "hour"
          ? "时针走几大格"
          : kind === "minute"
            ? "分针走几小格"
            : "秒针走几圈",
        count,
        1,
        kind === "hour" ? 24 : 60,
      ),
    ],
    (v) => {
      const duration = v.count * (kind === "hour" ? 60 : 1);
      return result(
        kind === "hour"
          ? `时针走${v.count}大格，看看分针和秒针怎样一起走。`
          : `${kind === "minute" ? "分针走" + v.count + "小格" : "秒针走" + v.count + "圈"}，同时观察另一根针。`,
        [{ kind: "clock", minutes: 0, elapsed: duration, seconds: true }],
        kind === "hour"
          ? [
              num(
                "分针走了几圈？",
                v.count,
                `${v.count}小时，分针走${v.count}圈。`,
              ),
              num(
                "一共经过多少分钟？",
                duration,
                `${v.count}×60=${duration}分钟。`,
              ),
            ]
          : [
              num("经过多少分钟？", v.count, `1分钟，秒针走1圈，分针走1小格。`),
              num(
                "秒针一共走了多少小格？",
                v.count * 60,
                `${v.count}×60=${v.count * 60}小格。`,
              ),
            ],
        "两根针在同一段时间里一起运动；1小时＝60分钟，1分钟＝60秒。",
      );
    },
  );
}
function clockArc(b: number, n: number, from: number, to: number) {
  return add(
    b,
    n,
    "分针跨过12",
    [
      F("from", "分针起点数字", from, 1, 12),
      F("steps", "顺时针走过几大格", mod(to - from, 12) || 12, 1, 12),
    ],
    (v) => {
      const minutes = v.steps * 5,
        end = mod(v.from + v.steps - 1, 12) + 1;
      return result(
        `分针从${v.from}顺时针走${v.steps}大格到${end}。跨过12仍然要继续数。`,
        [
          {
            kind: "clock",
            minutes: (v.from % 12) * 5,
            elapsed: minutes,
            seconds: true,
          },
        ],
        [
          num("分针走了多少分钟？", minutes, `${v.steps}×5=${minutes}分钟。`),
          num(
            "同一段时间秒针走了几圈？",
            minutes,
            `1分钟秒针走1圈，${minutes}分钟走${minutes}圈。`,
          ),
          num(
            "一共是多少秒？",
            minutes * 60,
            `${minutes}×60=${minutes * 60}秒。`,
          ),
        ],
        "数走过的间隔，不能只做终点数字减起点数字；分针顺时针走。",
      );
    },
  );
}
function arithmetic(
  b: number,
  n: number,
  title: string,
  fs: Field[],
  calc: (v: Values) => {
    story: string;
    labels: string[];
    values: number[];
    op: string;
    answer: number;
    prompt?: string;
    others?: Task[];
  },
  valid?: Definition["valid"],
) {
  return add(
    b,
    n,
    title,
    fs,
    (v) => {
      const x = calc(v);
      return result(
        x.story,
        [cards(x.labels, x.values, x.op, x.answer)],
        [
          num(
            x.prompt ?? "要求的数量是多少？",
            x.answer,
            `${x.op}＝${x.answer}。`,
          ),
          ...(x.others ?? []),
        ],
        "先说清每个条件的意义，再按关系计算并检查。",
      );
    },
    valid,
  );
}
function merge(b: number, n: number, title: string, defs: Definition[]) {
  for (const d of defs) {
    const i = catalog.indexOf(d);
    if (i >= 0) catalog.splice(i, 1);
  }
  return add(
    b,
    n,
    title,
    defs.flatMap((d, i) =>
      d.fields.map((f) => ({
        ...f,
        key: i + "_" + f.key,
        label: `第${i + 1}部分 · ${f.label}`,
      })),
    ),
    (v) => {
      const panels: Panel[] = [],
        tasks: Task[] = [],
        stories: string[] = [],
        summaries: string[] = [];
      defs.forEach((d, i) => {
        const vals = Object.fromEntries(
            d.fields.map((f) => [f.key, v[i + "_" + f.key]]),
          ),
          r = d.make(vals),
          offset = panels.length;
        panels.push(...r.panels);
        tasks.push(
          ...r.tasks.map((t, j) => ({
            ...t,
            focus: String(offset + Math.min(j, r.panels.length - 1)),
          })),
        );
        stories.push(r.story);
        summaries.push(r.summary);
      });
      return result(stories.join("\n"), panels, tasks, summaries.join(" "));
    },
    (v) =>
      defs.flatMap(
        (d, i) =>
          d.valid?.(
            Object.fromEntries(
              d.fields.map((f) => [f.key, v[i + "_" + f.key]]),
            ),
          ) ?? [],
      ),
  );
}
const square: Extract<Panel, { kind: "segments" }> = {
  kind: "segments",
  points: [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ],
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ],
};
// 第一份：08:48:11
ribbon(1, 1, 5);
ribbon(1, 2, 2, true);
arithmetic(
  1,
  3,
  "同一张桌子的两种拃",
  [F("adult", "妈妈量了几拃", 4, 2, 8), F("child", "孩子量了几拃", 5, 3, 12)],
  (v) => ({
    story: `同一张桌子，妈妈量${v.adult}拃，孩子量${v.child}拃。每个人都紧密、不重叠地量。`,
    labels: ["妈妈的一拃", "孩子的一拃"],
    values: [v.child, v.adult],
    op: `${v.adult}份×${v.child}＝${v.child}份×${v.adult}`,
    answer: 0,
    others: [
      choose(
        "为什么拃数不同？",
        "每一拃长度不同",
        ["每一拃长度不同", "桌子变长了"],
        "同一张桌子不变，比较每一拃覆盖的长度。",
      ),
    ],
    prompt: "这张桌子的长度有没有改变？没有改变填0。",
  }),
  (v) =>
    v.adult >= v.child ? ["本题要求妈妈的一拃更长，孩子拃数应更多。"] : [],
);
ribbon(1, 4, 3, true);
add(
  1,
  5,
  "相同因数的口诀",
  [F("a", "第一个因数", 5, 1, 9), F("b", "第二个因数", 5, 1, 9)],
  (v) =>
    result(
      `用${v.a}与${v.b}拼成乘法与除法算式。交换位置后，算式是否真的不同？`,
      [objects([row("每份与份数", v.a * v.b)])],
      [
        choose(
          "能写出两道不同乘法和两道不同除法吗？",
          v.a === v.b ? "不能" : "能",
          ["能", "不能"],
          "交换相同的两个数，式子没有改变。",
        ),
      ],
      `${v.a}×${v.b}与${v.b}×${v.a}，${v.a * v.b}÷${v.a}与${v.a * v.b}÷${v.b}；相同因数时会重复。`,
    ),
);
arithmetic(
  1,
  6,
  "连续减去同一个数",
  [
    F("q", "减去几次", 7, 1, 10),
    F("d", "每次减几", 5, 1, 9),
    F("r", "最后剩余", 1, 0, 8),
  ],
  (v) => ({
    story: `从${v.q * v.d + v.r}里连续减去${v.d}，减几次后还剩${v.r}？`,
    labels: ["原来", "每次拿走", "还剩"],
    values: [v.q * v.d + v.r, v.d, v.r],
    op: `（${v.q * v.d + v.r}−${v.r}）÷${v.d}`,
    answer: v.q,
  }),
);
segments(1, 7, [
  { ...square, edges: [...square.edges, [0, 2]] },
  {
    kind: "segments",
    points: [
      [0, 1],
      [1, 0],
      [3, 0],
      [3, 3],
      [0, 3],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
  {
    kind: "segments",
    points: [
      [0, 0],
      [3, 0],
      [3, 2],
      [0, 2],
    ],
    edges: [
      [1, 2],
      [3, 0],
    ],
    curves: true,
  },
]);
segments(1, 8, [
  {
    kind: "segments",
    points: [
      [1, 0],
      [3, 1],
      [2, 3],
      [0, 4],
      [-1, 2],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
]);
segments(
  1,
  9,
  [{ ...square, connect: true, edges: [...square.edges, [0, 2], [1, 3]] }],
  "每两个点连一条",
);
merge(1, 10, "刻度与相同长度", [
  measure(1, 10, [{ label: "第一段", start: 0, length: 1 }]),
  add(
    1,
    10,
    "左右各量一段",
    [F("middle", "中间刻度", 7, 3, 12), F("length", "长度", 3, 1, 3)],
    (v) =>
      result(
        `从刻度${v.middle}向左或向右量${v.length}厘米。`,
        [
          {
            kind: "measure",
            rows: [
              { label: "向左", start: v.middle - v.length, length: v.length },
              { label: "向右", start: v.middle, length: v.length },
            ],
            unit: "厘米",
          },
        ],
        [
          num(
            "向左应到哪个刻度？",
            v.middle - v.length,
            `${v.middle}−${v.length}。`,
          ),
          num(
            "向右应到哪个刻度？",
            v.middle + v.length,
            `${v.middle}+${v.length}。`,
          ),
        ],
        "相同长度可以向左，也可以向右量。",
      ),
  ),
]);
units(
  1,
  11,
  ["电视机长", "手掌长", "长颈鹿高", "笔长", "手机长", "蛇长"],
  [50, 15, 4, 7, 13, 2],
  ["厘米", "厘米", "米", "厘米", "厘米", "米"],
);
add(
  1,
  12,
  "先换单位再排序",
  [
    F("a", "第一条（厘米）", 40, 10, 90),
    F("b", "第二条（米）", 3, 2, 5),
    F("c", "第三条（厘米）", 135, 101, 190),
    F("d", "第四条（厘米）", 100, 90, 100),
  ],
  (v) => {
    const rs = [
        row("①厘米", 1, "━", v.a),
        row("②米", 1, "━", v.b),
        row("③厘米", 1, "━", v.c),
        row("④厘米", 1, "━", v.d),
      ],
      vals = [v.a, v.b * 100, v.c, v.d],
      order = vals
        .map((x, i) => ({ x, i }))
        .sort((a, b) => b.x - a.x)
        .map((x) => x.i + 1)
        .join("");
    return result(
      "按从长到短排列，全部先换成厘米。",
      [
        {
          kind: "measure",
          rows: vals.map((x, i) => ({
            label: String(i + 1),
            start: 0,
            length: x,
          })),
          unit: "厘米",
        },
      ],
      [
        Q(
          "从长到短输入编号，例如2341。",
          order,
          "1米＝100厘米，把单位统一后再比较。",
          `顺序是${order}。`,
        ),
      ],
      "数字大不一定长，先看单位。",
    );
  },
  (v) =>
    new Set([v.a, v.b * 100, v.c, v.d]).size < 4
      ? ["本题四个长度需要不同，以便唯一排序。"]
      : [],
);
add(
  1,
  13,
  "折线拉直再比较",
  [
    F("a", "①号线长（格）", 7, 2, 12),
    F("b", "②号线长（格）", 6, 2, 12),
    F("c", "③号线长（格）", 5, 2, 12),
  ],
  (v) =>
    result(
      "弯折的线不能只比两端距离。把每一小段首尾相接拉直，再比较。",
      [
        {
          kind: "measure",
          rows: ["a", "b", "c"].map((k, i) => ({
            label: `${i + 1}号线`,
            start: 0,
            length: v[k],
          })),
          unit: "格",
        },
      ],
      [
        num(
          "最长的是几号线？",
          [v.a, v.b, v.c].indexOf(Math.max(v.a, v.b, v.c)) + 1,
          "逐格量出实际长度再比较。",
        ),
        num(
          "最短的是几号线？",
          [v.a, v.b, v.c].indexOf(Math.min(v.a, v.b, v.c)) + 1,
          "逐格量出实际长度再比较。",
        ),
      ],
      "路径长度要把走过的每段相加。",
    ),
  (v) => (new Set([v.a, v.b, v.c]).size < 3 ? ["三条线长度请设为不同。"] : []),
  "用等长小段拼接动画重画路径，不按扫描图片像素量长。",
);
merge(1, 14, "相同步长的数列", [
  jump(1, 14, 0, 2, 7),
  jump(1, 14, 0, 3, 7),
  jump(1, 14, 10, 5, 6),
]);
product(1, 15, 1, 7, "●", "1乘一个数");
trees(1, 16, 15, 3);
trees(1, 17, 40, 8, true);
arithmetic(
  1,
  18,
  "少的是一整份",
  [
    F("a", "每份数量", 8, 2, 9),
    F("b", "原来份数", 5, 1, 7),
    F("more", "增加份数", 1, 1, 3),
  ],
  (v) => ({
    story: `${v.a}×${v.b}比${v.a}×${v.b + v.more}少多少？`,
    labels: ["原来", "增加"],
    values: [v.a * v.b, v.a * v.more],
    op: `${v.a}×${v.more}`,
    answer: v.a * v.more,
  }),
);
arithmetic(
  1,
  19,
  "方队里有多少男生",
  [
    F("rows", "排数", 5, 2, 8),
    F("cols", "每排人数", 8, 2, 10),
    F("girls", "女生人数", 18, 1, 60),
  ],
  (v) => ({
    story: `${v.rows}排，每排${v.cols}人，其中女生${v.girls}人。男生多少人？`,
    labels: ["总人数", "女生"],
    values: [v.rows * v.cols, v.girls],
    op: `${v.rows}×${v.cols}−${v.girls}`,
    answer: v.rows * v.cols - v.girls,
  }),
  (v) => (v.girls >= v.rows * v.cols ? ["女生应少于总人数。"] : []),
);
arithmetic(
  1,
  20,
  "自己补充分组条件",
  [
    F("boys", "男生人数", 19, 1, 30),
    F("girls", "女生人数", 17, 1, 30),
    F("size", "你补充：每组人数", 6, 2, 12),
  ],
  (v) => ({
    story: `男生${v.boys}人，女生${v.girls}人。补充条件为“每${v.size}人一组”，求组数。`,
    labels: ["男生", "女生", "每组人数"],
    values: [v.boys, v.girls, v.size],
    op: `（${v.boys}+${v.girls}）÷${v.size}`,
    answer: (v.boys + v.girls) / v.size,
  }),
  (v) =>
    (v.boys + v.girls) % v.size ? ["请补充能把全班正好分完的每组人数。"] : [],
);
product(1, 21, 6, 5, "●", "5个6相加");
product(1, 22, 3, 4, "★", "几组星星");
const hearts = Array.from({ length: 10 }, (_, i) => ({
  icon: [0, 2, 4, 5, 8].includes(i) ? "♥" : "★",
  shape: [0, 2, 4, 5, 8].includes(i) ? 0 : 1,
  color: [0, 1, 4, 6, 8].includes(i) ? 0 : 1,
  size: 0,
  extra: 0,
}));
sort(
  1,
  23,
  hearts,
  ["color", "shape"],
  [
    ["黑色", "白色"],
    ["心形", "星形"],
  ],
);
const fruits = [
  ["🍐", 0],
  ["🍐", 1],
  ["🍇", 2],
  ["🍇", 0],
  ["🍐", 0],
  ["🍐", 2],
  ["🍇", 1],
  ["🍐", 1],
].map(([icon, shape]) => ({
  icon: String(icon),
  shape: Number(shape),
  color: 0,
  size: 0,
  extra: icon === "🍐" ? 0 : 1,
}));
sort(
  1,
  24,
  fruits,
  ["extra", "shape"],
  [
    ["梨", "葡萄"],
    ["三角框", "方框", "圆框"],
  ],
);
sort(
  1,
  25,
  ["🐻", "🐷", "🐰", "🐷", "🐻", "🐷", "🐰", "🐰"].map((icon, i) => ({
    icon,
    shape: 0,
    color: icon === "🐻" ? 0 : icon === "🐷" ? 1 : 2,
    size: [2, 3].includes(i) ? 0 : 1,
    extra: icon === "🐻" ? 0 : icon === "🐷" ? 1 : 2,
  })),
  ["extra", "color", "size"],
  [
    ["小熊", "小猪", "小兔"],
    ["黄色", "粉色", "蓝色"],
    ["小", "大"],
  ],
  "可以按图案、颜色、大小三种标准分类。图案与颜色一一对应，分类结果相同也不妨碍它们是两个不同标准。",
);
// 第二份：08:53:16
division(2, 1, 14, 4, "🎈");
division(2, 2, 10, 4, "🍑");
clockRead(2, 3, [390]);
merge(2, 4, "整点两针成线或重合", [
  clockRead(2, 4, [360]),
  clockRead(2, 4, [720]),
]);
clockRead(
  2,
  5,
  [110, 220, 125, 335],
  false,
  "原PDF答案与解析互相矛盾；按图中长分针、短时针重新核对为1:50、3:40、2:05、5:35。",
);
clockRead(2, 6, [185, 270, 520], true);
add(
  2,
  7,
  "钟针的位置合理吗",
  [
    F("hour", "整点小时", 6, 1, 11),
    F("bad", "时针是否故意放错", 0, 0, 1, ["正确", "错开半小时"]),
  ],
  (v) =>
    result(
      "分针指向12时，时针应该指在整点数字上。观察两针是否配合。",
      [{ kind: "clock", minutes: v.hour * 60, offset: v.bad ? 15 : 0 }],
      [
        choose(
          "这个整点钟面正确吗？",
          v.bad ? "不正确" : "正确",
          ["正确", "不正确"],
          "整点时，时针不会卡在两个小时数字的中间。",
        ),
      ],
      "指针必须表示同一个时刻，不可各自随意摆放。",
    ),
);
arithmetic(
  2,
  8,
  "分钟换成秒",
  [F("minutes", "允许时间（分钟）", 2, 1, 10)],
  (v) => ({
    story: `规定${v.minutes}分钟内可以撤回，一共是多少秒？`,
    labels: ["每分钟秒数", "分钟数"],
    values: [60, v.minutes],
    op: `60×${v.minutes}`,
    answer: v.minutes * 60,
  }),
);
clockArc(2, 9, 6, 7);
elapsed(2, 10, 480, 660);
merge(2, 11, "秒针与分针的配合", [
  convertClock(2, 11, "minute", 1),
  clockArc(2, 11, 1, 5),
  add(
    2,
    11,
    "数秒针的圈",
    [F("start", "分针起点数字", 4, 1, 12), F("circles", "秒针圈数", 10, 5, 30)],
    (v) =>
      result(
        `秒针走${v.circles}圈，分针从${v.start}开始。`,
        [
          {
            kind: "clock",
            minutes: (v.start % 12) * 5,
            elapsed: v.circles,
            seconds: true,
          },
        ],
        [
          num(
            "分针最终走到数字几？",
            mod(v.start + v.circles / 5 - 1, 12) + 1,
            "每5分钟，分针前进一个数字间隔。",
          ),
        ],
        "先把秒针圈数换成分钟。",
      ),
    (v) =>
      v.circles % 5 ? ["本题秒针圈数需为5的倍数，使分针停在数字处。"] : [],
  ),
]);
convertClock(2, 12, "hour", 3);
add(
  2,
  13,
  "认识三根钟针",
  [F("hour", "演示小时", 7, 1, 12), F("minute", "演示分钟", 5, 0, 59)],
  (v) =>
    result(
      "观察三根针的粗细、长短和移动速度。这里采用短粗时针、长分针、细红秒针。",
      [
        {
          kind: "clock",
          minutes: v.hour * 60 + v.minute,
          elapsed: 1,
          seconds: true,
        },
      ],
      [
        choose(
          "最短最粗的是什么针？",
          "时针",
          ["时针", "分针", "秒针"],
          "比较三根针的外形。",
        ),
        choose(
          "细红色、最快的是什么针？",
          "秒针",
          ["时针", "分针", "秒针"],
          "看同一段时间里谁转得最快。",
        ),
      ],
      "现实钟表外形可不同，还应结合走动速度和钟面刻度辨认。",
    ),
);
arithmetic(
  2,
  14,
  "存的钱与花的钱",
  [
    F("each", "每月存钱（元）", 8, 1, 12),
    F("months", "存了几个月", 9, 1, 10),
    F("left", "买后剩余（元）", 7, 0, 30),
  ],
  (v) => ({
    story: `每月存${v.each}元，存${v.months}个月，买滑板车后剩${v.left}元。求价格。`,
    labels: ["每月", "月数", "剩余"],
    values: [v.each, v.months, v.left],
    op: `${v.each}×${v.months}−${v.left}`,
    answer: v.each * v.months - v.left,
  }),
  (v) => (v.left >= v.each * v.months ? ["剩余钱数必须小于存款总数。"] : []),
);
add(
  2,
  15,
  "这些座位够吗",
  [
    F("teachers", "老师人数", 2, 1, 5),
    F("students", "同学人数", 35, 10, 60),
    F("wide", "前三排每排座位", 9, 5, 10),
    F("narrow", "后两排每排座位", 6, 3, 9),
  ],
  (v) => {
    const seats = v.wide * 3 + v.narrow * 2;
    return result(
      `有${v.teachers}名老师、${v.students}名同学。前三排每排${v.wide}座，后两排每排${v.narrow}座。`,
      [
        {
          kind: "seat",
          rows: [v.wide, v.wide, v.wide, v.narrow, v.narrow],
          sold: [],
          people: v.teachers + v.students,
        },
      ],
      [
        num(
          "一共有多少个座位？",
          seats,
          `${v.wide}×3+${v.narrow}×2=${seats}。`,
        ),
        choose(
          "所有人都有座位吗？",
          seats >= v.teachers + v.students ? "够坐" : "不够",
          ["够坐", "不够"],
          "老师也要占座，不能只数同学。",
        ),
      ],
      "总人数包含老师；座位逐排数，不补出不存在的空位。",
    );
  },
);
product(2, 16, 2, 9, "👤", "每个通道减少的人数");
arithmetic(
  2,
  17,
  "看错运算符号",
  [F("divisor", "原除数", 3, 2, 6), F("quotient", "正确的商", 2, 1, 8)],
  (v) => ({
    story: `把÷${v.divisor}看成×${v.divisor}，错算得${v.divisor * v.divisor * v.quotient}。先找回原来的数，再做正确除法。`,
    labels: ["错误结果", "原除数"],
    values: [v.divisor * v.divisor * v.quotient, v.divisor],
    op: `${v.divisor * v.divisor * v.quotient}÷${v.divisor}÷${v.divisor}`,
    answer: v.quotient,
  }),
);
measure(2, 18, [
  { label: "火腿肠", start: 0, length: 14 },
  { label: "火柴", start: 0, length: 4 },
  { label: "小刀", start: 11, length: 5 },
]);
measure(
  2,
  19,
  [
    { label: "①号小狗", start: 20, length: 30 },
    { label: "②号小狗", start: 30, length: 30 },
    { label: "③号小狗", start: 10, length: 40 },
  ],
  true,
);
add(
  2,
  20,
  "米与厘米比较",
  [
    F("a", "第一组厘米", 80, 20, 150),
    F("b", "第二组厘米", 96, 20, 150),
    F("c", "第三组厘米", 200, 100, 300),
  ],
  (v) =>
    result(
      "每1米都是100厘米。先统一单位，再选择比较符号。",
      [
        {
          kind: "measure",
          rows: [v.a, v.b, v.c, 100, 200].map((length, i) => ({
            label: `长度${i + 1}`,
            length,
            start: 0,
          })),
          unit: "厘米",
        },
      ],
      [
        choose(
          `${v.a}厘米 ○ 1米`,
          v.a < 100 ? "＜" : v.a > 100 ? "＞" : "＝",
          ["＜", "＞", "＝"],
          "1米＝100厘米。",
        ),
        choose(
          `1米 ○ ${v.b}厘米`,
          100 < v.b ? "＜" : 100 > v.b ? "＞" : "＝",
          ["＜", "＞", "＝"],
          "1米＝100厘米。",
        ),
        choose(
          `${v.c}厘米 ○ 2米`,
          v.c < 200 ? "＜" : v.c > 200 ? "＞" : "＝",
          ["＜", "＞", "＝"],
          "2米＝200厘米。",
        ),
      ],
      "比较时必须带上单位。",
    ),
);
measure(
  2,
  21,
  [
    { label: "①号小狗", start: 20, length: 30 },
    { label: "②号小狗", start: 30, length: 30 },
    { label: "③号小狗", start: 10, length: 40 },
  ],
  true,
);
division(2, 22, 8, 4, "🍊", "groups");
facing(2, 23, 1, [3, 2]);
merge(2, 24, "等式两边一样多", [
  arithmetic(
    2,
    24,
    "缺少的被除数",
    [F("q", "两边共同的商", 2, 1, 8), F("d", "右边除数", 2, 2, 9)],
    (v) => ({
      story: `左边算式得${v.q}，右边□÷${v.d}也要得${v.q}。`,
      labels: ["商", "除数"],
      values: [v.q, v.d],
      op: `${v.q}×${v.d}`,
      answer: v.q * v.d,
    }),
  ),
  arithmetic(
    2,
    24,
    "缺少的除数",
    [F("q", "两边共同的商", 4, 1, 8), F("d", "左边除数", 4, 2, 9)],
    (v) => ({
      story: `□是16÷□＝20÷5这类等式中的除数。这次被除数为${v.q * v.d}，两边商是${v.q}。`,
      labels: ["被除数", "商"],
      values: [v.q * v.d, v.q],
      op: `${v.q * v.d}÷${v.q}`,
      answer: v.d,
    }),
  ),
]);
add(
  2,
  25,
  "日出与夕阳的方向",
  [
    F("event", "观察的自然现象", 1, 0, 1, ["日出", "日落"]),
    F("north", "北箭头朝向", 0, 0, 3, ["上", "右", "下", "左"]),
  ],
  (v) =>
    result(
      `面向${v.event ? "傍晚日落" : "早晨日出"}的方向，想一想朝向哪一面。`,
      [
        {
          kind: "direction",
          facing: v.event ? 3 : 1,
          turns: [],
          north: v.north,
          places: [],
        },
      ],
      [
        choose(
          "面向的是什么方向？",
          v.event ? "西" : "东",
          directionNames,
          "太阳东升西落，这是本题固定的自然常识。",
        ),
      ],
      "改变日出/日落情境，不改变东升西落这个条件。",
    ),
);
// 第三份：07:33:13
add(3, 1, "一个数的前后邻居", [F("number", "中间的整数", 10, 2, 50)], (v) =>
  result(
    `数轴上找到${v.number}，向前一步与向后一步各是谁？`,
    [{ kind: "line", start: v.number - 2, jump: 1, times: 4 }],
    [
      num("前一个整数是多少？", v.number - 1, `${v.number}−1。`),
      num("后一个整数是多少？", v.number + 1, `${v.number}+1。`),
    ],
    "整数按顺序排列，相邻两个数相差1。",
  ),
);
arithmetic(
  3,
  2,
  "一次搬完桌椅",
  [
    F("tables", "桌子张数", 8, 1, 12),
    F("perTable", "每桌需要的人数", 2, 1, 4),
    F("chairs", "椅子把数", 16, 2, 30),
    F("perPerson", "每人搬几把椅子", 2, 1, 4),
  ],
  (v) => ({
    story: `${v.tables}张桌子每张需要${v.perTable}人，${v.chairs}把椅子每人搬${v.perPerson}把。一次搬完需多少人？`,
    labels: ["搬桌子的人", "搬椅子的人"],
    values: [v.tables * v.perTable, v.chairs / v.perPerson],
    op: `${v.tables}×${v.perTable}+${v.chairs}÷${v.perPerson}`,
    answer: v.tables * v.perTable + v.chairs / v.perPerson,
  }),
  (v) => (v.chairs % v.perPerson ? ["椅子数量需能按每人搬运量正好分完。"] : []),
);
arithmetic(
  3,
  3,
  "同样的钱换一种商品",
  [
    F("price", "每个冰淇淋（元）", 4, 1, 9),
    F("count", "冰淇淋个数", 4, 1, 9),
    F("cakes", "蛋糕块数", 2, 1, 8),
  ],
  (v) => ({
    story: `同样的钱可以买${v.count}个每个${v.price}元的冰淇淋，或${v.cakes}块蛋糕。每块蛋糕多少元？`,
    labels: ["单价", "个数", "蛋糕块数"],
    values: [v.price, v.count, v.cakes],
    op: `${v.price}×${v.count}÷${v.cakes}`,
    answer: (v.price * v.count) / v.cakes,
  }),
  (v) => ((v.price * v.count) % v.cakes ? ["蛋糕单价需为整数元。"] : []),
);
add(
  3,
  4,
  "成语里的时间长短",
  [
    F("meaning", "要找的时间意思", 0, 0, 2, [
      "短暂开放",
      "非常长久",
      "遥遥无期",
    ]),
  ],
  (v) =>
    result(
      "昙花短暂开放，千秋万代表示很久，猴年马月表示等待遥遥无期。",
      [objects([row("花开又花谢", 1, "🌼")])],
      [
        choose(
          [
            "哪个成语形容时间很短？",
            "哪个成语表示非常长久？",
            "哪个成语表示遥遥无期？",
          ][v.meaning],
          ["昙花一现", "千秋万代", "猴年马月"][v.meaning],
          ["猴年马月", "昙花一现", "千秋万代"],
          "结合每个词的意思，而不是只认选项位置。",
        ),
      ],
      "描述短暂、长久和遥遥无期，意思不同。",
    ),
);
add(
  3,
  5,
  "计时工具与指南针",
  [F("ask", "工具任务", 0, 0, 2, ["辨认方向", "看影子计时", "靠水滴计时"])],
  (v) =>
    result(
      "日晷看影子，滴漏看水的变化，指南针帮助辨认方向。",
      [
        objects([
          row("日晷", 1, "🌞"),
          row("指南针", 1, "🧭"),
          row("滴漏", 1, "💧"),
        ]),
      ],
      [
        choose(
          [
            "哪一种主要辨方向，而不是计时？",
            "哪种工具用影子变化计时？",
            "哪种工具用水的变化计时？",
          ][v.ask],
          ["指南针", "日晷", "滴漏"][v.ask],
          ["日晷", "指南针", "滴漏"],
          "比较三种工具实际观察的物体。",
        ),
      ],
      "方向工具和计时工具用途不同。",
    ),
);
merge(3, 6, "连续三个时刻", [
  elapsed(3, 6, 425, 465),
  elapsed(3, 6, 465, 500),
  elapsed(3, 6, 175, 195),
  elapsed(3, 6, 195, 330),
]);
units(
  3,
  7,
  ["旋转木马一次", "火箭倒计时", "每天工作", "洗手至少"],
  [3, 10, 8, 20],
  ["分钟", "秒", "小时", "秒"],
  ["秒", "分钟", "小时"],
);
const copy3 = (n: number, target: number) => {
  const src = catalog.find((d) => d.book === 3 && d.n === target)!;
  catalog.push({ ...src, n, id: `morning-3-${n}` });
};
copy3(8, 3);
arithmetic(
  3,
  9,
  "最少有几罐蜂蜜",
  [F("per", "每个宝宝分几罐", 4, 1, 9), F("left", "剩余罐数", 1, 1, 4)],
  (v) => ({
    story: `平均分给几个熊宝宝，每人${v.per}罐，还剩${v.left}罐。余下的不足每人再分1罐，至少几个宝宝？蜂蜜最少几罐？`,
    labels: ["最少宝宝数", "每人", "剩余"],
    values: [v.left + 1, v.per, v.left],
    op: `（${v.left}+1）×${v.per}+${v.left}`,
    answer: (v.left + 1) * v.per + v.left,
  }),
);
merge(3, 10, "被除数最小与最大", [
  remainder(3, 10, 7, 8, "minDividend"),
  remainder(3, 10, 3, 5, "maxDividend"),
]);
remainder(3, 11, 5, 7);
add(
  3,
  12,
  "除法的乘加检查",
  [F("q", "商", 3, 1, 7), F("d", "除数", 5, 2, 9), F("r", "余数", 2, 1, 6)],
  (v) =>
    result(
      `用分组结果检查：“商×除数＝被除数＋余数”是否正确？`,
      [
        {
          kind: "divide",
          total: v.q * v.d + v.r,
          size: v.d,
          icon: "●",
          mode: "each",
          unit: "个",
        },
      ],
      [
        choose(
          "题中等式正确吗？",
          "不正确",
          ["正确", "不正确"],
          "每一完整组加上剩余，才是原来的全部。",
        ),
      ],
      `正确是${v.q}×${v.d}+${v.r}=${v.q * v.d + v.r}，应加在商乘除数这一边。`,
    ),
  (v) => (v.r >= v.d ? ["余数必须小于除数。"] : []),
);
copy3(13, 6);
copy3(14, 4);
copy3(15, 5);
copy3(16, 7);
merge(3, 17, "租船：坐满与全部坐下", [
  division(3, 17, 38, 8, "👤", "each", "大船至少几条", true),
  division(3, 17, 38, 6, "👤", "each", "小船能坐满几条"),
]);
merge(3, 18, "蔬菜数量的倍数", [
  ratio(3, 18, 3, [2], "青椒是洋葱的几倍"),
  ratio(3, 18, 6, [2], "南瓜是青椒的几倍"),
]);
merge(3, 19, "叶片与图形比倍数", [
  ratio(3, 19, 6, [2], "叶片数量"),
  ratio(3, 19, 3, [2], "三角形与正方形"),
]);
ratio(3, 20, 8, [3], "选择条件提问题");
arithmetic(
  3,
  21,
  "送出以后才是几倍",
  [
    F("white", "白兔原来数量", 6, 1, 12),
    F("give", "灰兔送出数量", 2, 1, 6),
    F("multiple", "送出后灰兔是白兔的几倍", 2, 2, 5),
  ],
  (v) => ({
    story: `白兔原有${v.white}个胡萝卜。灰兔给白兔${v.give}个以后，灰兔剩下的是白兔现在的${v.multiple}倍。灰兔原来有几个？`,
    labels: ["白兔原来", "收到", "灰兔倍数", "需加回"],
    values: [v.white, v.give, v.multiple, v.give],
    op: `（${v.white}+${v.give}）×${v.multiple}+${v.give}`,
    answer: (v.white + v.give) * v.multiple + v.give,
  }),
);
arithmetic(
  3,
  22,
  "已知几倍求一倍",
  [F("base", "面包车人数", 7, 2, 10), F("k", "大客车是几倍", 7, 2, 8)],
  (v) => ({
    story: `大客车可坐${v.base * v.k}人，是面包车的${v.k}倍。面包车可坐多少人？`,
    labels: ["大客车人数", "倍数"],
    values: [v.base * v.k, v.k],
    op: `${v.base * v.k}÷${v.k}`,
    answer: v.base,
  }),
);
arithmetic(
  3,
  23,
  "彩旗的一倍量",
  [F("base", "黄旗面数", 7, 2, 10), F("k", "红旗是几倍", 6, 2, 8)],
  (v) => ({
    story: `红旗${v.base * v.k}面，是黄旗的${v.k}倍。需要黄旗几面？`,
    labels: ["红旗", "倍数"],
    values: [v.base * v.k, v.k],
    op: `${v.base * v.k}÷${v.k}`,
    answer: v.base,
  }),
);
orchard(3, 24);
remainder(3, 25, 3, 6);
function clone(
  b: number,
  n: number,
  srcBook: number,
  srcN: number,
  title?: string,
) {
  const d = catalog.find((d) => d.book === srcBook && d.n === srcN);
  if (!d) throw Error(`Missing ${srcBook}-${srcN}`);
  const c = {
    ...d,
    book: b,
    n,
    id: `morning-${b}-${n}`,
    title: title ?? d.title,
  };
  catalog.push(c);
  return c;
}
const school = [
  { name: "音乐室", x: 0, y: 0 },
  { name: "教学楼", x: 1, y: 0 },
  { name: "电脑房", x: 2, y: 0 },
  { name: "花坛", x: 1, y: 1 },
  { name: "阅览室", x: 2, y: 1 },
  { name: "篮球场", x: 0, y: 2 },
  { name: "标本库", x: 2, y: 2 },
];
// 第四份：08:50:04
division(4, 1, 12, 5, "🍑", "groups", "去掉余数后正好平分");
map(
  4,
  2,
  [
    { name: "教学楼", x: 0, y: 0 },
    { name: "食堂", x: 2, y: 0 },
  ],
  [[1, 0]],
);
map(4, 3, school, [
  [1, 3],
  [1, 0],
  [6, 5],
  [6, 4],
  [0, 5],
  [0, 1],
  [2, 1],
]);
map(
  4,
  4,
  [
    { name: "温室", x: 0, y: 0 },
    { name: "金鱼池", x: 1, y: 0 },
    { name: "熊猫乐园", x: 2, y: 0 },
    { name: "水母世界", x: 0, y: 1 },
    { name: "小朋友", x: 1, y: 1 },
    { name: "蝴蝶屋", x: 2, y: 1 },
    { name: "雀鸟天地", x: 0, y: 2 },
    { name: "海洋馆", x: 1, y: 2 },
    { name: "凉亭", x: 2, y: 2 },
  ],
  [
    [7, 6],
    [5, 8],
    [0, 3],
    [1, 0],
  ],
  [3, 0, 1],
);
sort(
  4,
  5,
  [
    ["🍗", 2],
    ["🍔", 0],
    ["🍔", 1],
    ["🍗", 0],
    ["🍗", 2],
    ["🍔", 2],
    ["🍗", 1],
  ].map(([icon, shape]) => ({
    icon: String(icon),
    shape: Number(shape),
    color: 0,
    size: 0,
    extra: icon === "🍗" ? 0 : 1,
  })),
  ["extra", "shape"],
  [
    ["鸡腿", "汉堡"],
    ["三角框", "方框", "圆框"],
  ],
);
sort(
  4,
  6,
  ["▬", "★", "♥", "●", "●", "♥", "★", "▬"].map((icon, i) => ({
    icon,
    shape: [0, 1, 2, 3, 3, 2, 1, 0][i],
    color: [0, 1, 2, 0, 1, 0, 2, 2][i],
    size: 0,
    extra: 0,
  })),
  ["shape", "color"],
  [
    ["长方形", "星形", "心形", "圆形"],
    ["黄色", "粉色", "蓝色"],
  ],
);
sort(
  4,
  7,
  Array.from({ length: 9 }, (_, i) => ({
    icon: "杯",
    shape: [0, 1, 2, 1, 0, 2, 0, 1, 2][i],
    color: 0,
    size: 0,
    extra: [0, 1, 2, 0, 2, 1, 1, 2, 0][i],
  })),
  ["shape", "extra"],
  [
    ["无把梯形杯", "无把直筒杯", "有把杯"],
    ["空杯", "半杯", "满杯"],
  ],
);
merge(4, 8, "价钱与是否够付", [
  arithmetic(
    4,
    8,
    "糖与果冻",
    [
      F("candy", "一包奶糖（元）", 32, 10, 40),
      F("jelly", "果冻单价（元）", 2, 1, 5),
      F("count", "果冻个数", 4, 1, 8),
    ],
    (v) => ({
      story: `买一包${v.candy}元奶糖和${v.count}个每个${v.jelly}元果冻。`,
      labels: ["奶糖", "果冻"],
      values: [v.candy, v.jelly * v.count],
      op: `${v.candy}+${v.jelly}×${v.count}`,
      answer: v.candy + v.jelly * v.count,
    }),
  ),
  add(
    4,
    8,
    "付的钱够吗",
    [
      F("lollipop", "棒棒糖单价（元）", 6, 1, 10),
      F("count", "棒棒糖根数", 4, 1, 8),
      F("cake", "蛋糕单价（元）", 8, 1, 15),
      F("money", "拿出的钱（元）", 30, 10, 80),
    ],
    (v) =>
      result(
        `买${v.count}根${v.lollipop}元棒棒糖和一块${v.cake}元蛋糕，拿出${v.money}元。`,
        [
          objects([
            row("棒棒糖", v.count, "🍭", v.lollipop),
            row("蛋糕", 1, "🍰", v.cake),
          ]),
        ],
        [
          choose(
            "钱够吗？",
            v.money >= v.count * v.lollipop + v.cake ? "够" : "不够",
            ["够", "不够"],
            "先算需要的总价，再和拿出的钱比较。",
          ),
        ],
        `需要${v.count * v.lollipop + v.cake}元。`,
      ),
  ),
]);
add(
  4,
  9,
  "和、几个相加与积",
  [F("a", "第一个数", 2, 1, 8), F("b", "第二个数", 6, 1, 8)],
  (v) =>
    result(
      `比较“${v.a}和${v.b}的和”“${v.a}个${v.b}的和”“${v.a}个${v.b}的积”。`,
      [objects([row("加法的两部分", v.a + v.b), row("相同加数", v.a * v.b)])],
      [
        num("两个数的和是多少？", v.a + v.b, `${v.a}+${v.b}。`),
        num(`${v.a}个${v.b}相加是多少？`, v.a * v.b, `${v.a}×${v.b}。`),
        num(
          `${v.a}个${v.b}相乘是多少？`,
          v.b ** v.a,
          `把${v.b}重复乘${v.a}次。`,
        ),
      ],
      "“和”是加法，“积”是乘法；“几个数相乘”和“几个数相加”不同。",
    ),
);
merge(4, 10, "自己写除法算式", [
  division(4, 10, 72, 8, "●", "groups"),
  division(4, 10, 36, 6, "●", "groups"),
]);
product(4, 11, 7, 4, "●", "四个7相加");
map(
  4,
  12,
  [
    { name: "教学楼", x: 1, y: 0 },
    { name: "体育馆", x: 0, y: 1 },
    { name: "操场", x: 1, y: 1 },
    { name: "图书馆", x: 2, y: 1 },
    { name: "大门", x: 1, y: 2 },
  ],
  [
    [0, 2],
    [1, 2],
    [2, 3],
    [3, 1],
  ],
);
facing(4, 13, 1, [1], 2);
add(
  4,
  14,
  "自然现象中的方向",
  [F("event", "观察情境", 0, 0, 2, ["日出", "日落", "题设候鸟迁徙"])],
  (v) =>
    result(
      [
        "早晨太阳由东方升起。",
        "傍晚太阳在西方落下。",
        "本题设定：秋天燕子由北方往南方过冬。",
      ][v.event],
      [
        {
          kind: "direction",
          facing: [1, 3, 2][v.event],
          turns: [],
          north: 0,
          places: [],
        },
      ],
      [
        choose(
          [
            "太阳从哪一方升起？",
            "太阳从哪一方落下？",
            "题设燕子要飞往哪一方？",
          ][v.event],
          ["东", "西", "南"][v.event],
          directionNames,
          "自然常识和题目明确给的迁徙方向是固定条件，不能任意改成别的方向。",
        ),
      ],
      "先准确读取情境，再辨认方位。",
    ),
);
add(
  4,
  15,
  "电影院已售与未售",
  [
    F("rows", "中间有几排", 4, 2, 6),
    F("red", "每排已售", 4, 2, 6),
    F("side", "中间每排两侧空位总数", 2, 0, 4),
  ],
  (v) => {
    const rows = [v.red, ...Array(v.rows).fill(v.red + v.side), v.red + v.side],
      sold = rows.flatMap((_, r) =>
        r === rows.length - 1
          ? []
          : Array.from(
              { length: v.red },
              (_, c) =>
                rows.slice(0, r).reduce((a, b) => a + b, 0) +
                (r === 0 ? c : Math.floor(v.side / 2) + c),
            ),
      );
    return result(
      "红色为已售，空心为可选。每个实际存在的座位只数一次，缺角不补座。",
      [{ kind: "seat", rows, sold }],
      [
        num(
          "已售座位有几个？",
          sold.length,
          `${v.red}×${v.rows + 1}=${sold.length}。`,
        ),
        num(
          "未售座位有几个？",
          rows.reduce((a, b) => a + b, 0) - sold.length,
          "总座位减去已售座位。",
        ),
      ],
      "可以按整排或按颜色分组检查，已售＋未售＝全部。",
    );
  },
);
arithmetic(
  4,
  16,
  "个位比十位大",
  [F("ones", "个位数字", 7, 2, 9), F("difference", "个位比十位大几", 5, 1, 8)],
  (v) => ({
    story: `两位数个位是${v.ones}，比十位大${v.difference}。求这个数。`,
    labels: ["十位", "个位"],
    values: [v.ones - v.difference, v.ones],
    op: `（${v.ones}−${v.difference}）×10+${v.ones}`,
    answer: (v.ones - v.difference) * 10 + v.ones,
  }),
  (v) => (v.difference >= v.ones ? ["两位数十位必须大于0。"] : []),
);
for (const [n, span, inverse] of [
  [17, 3, 0],
  [18, 4, 1],
  [19, 2, 0],
  [20, 3, 0],
  [21, 5, 1],
  [22, 3, 0],
  [23, 3, 0],
  [24, 5, 1],
  [25, 6, 0],
])
  ribbon(4, n, span, !!inverse);
// 第五份只有2题
orchard(5, 1);
remainder(5, 2, 3, 6);
// 第六份：07:36:56
remainder(6, 1, 7, 6, "maxRemainder");
add(
  6,
  2,
  "重复图案的第几个",
  [
    F("a", "每组前面三角形个数", 3, 1, 5),
    F("b", "每组后面圆形个数", 2, 1, 5),
    F("index", "要找第几个图形", 22, 2, 60),
  ],
  (v) => {
    const r = mod(v.index - 1, v.a + v.b);
    return result(
      `图案按${v.a}个三角形、${v.b}个圆重复，找第${v.index}个。`,
      [{ kind: "pattern", a: v.a, b: v.b, index: v.index }],
      [
        choose(
          `第${v.index}个是什么图形？`,
          r < v.a ? "三角形" : "圆",
          ["三角形", "圆"],
          "先确定一组有几个，余数为0时在前一组最后。",
        ),
        num(
          "它在这一组的第几个位置？",
          r + 1,
          `（${v.index}−1）除以${v.a + v.b}取余，再加1，得到${r + 1}。`,
        ),
      ],
      "数第几个从1开始；整除时对应一组最后一个。",
    );
  },
);
merge(6, 3, "分针与时针的一圈", [
  convertClock(6, 3, "minute", 1),
  convertClock(6, 3, "hour", 1),
]);
merge(6, 4, "大格与半小时", [
  clockArc(6, 4, 12, 1),
  convertClock(6, 4, "minute", 30),
]);
clone(6, 5, 2, 7);
add(
  6,
  6,
  "钟面数字排列正确吗",
  [
    F("reverse", "数字排列方向", 1, 0, 1, ["正确顺时针", "错误逆时针"]),
    F("h", "演示小时", 5, 1, 12),
  ],
  (v) =>
    result(
      "从12开始沿顺时针检查1、2、3……的位置。不要只看外壳。",
      [{ kind: "clock", minutes: v.h * 60, wrongDial: !!v.reverse }],
      [
        choose(
          "这个钟面数字排列正确吗？",
          v.reverse ? "不正确" : "正确",
          ["正确", "不正确"],
          "顺时针方向的数字应该逐渐增加。",
        ),
      ],
      "钟面右侧3、下方6、左侧9。",
    ),
);
merge(6, 7, "钟表单位换算", [
  convertClock(6, 7, "hour", 24),
  convertClock(6, 7, "minute", 2),
  convertClock(6, 7, "second", 1),
]);
merge(6, 8, "整时与几时多", [clockRead(6, 8, [540]), clockRead(6, 8, [565])]);
clockRead(
  6,
  9,
  [250, 230, 75, 390],
  false,
  "第一钟长针指向2，为4:10，原解析4:15不符合题面。",
);
merge(6, 10, "半小时与两小时", [
  convertClock(6, 10, "minute", 30),
  convertClock(6, 10, "hour", 2),
]);
clone(6, 11, 6, 8);
clone(6, 12, 6, 9);
add(
  6,
  13,
  "找出余数与单位错误",
  [F("total", "练习本总数", 20, 8, 60), F("groups", "小组数", 3, 2, 8)],
  (v) => {
    const q = Math.floor(v.total / v.groups),
      r = v.total % v.groups;
    return result(
      `把${v.total}本平均分给${v.groups}个小组。小凯写：${v.total}÷${v.groups}=${Math.max(0, q - 1)}（本）……${v.total - Math.max(0, q - 1) * v.groups}（本）；小欣写：${v.total}÷${v.groups}=${q}（个小组）……${r}（本）。请分别检查。`,
      [
        {
          kind: "divide",
          total: v.total,
          size: v.groups,
          icon: "📘",
          mode: "groups",
          unit: "本",
        },
      ],
      [
        choose(
          "小凯的余数，够不够给每组再分1本？",
          "还能再分一轮",
          ["还能再分一轮", "不能再分了"],
          "试着把剩下的再给每组1本。",
        ),
        choose(
          "商表示每组多少，应是什么单位？",
          "本",
          ["本", "个小组"],
          "商数的是每组拿到的物体。",
        ),
      ],
      `每组${q}本，剩${r}本。商的单位由所求的量决定。`,
    );
  },
);
merge(6, 14, "同一批胡萝卜的两种分法", [
  division(6, 14, 13, 4, "🥕", "each"),
  division(6, 14, 13, 4, "🥕", "groups"),
]);
merge(6, 15, "草莓分盘的两种解释", [
  division(6, 15, 13, 4, "🍓", "each"),
  division(6, 15, 13, 3, "🍓", "groups"),
]);
division(6, 16, 23, 5, "│", "each", "独立五边形要几根棒");
elapsed(6, 17, 15, 30);
elapsed(6, 18, 450, 990, 60);
elapsed(6, 19, 800, 920);
elapsed(6, 20, 600, 670);
units(6, 21, ["每天睡眠时间"], [10], ["小时"], ["分钟", "小时"]);
division(6, 22, 18, 5, "⚽");
division(6, 23, 14, 4, "🌷");
clone(6, 24, 2, 1);
clone(6, 25, 2, 2);
// 第七份：08:51:50
facing(7, 1, 2, [], 3, "面向南时的左面");
merge(7, 2, "剪纸与分给邻居", [
  product(7, 2, 2, 4, "✿", "每张纸剪2朵"),
  division(7, 2, 24, 4, "✿", "groups"),
]);
division(7, 3, 12, 3, "🍆", "groups");
product(7, 4, 5, 6, "●", "第六组有几颗点");
add(
  7,
  5,
  "行和列都是相同的份",
  [F("rows", "行数", 2, 2, 6), F("cols", "列数", 3, 2, 6)],
  (v) =>
    result(
      `有${v.rows}行、${v.cols}列的格子阵。切换按行、按列分组。`,
      [
        objects(
          Array.from({ length: v.rows }, (_, i) =>
            row(`第${i + 1}行`, v.cols, "□"),
          ),
        ),
      ],
      [
        num(
          "一共有几格？",
          v.rows * v.cols,
          `${v.rows}×${v.cols}=${v.cols}×${v.rows}。`,
        ),
        choose(
          "按行和按列分组，得到的总数相同吗？",
          "相同",
          ["相同", "不同"],
          "每个格子始终只数一次。",
        ),
      ],
      "同一个长方形阵，可以同时表示两种相同加数的含义。",
    ),
);
merge(7, 6, "小丑、球与碗", [
  product(7, 6, 3, 2, "●", "两个小丑的球"),
  product(7, 6, 6, 2, "🥣", "两个小丑的碗"),
  product(7, 6, 3, 3, "●", "三个小丑的球"),
  product(7, 6, 6, 3, "🥣", "三个小丑的碗"),
  product(7, 6, 3, 4, "●", "四个小丑的球"),
  product(7, 6, 6, 4, "🥣", "四个小丑的碗"),
]);
arithmetic(
  7,
  7,
  "水果之间的替换",
  [
    F("berries", "西瓜等于几颗草莓", 8, 2, 12),
    F("perTomato", "一个番茄等于几颗草莓", 2, 1, 6),
  ],
  (v) => ({
    story: `一个西瓜等于${v.berries}颗草莓，${v.perTomato}颗草莓等于一个番茄。西瓜等于几个番茄？`,
    labels: ["全部草莓", "一个番茄的草莓"],
    values: [v.berries, v.perTomato],
    op: `${v.berries}÷${v.perTomato}`,
    answer: v.berries / v.perTomato,
  }),
  (v) => (v.berries % v.perTomato ? ["草莓需能组成整数个番茄份。"] : []),
);
add(7, 8, "角上的棋子算两边", [F("side", "每边棋子数", 4, 2, 9)], (v) =>
  result(
    `正方形四条边上都要有${v.side}枚棋子，角上的棋子可同时属于两条边。`,
    [{ kind: "border", perSide: v.side }],
    [
      num(
        "至少需要多少枚不同的棋子？",
        v.side * 4 - 4,
        `四边各${v.side}个共数${v.side * 4}次，四个角各重复1次，减4。`,
      ),
    ],
    "边框计数与实心方阵不同；只数棋子，不重复数角。",
  ),
);
merge(7, 9, "角的数量", [
  product(7, 9, 3, 4, "∠", "四个三角形的角"),
  product(7, 9, 4, 4, "∠", "四个四边形的角"),
]);
jump(7, 10, 2, 2, 3);
jump(7, 11, 0, 4, 5);
arithmetic(
  7,
  12,
  "积木叠高不能算并排",
  [
    F("block", "长方体高（厘米）", 3, 1, 6),
    F("cube", "正方体高（厘米）", 5, 2, 9),
    F("cylinder", "圆柱高（厘米）", 8, 2, 12),
  ],
  (v) => ({
    story: `长方体高${v.block}厘米、正方体高${v.cube}厘米、圆柱高${v.cylinder}厘米。第一座一个长方体上并排两根圆柱；第二座两层长方体加正方体再加圆柱。`,
    labels: ["第一座高度", "第二座高度"],
    values: [v.block + v.cylinder, v.block * 2 + v.cube + v.cylinder],
    op: `${v.block}+${v.cylinder}`,
    answer: v.block + v.cylinder,
    others: [
      num(
        "第二座有多高（厘米）？",
        v.block * 2 + v.cube + v.cylinder,
        `${v.block}×2+${v.cube}+${v.cylinder}。`,
      ),
    ],
  }),
);
measure(7, 13, [{ label: "木棒", start: 0, length: 4 }]);
const pending = add(7, 14, "算式练习：题目要求待核对", [], () =>
  result("", [], [], ""),
);
pending.pending =
  "原图只保留了5道算式，没有保留“排序、比较还是其他要求”的题干。暂不猜测原题任务；可先练相邻的乘法题。";
product(7, 15, 4, 6, "●", "因数与积");
const mixed21 = Array.from({ length: 21 }, (_, i) => {
  const shape = [2, 1, 0, 1, 2, 0, 2, 0, 1, 2, 2, 1, 2, 1, 1, 2, 1, 0, 2, 0, 2][
      i
    ],
    plant = [0, 2, 3, 5, 7, 11, 12, 14, 15, 18, 19, 20].includes(i);
  return {
    icon: plant ? "🌱" : "🐤",
    shape,
    color: plant ? 0 : 1,
    size: 0,
    extra: plant ? 0 : 1,
  };
});
sort(
  7,
  16,
  mixed21,
  ["extra", "extraShape"],
  [
    ["植物", "动物"],
    [
      "植物·三角框",
      "植物·方框",
      "植物·圆框",
      "动物·三角框",
      "动物·方框",
      "动物·圆框",
    ],
  ],
  "原图不清晰，保留21张卡片，以清晰植物/动物图标重画。第二步在第一层类别内部继续分，不把分类树改成全局重新分。",
);
sort(
  7,
  17,
  mixed21,
  ["shape", "shapeExtra"],
  [
    ["三角框", "方框", "圆框"],
    [
      "三角·植物",
      "三角·动物",
      "方框·植物",
      "方框·动物",
      "圆框·植物",
      "圆框·动物",
    ],
  ],
  "同一组卡片换分类树的先后顺序，最终总数仍为21。",
);
division(7, 18, 18, 3, "●", "groups");
merge(7, 19, "毛巾与茶杯", [
  product(7, 19, 6, 6, "▰", "买6条毛巾"),
  division(7, 19, 24, 2, "☕", "each", "24元买几个2元茶杯"),
]);
arithmetic(
  7,
  20,
  "苹果和梨的密码",
  [F("pear", "梨表示几", 3, 1, 8), F("multiple", "苹果是梨的几倍", 2, 2, 4)],
  (v) => ({
    story: `苹果＋梨＝${v.pear * (v.multiple + 1)}，苹果＝${v.multiple}个梨。求梨×苹果。`,
    labels: ["一个梨", "一个苹果"],
    values: [v.pear, v.pear * v.multiple],
    op: `${v.pear}×（${v.pear}×${v.multiple}）`,
    answer: v.pear * v.pear * v.multiple,
  }),
);
merge(7, 21, "盘里的苹果与成束气球", [
  product(7, 21, 4, 3, "🍎", "三盘苹果"),
  product(7, 21, 5, 2, "🎈", "两束气球"),
]);
merge(7, 22, "平均分与每份几个", [
  division(7, 22, 12, 3, "🍌", "groups"),
  division(7, 22, 16, 4, "🍎", "each"),
]);
function calcPair(a: number, o: string, b: number) {
  return o === "+" ? a + b : o === "-" ? a - b : o === "×" ? a * b : a / b;
}
function calc3(a: number, x: string, b: number, y: string, c: number) {
  return (y === "×" || y === "÷") && (x === "+" || x === "-")
    ? calcPair(a, x, calcPair(b, y, c))
    : calcPair(calcPair(a, x, b), y, c);
}
export function operatorSolutions(nums: number[]) {
  const ops = ["+", "-", "×", "÷"],
    out: string[] = [];
  for (const a of ops)
    for (const b of ops.filter((x) => x !== a))
      for (const c of ops.filter((x) => x !== a && x !== b)) {
        const d = ops.find((x) => ![a, b, c].includes(x))!;
        if (
          Math.abs(
            calc3(nums[0], a, nums[1], b, nums[2]) -
              calc3(nums[3], c, nums[4], d, nums[5]),
          ) < 1e-9
        )
          out.push(a + b + c + d);
      }
  return out;
}
add(
  7,
  23,
  "四种符号各用一次",
  [
    F("a", "右侧第一个数", 3, 2, 7),
    F("b", "左侧除数", 4, 2, 8),
    F("d", "右侧后两个数", 6, 4, 9),
  ],
  (v) => {
    const ns = [v.a * v.b, v.b, (v.a - 1) * v.d - v.a, v.a, v.d, v.d],
      solutions = operatorSolutions(ns);
    return result(
      `${ns[0]}○${ns[1]}○${ns[2]}＝${ns[3]}○${ns[4]}○${ns[5]}。在4个○里各填一次＋、－、×、÷，仍要遵守运算顺序。`,
      [
        cards(
          ns.map((_, i) => "数" + (i + 1)),
          ns,
          "按运算顺序检查等式",
          0,
        ),
      ],
      [
        Q(
          "按从左到右顺序输入4个符号，例如÷+×-。",
          solutions[0],
          "乘除先算；每种符号只出现一次。",
          "成立的填法：" + solutions.join(" 或 "),
          {
            accepted: solutions.flatMap((s) => [
              s,
              s.replaceAll("×", "*").replaceAll("÷", "/"),
              s.replaceAll("+", "＋").replaceAll("-", "－"),
            ]),
          },
        ),
      ],
      "不同填法只要四种符号各用一次且等式成立，都接受。",
    );
  },
);
division(7, 24, 24, 6, "━", "groups", "丝带平均剪6份");
division(7, 25, 24, 6, "🍑", "each", "用连减和除法数篮子");
// 第八份：07:30:51
sort(
  8,
  1,
  Array.from({ length: 8 }, (_, i) => ({
    icon: [0, 3, 4, 5, 6].includes(i) ? "🚶" : "↥",
    shape: [0, 2, 5, 7].includes(i) ? 1 : 0,
    frame: [0, 2, 5, 7].includes(i) ? 2 : 0,
    color: 0,
    size: 0,
    extra: [0, 3, 4, 5, 6].includes(i) ? 0 : 1,
  })),
  ["shape", "extra"],
  [
    ["三角框", "圆框"],
    ["图案有人", "图案无人"],
  ],
);
arithmetic(
  8,
  2,
  "从连环画选有效信息",
  [
    F("mom", "妈妈实际包了几个", 40, 10, 80),
    F("child", "孩子实际包了几个", 8, 1, 15),
    F("planned", "妈妈原计划包几个", 68, 30, 90),
  ],
  (v) => ({
    story: `妈妈原计划包${v.planned}个，实际包了${v.mom}个，孩子包了${v.child}个。只求实际一共包了多少。`,
    labels: ["妈妈实际", "孩子实际"],
    values: [v.mom, v.child],
    op: `${v.mom}+${v.child}`,
    answer: v.mom + v.child,
  }),
);
add(
  8,
  3,
  "购物故事里哪句是真的",
  [
    F("money", "给孩子的零花钱（元）", 50, 20, 100),
    F("price", "巧克力每块（元）", 10, 2, 15),
    F("count", "巧克力块数", 2, 1, 4),
  ],
  (v) =>
    result(
      `孩子收到${v.money}元零花钱，买${v.count}块每块${v.price}元巧克力。妈妈葡萄花20元，牙刷花6元。`,
      [
        objects([
          row("巧克力", v.count, "🍫", v.price),
          row("零花钱", 1, "💰", v.money),
        ]),
      ],
      [
        choose(
          "哪条信息符合故事？",
          `收到${v.money}元零花钱`,
          [
            "葡萄花25元",
            `买了${v.count + 1}块巧克力`,
            "牙刷花12元",
            `收到${v.money}元零花钱`,
          ],
          "只选故事确实说出的信息，不把不同商品价钱混在一起。",
        ),
      ],
      "先准确读出条件，再提出计算问题。",
    ),
  (v) => (v.price * v.count > v.money ? ["巧克力总价不能超过零花钱。"] : []),
);
add(
  8,
  4,
  "蘑菇故事里的准确条件",
  [
    F("white", "小白摘的数量", 26, 10, 40),
    F("more", "小灰比小白多几", 7, 1, 12),
    F("total", "三人合计", 86, 70, 110),
  ],
  (v) =>
    result(
      `三人共摘${v.total}个。小白摘${v.white}个，小灰比小白多${v.more}个。`,
      [
        objects(
          [row("小白", v.white, "🍄"), row("小灰", v.white + v.more, "🍄")],
          true,
        ),
      ],
      [
        choose(
          "哪句话与题意一致？",
          `小白摘${v.white}个`,
          [
            `一共摘${v.total - 10}个`,
            `小白比小灰多${v.more}个`,
            `小白摘${v.white}个`,
          ],
          "“谁比谁多”不能倒过来读。",
        ),
      ],
      "已知总量、部分量和比较关系各有不同意义。",
    ),
  (v) =>
    v.white * 2 + v.more > v.total ? ["总数应至少容纳两只小兔摘的蘑菇。"] : [],
);
arithmetic(
  8,
  5,
  "已知剩余，找回原来",
  [F("picked", "已经摘下的桃子", 10, 1, 20), F("left", "树上还剩", 25, 5, 40)],
  (v) => ({
    story: `小猴已经摘下${v.picked}个桃子，树上还剩${v.left}个。“树上还剩”是题目给的信息，原来有多少才是要算的。`,
    labels: ["已摘", "还剩"],
    values: [v.picked, v.left],
    op: `${v.picked}+${v.left}`,
    answer: v.picked + v.left,
  }),
);
clockRead(8, 6, [450]);
clockRead(8, 7, [270]);
clockRead(8, 8, [690]);
clockRead(8, 9, [330]);
clockRead(8, 10, [450]);
clockRead(8, 11, [450]);
add(8, 12, "整时与半时的分针", [F("h", "观察小时", 9, 1, 12)], (v) =>
  result(
    "钟面有12个数字。比较整时与半时，分针和时针如何变化。",
    [D(v.h * 60, 30)],
    [
      num("钟面有几个数字？", 12, "1到12，共12个。"),
      num("整时分针指向哪个数？", 12, "整时分钟是0，分针在12。"),
      num("半时分针指向哪个数？", 6, "半小时30分，是半圈，分针在6。"),
    ],
    "半时的时针在两个小时数字中间。",
  ),
);
clockRead(8, 13, [450]);
clockRead(8, 14, [630]);
clockRead(8, 15, [330]);
merge(8, 16, "时、分、秒同步走", [
  convertClock(8, 16, "hour", 3),
  convertClock(8, 16, "minute", 3),
  convertClock(8, 16, "second", 5),
]);
clockArc(8, 17, 4, 5);
clockArc(8, 18, 1, 5);
merge(8, 19, "分针起点与秒针圈数", [
  clockArc(8, 19, 5, 8),
  add(
    8,
    19,
    "走20圈后在哪里",
    [F("start", "分针起点数字", 7, 1, 12), F("circles", "秒针圈数", 20, 5, 30)],
    (v) =>
      result(
        `分针从${v.start}起，秒针走${v.circles}圈。`,
        [
          {
            kind: "clock",
            minutes: (v.start % 12) * 5,
            elapsed: v.circles,
            seconds: true,
          },
        ],
        [
          num(
            "分针到达哪个数字？",
            mod(v.start + v.circles / 5 - 1, 12) + 1,
            "先换成分钟，再每5分钟过一个数字。",
          ),
        ],
        "秒针1圈就是1分钟。",
      ),
    (v) => (v.circles % 5 ? ["为了停在数字上，圈数请用5的倍数。"] : []),
  ),
]);
clockArc(8, 20, 12, 1);
merge(8, 21, "钟针走的格数", [
  convertClock(8, 21, "hour", 1),
  convertClock(8, 21, "second", 1),
  convertClock(8, 21, "hour", 5),
]);
merge(8, 22, "不同区间经过的分钟", [
  clockArc(8, 22, 2, 7),
  clockArc(8, 22, 8, 12),
]);
clockArc(8, 23, 10, 2);
add(
  8,
  24,
  "积木拆开数一数",
  [
    F("box", "长方体个数", 5, 2, 8),
    F("cube", "正方体个数", 2, 1, 5),
    F("cylinder", "圆柱个数", 3, 1, 6),
    F("ball", "球个数", 2, 1, 5),
  ],
  (v) =>
    result(
      "把结构分开，再按立体形状排成四行。先看清被遮挡的部件。",
      [
        objects([
          row("长方体", v.box, "▰"),
          row("正方体", v.cube, "▣"),
          row("圆柱", v.cylinder, "▥"),
          row("球", v.ball, "●"),
        ]),
      ],
      [
        num("长方体有几个？", v.box, "拆开按行逐个标记。"),
        num("正方体有几个？", v.cube, "长方体与正方体分开统计。"),
        num("圆柱有几个？", v.cylinder, "检查竖直和被遮挡的圆柱。"),
        num("球有几个？", v.ball, "只数真正的部件。"),
      ],
      "模型拆开后部件总数不变。",
    ),
  undefined,
  "原图片局部遮挡；以可拆分的清晰示意部件重画，参数可调。",
);
add(
  8,
  25,
  "队伍中的相对位置",
  [
    F("red", "小红从前数第几", 6, 3, 10),
    F("between", "小红到小明相差几个位置", 3, 1, 5),
    F("after", "小明后面还有几人", 6, 2, 8),
  ],
  (v) => {
    const total = v.red + v.between + v.after,
      ming = v.red + v.between;
    return result(
      `小红排第${v.red}，小明在她后面${v.between}个位置，小月是队尾，小明后面还有${v.after}人。`,
      [{ kind: "line", start: 1, jump: 1, times: total - 1 }],
      [
        num("小红前面有几人？", v.red - 1, `名次减1，${v.red}−1。`),
        num("一共有几人？", total, `${ming}+${v.after}=${total}。`),
        num(
          "小明和小月之间有几人？",
          v.after - 1,
          `不算两端的人，${v.after}−1。`,
        ),
        num(
          "从小红到小月包含两人，共几人？",
          total - v.red + 1,
          `${total}−${v.red}+1。`,
        ),
      ],
      "“之间”不含两端，“从谁到谁”通常包含两端，要读清条件。",
    );
  },
);
export function fieldsFor(d: Definition) {
  return d.fields;
}
export function defaults(d: Definition): Values {
  return Object.fromEntries(d.fields.map((f) => [f.key, f.value]));
}
export function validate(d: Definition, v: Values) {
  const e = d.fields.flatMap((f) =>
    !Number.isInteger(v[f.key]) || v[f.key] < f.min || v[f.key] > f.max
      ? [`${f.label}请填${f.min}～${f.max}的整数。`]
      : [],
  );
  if (e.length) return e;
  return d.valid?.(v) ?? [];
}
export function build(d: Definition, v: Values): Lesson {
  if (d.pending) throw Error(d.pending);
  const errors = validate(d, v);
  if (errors.length) throw Error(errors.join(" "));
  const x = d.make(v);
  if (d.book === 1 && d.n === 25)
    x.tasks.push(
      num(
        "刚才按图案、颜色、大小，一共试了几种分类标准？",
        3,
        "三种标准；其中两种得到相同分组，也仍然是不同标准。",
      ),
    );
  if (d.book === 7 && d.n === 12) {
    x.tasks[0].prompt = "第一座积木有多高（厘米）？";
    x.panels = [
      { kind: "stack", block: v.block, cube: v.cube, cylinder: v.cylinder },
    ];
  }
  if (d.book === 3 && d.n === 21)
    x.panels = [
      { kind: "transfer", white: v.white, give: v.give, multiple: v.multiple },
    ];
  return {
    id: 1000 + d.book * 100 + d.n,
    title: d.title,
    topic: d.topic,
    story: x.story,
    scene: {
      type: "workbook",
      panels: x.panels,
      frames: [
        {
          text: "先看清条件和物体。每一步动画都与同一个数学模型对应。",
          duration: 1600,
        },
        {
          text: "观察数量、位置或指针怎样改变，再亲手操作、独立作答。",
          duration: 2000,
        },
      ],
    },
    tasks: x.tasks.map((t, i) => ({
      ...t,
      id: `task-${i + 1}`,
      focus: t.focus ?? String(Math.min(i, x.panels.length - 1)),
    })),
    summary: x.summary,
    sourceNote: d.note,
  };
}
export function variant(d: Definition, v: Values, excluded: Lesson[] = []) {
  const signatures = new Set(
    [build(d, v), ...excluded].map((l) => JSON.stringify([l.scene, l.tasks])),
  );
  for (const f of d.fields)
    for (const delta of [1, 2, -1, -2, 3, -3]) {
      const next = { ...v, [f.key]: v[f.key] + delta };
      if (validate(d, next).length) continue;
      const l = build(d, next);
      if (!signatures.has(JSON.stringify([l.scene, l.tasks]))) {
        const previous = new Set(
            [build(d, v), ...excluded].flatMap((l) =>
              l.tasks.map((t) => JSON.stringify([t.prompt, t.answer, t.pick])),
            ),
          ),
          fresh = l.tasks.filter(
            (t) => !previous.has(JSON.stringify([t.prompt, t.answer, t.pick])),
          );
        return {
          ...l,
          tasks: fresh.length
            ? excluded.length
              ? [fresh[0]]
              : fresh
            : l.tasks,
        };
      }
    }
  throw Error("没有可用的新条件，请检查题目参数");
}
catalog.sort((a, b) => a.book - b.book || a.n - b.n);
