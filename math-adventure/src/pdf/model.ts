import type { ExtensionScene } from "../notebooks/types";
/** Hand-checked against all twelve rendered PDF pages. No source PDF or personal data shipped. */
export type Shape =
  | "正方形"
  | "长方形"
  | "三角形"
  | "圆"
  | "平行四边形"
  | "蓝色三角形"
  | "绿色三角形";
export type Piece = {
  id: string;
  kind: Shape;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
};
export type Item = {
  id: string;
  name: string;
  icon: string;
  price?: number;
  kind?: string;
};
export type Scene =
  | ExtensionScene
  | { type: "pieces"; pieces: Piece[]; title: string; original: boolean }
  | {
      type: "line";
      items: Item[];
      direction: "left" | "right";
      target: number;
      race?: boolean;
    }
  | { type: "solids"; items: Item[] }
  | {
      type: "quantity";
      kind: "balls" | "eggs" | "chairs" | "bus";
      a: number;
      b: number;
    }
  | {
      type: "shop";
      items: Item[];
      repeat: boolean;
      threshold?: number;
      discount?: number;
    };
export type Task = {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  explanation: string;
  options?: string[];
  accepted?: string[];
  pick?: string[];
  basket?: "min" | "max" | "offer" | "specified";
  counts?: number[];
  focus?: string;
};
export type Lesson = {
  id: number;
  title: string;
  topic: string;
  story: string;
  scene: Scene;
  tasks: Task[];
  summary: string;
  sourceNote?: string;
};
export type Field = {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
};
export const catalog = [
  ["图形小火车", "图形计数"],
  ["图形轮船", "图形计数"],
  ["城堡与小树", "图形计数"],
  ["彩色三角火车", "图形计数"],
  ["运货小火车", "图形计数"],
  ["图形机器人", "图形计数"],
  ["动物过桥", "前后位置"],
  ["找到跑步的小朋友", "前后位置"],
  ["动物赛跑", "前后位置"],
  ["小鸭的比赛", "前后位置"],
  ["立体积木队伍", "分类与位置"],
  ["两种方法数球", "数量关系"],
  ["找回原来的鸡蛋", "数量关系"],
  ["还缺几把椅子", "数量关系"],
  ["大巴里有几人", "数量关系"],
  ["农场满减", "购物策略"],
  ["冰淇淋满减", "购物策略"],
  ["文具怎么选", "购物策略"],
  ["水果怎么选", "购物策略"],
  ["两个不同玩具", "购物策略"],
  ["两副球拍", "购物策略"],
] as const;
export const shapeCounts: Record<number, [Shape, number][]> = {
  1: [
    ["正方形", 7],
    ["长方形", 4],
    ["三角形", 3],
    ["圆", 6],
  ],
  2: [
    ["三角形", 2],
    ["正方形", 3],
    ["圆", 4],
    ["长方形", 4],
  ],
  3: [
    ["长方形", 6],
    ["正方形", 1],
    ["三角形", 5],
    ["平行四边形", 3],
    ["圆", 4],
  ],
  4: [
    ["蓝色三角形", 4],
    ["绿色三角形", 1],
  ],
  5: [
    ["长方形", 4],
    ["正方形", 1],
    ["圆", 5],
    ["三角形", 1],
  ],
  6: [
    ["三角形", 6],
    ["圆", 5],
    ["长方形", 2],
  ],
};
const p = (
  kind: Shape,
  x: number,
  y: number,
  w: number,
  h: number,
  rotate = 0,
): Piece => ({ id: "", kind, x, y, w, h, rotate });
/** Components are disjoint counting units. Shared outer outlines are not extra pieces. */
function originalPieces(id: number): Piece[] {
  let a: Piece[] = [];
  if (id === 1) {
    a = [
      p("长方形", 100, 175, 330, 95),
      p("长方形", 430, 220, 120, 50),
      p("长方形", 535, 170, 15, 50),
      p("长方形", 450, 140, 50, 12),
      p("正方形", 430, 152, 68, 68),
    ];
    for (let i = 0; i < 3; i++)
      a.push(
        p("正方形", 125 + i * 100, 205, 48, 48),
        p("正方形", 125 + i * 100, 127, 48, 48),
        p("三角形", 125 + i * 100, 79, 48, 48),
      );
    for (let i = 0; i < 4; i++) a.push(p("圆", 135 + i * 112, 273, 42, 42));
    a.push(p("圆", 515, 120, 24, 24), p("圆", 548, 147, 15, 15));
  } else if (id === 2) {
    a = [
      p("三角形", 280, 254, 110, 80, 180),
      p("三角形", 224, 133, 45, 40),
      p("正方形", 180, 210, 44, 44),
      p("正方形", 224, 173, 45, 45),
      p("正方形", 335, 55, 70, 70),
      p("长方形", 125, 185, 35, 16),
      p("长方形", 125, 201, 35, 53),
      p("长方形", 348, 125, 43, 129),
      p("长方形", 391, 231, 65, 23),
      p("圆", 285, 183, 30, 30),
    ];
    // Main cabin is decorative outline; its square counted as a component.
    a.push(p("正方形", 269, 157, 66, 66));
    // The upper square, small deck and tower are the three square pieces (not four).
    a = a.filter((_, i) => i !== 2); // small deck is a rectangle in the source
    a.push(p("长方形", 180, 228, 44, 26));
    // Remove duplicate rear rectangle: four rectangles are mast, flag, deck and rear deck;
    // tall mast and flag pole are represented as one connected rectangular unit.
    a = a.filter((_, i) => i !== 5);
    for (let i = 0; i < 3; i++) a.push(p("圆", 145 + i * 31, 262, 20, 20));
  } else if (id === 3) {
    a = [
      p("长方形", 230, 115, 65, 190),
      p("长方形", 295, 210, 250, 95),
      p("长方形", 545, 150, 85, 155),
      p("长方形", 490, 170, 15, 40),
      p("长方形", 480, 115, 35, 55),
      p("长方形", 80, 270, 50, 35),
      p("正方形", 245, 142, 30, 30),
      p("三角形", 210, 55, 105, 60),
      p("三角形", 535, 80, 105, 70),
    ];
    for (let i = 0; i < 3; i++) a.push(p("三角形", 60, 155 + i * 40, 90, 40));
    a.push(
      p("平行四边形", 330, 250, 65, 22),
      p("平行四边形", 445, 265, 70, 24),
      p("平行四边形", 410, 215, 15, 36),
    );
    for (let i = 0; i < 4; i++)
      a.push(p("圆", 530 + i * 26, 105 - i * 16, 17, 17));
  } else if (id === 4) {
    for (let i = 0; i < 4; i++)
      a.push(p("蓝色三角形", 190 + i * 98, 140, 60, 55));
    a.push(p("绿色三角形", 55, 190, 30, 32, 90));
  } else if (id === 5) {
    a = [
      p("长方形", 100, 200, 260, 65),
      p("长方形", 360, 150, 120, 115),
      p("长方形", 385, 175, 20, 45),
      p("长方形", 440, 175, 25, 72),
      p("正方形", 360, 115, 35, 35),
      p("三角形", 100, 110, 260, 90),
    ];
    for (let i = 0; i < 3; i++) a.push(p("圆", 125 + i * 145, 267, 58, 58));
    a.push(p("圆", 355, 70, 35, 35), p("圆", 305, 45, 24, 24));
  } else {
    a = [
      p("圆", 255, 75, 130, 130),
      p("圆", 225, 100, 35, 35),
      p("圆", 385, 140, 35, 35),
      p("圆", 293, 111, 18, 18),
      p("圆", 338, 133, 18, 18),
      p("三角形", 308, 20, 70, 55),
      p("三角形", 294, 165, 18, 18),
      p("三角形", 245, 210, 130, 65, 180),
      p("三角形", 205, 215, 45, 50),
      p("三角形", 380, 220, 40, 65),
      p("三角形", 245, 265, 120, 55),
      p("长方形", 230, 315, 30, 70, 30),
      p("长方形", 355, 315, 30, 70, -42),
    ];
  }
  return a.map((v, i) => ({ ...v, id: `piece-${i}` }));
}
export function defaults(id: number): Field[] {
  if (id <= 6)
    return shapeCounts[id].map(([kind, n], i) => ({
      key: `s${i}`,
      label: `${kind}数量`,
      value: n,
      min: 1,
      max: 10,
    }));
  const f = (key: string, label: string, value: number, min = 1, max = 24) => ({
    key,
    label,
    value,
    min,
    max,
  });
  if (id === 7 || id === 8)
    return [
      f("total", "队伍总数", id === 7 ? 7 : 6, 3, 12),
      f("target", "从前数的位置", id === 7 ? 5 : 4, 1, 12),
    ];
  if (id === 9 || id === 10)
    return [
      f("target", "主角从前数的位置", 2, 1, 4),
      f("direction", "行进方向：0向左，1向右", 0, 0, 1),
    ];
  if (id === 11) return [f("extra", "追加正方体数量", 0, 0, 5)];
  if (id === 12)
    return [f("a", "左边球数", 6, 1, 12), f("b", "右边球数", 8, 1, 12)];
  if (id === 13)
    return [f("a", "剩下的鸡蛋", 11, 1, 20), f("b", "吃掉的鸡蛋", 6, 1, 12)];
  if (id === 14)
    return [f("a", "要来的总人数", 17, 2, 30), f("b", "已有的椅子", 6, 1, 29)];
  if (id === 15)
    return [f("a", "两车总人数", 18, 2, 30), f("b", "小汽车人数", 4, 1, 6)];
  const prices =
    id === 16
      ? [38, 21, 5, 10, 10, 15]
      : id === 17
        ? [10, 8, 5, 3, 1, 15]
        : id === 18
          ? [13, 6, 68, 26]
          : id === 19
            ? [4, 7, 6, 8]
            : id === 20
              ? [30, 21, 5]
              : [22, 32, 44];
  const fields = prices.map((v, i) =>
    f(`p${i}`, `商品${i + 1}单价（元）`, v, 1, 99),
  );
  if (id <= 17)
    fields.push(
      f("threshold", "满减门槛（元）", id === 16 ? 30 : 18, 2, 200),
      f("discount", "减免金额（元）", id === 16 ? 5 : 3, 1, 99),
    );
  return fields;
}
export function validate(id: number, values: Record<string, number>): string[] {
  const errors = defaults(id)
    .filter(
      (f) =>
        !Number.isInteger(values[f.key]) ||
        values[f.key] < f.min ||
        values[f.key] > f.max,
    )
    .map((f) => `${f.label}应为${f.min}～${f.max}的整数。`);
  if (id <= 6 && Object.values(values).reduce((a, b) => a + b, 0) > 40)
    errors.push("图形总数请控制在40个以内。");
  if ((id === 7 || id === 8) && values.target > values.total)
    errors.push("位置不能超过队伍总数。");
  if ((id === 14 || id === 15) && values.b >= values.a)
    errors.push("已有部分应小于总数。");
  if ((id === 16 || id === 17) && values.discount > values.threshold)
    errors.push("减免不能超过门槛。");
  if (
    (id === 16 || id === 17) &&
    Math.max(...Array.from({ length: 6 }, (_, i) => values[`p${i}`])) * 3 <
      values.threshold
  )
    errors.push("至少要有一种购买1～3件可参加满减的方案。");
  return errors;
}
export const defaultValues = (id: number) =>
  Object.fromEntries(defaults(id).map((f) => [f.key, f.value]));
const task = (
  id: string,
  prompt: string,
  answer: string | number,
  hint: string,
  explanation: string,
  extra: Partial<Task> = {},
): Task => ({
  id,
  prompt,
  answer: String(answer),
  hint,
  explanation,
  ...extra,
});
const people = ["小兵", "小玉", "小东", "小云", "小平", "小华"];
const animal = (name: string, icon: string, i: number): Item => ({
  id: "item-" + i,
  name,
  icon,
});
export function buildLesson(
  id: number,
  values = defaultValues(id),
  variant = false,
): Lesson {
  const v = { ...values };
  if (variant) {
    if (id <= 6) {
      const first = "s0";
      v[first] = v[first] === 10 ? 9 : v[first] + 1;
    } else if (id === 7 || id === 8) {
      v.target = v.target === 1 ? 2 : v.target - 1;
    } else if (id === 9 || id === 10) {
      v.direction = 1 - v.direction;
      v.target = v.target === 4 ? 3 : v.target + 1;
    } else if (id === 11) v.extra = (v.extra + 1) % 6;
    else if (id <= 15) {
      v.a = v.a === defaults(id)[0].max ? v.a - 1 : v.a + 1;
      if ((id === 14 || id === 15) && v.b >= v.a) v.b = Math.max(1, v.a - 1);
    } else {
      for (const key of id === 16
        ? ["p1", "p4"]
        : id === 17
          ? ["p0", "p3"]
          : ["p0"])
        v[key] = v[key] === 99 ? 98 : v[key] + 1;
    }
  }
  const title = catalog[id - 1][0],
    topic = catalog[id - 1][1];
  let scene: Scene,
    tasks: Task[] = [],
    summary = "";
  if (id <= 6) {
    const counts = shapeCounts[id].map(
      ([k], i) => [k, v[`s${i}`]] as [Shape, number],
    );
    const original =
      !variant && defaults(id).every((f) => v[f.key] === f.value);
    const pieces = original
      ? originalPieces(id)
      : counts
          .flatMap(([kind, n], g) =>
            Array.from({ length: n }, (_, i) =>
              p(
                kind,
                0,
                0,
                kind === "长方形" ? 42 : 30,
                kind === "长方形" ? 23 : 30,
              ),
            ),
          )
          .map((o, i) => ({
            ...o,
            id: "piece-" + i,
            x: 40 + (i % 10) * 60,
            y: 55 + Math.floor(i / 10) * 80,
          }));
    scene = { type: "pieces", pieces, title, original };
    tasks = counts.map(([kind, n], i) =>
      task(
        "count-" + i,
        `图中有多少个${kind}？`,
        n,
        "先认准一种图形，点一下做记号，按顺序数，已经数过的不要再数。",
        `把${kind}移到同一排，逐个点数，一共有${n}个。`,
        { focus: kind },
      ),
    );
    if (id === 4)
      tasks.push(
        task(
          "all",
          "两种颜色的三角形一共有多少个？",
          pieces.length,
          "两种颜色都要数，检查有没有漏掉绿色的小三角形。",
          `${counts[0][1]}＋${counts[1][1]}＝${pieces.length}。`,
        ),
      );
    summary =
      "先认形状，再按顺序做记号。只数拼图的基本部件，不把几块拼成的大轮廓重复算一次；本题正方形和非正方形长方形分开统计。";
  } else if (id <= 10) {
    let items: Item[],
      target = v.target - 1,
      direction: "left" | "right" = "right";
    if (id === 7)
      items = Array.from({ length: v.total }, (_, i) =>
        animal(
          ["小鸡", "小狗", "小猴", "小兔", "小鹿", "熊猫", "大象"][i] ??
            `动物${i + 1}`,
          ["🐤", "🐶", "🐵", "🐰", "🦌", "🐼", "🐘"][i % 7],
          i,
        ),
      );
    else if (id === 8) {
      direction = "left";
      items = Array.from({ length: v.total }, (_, i) =>
        animal(people[i] ?? `伙伴${i + 1}`, "🧒", i),
      );
    } else {
      direction = v.direction ? "right" : "left";
      const names =
        id === 9
          ? ["小狗", "小马", "小猫", "蜗牛"]
          : ["小鸡", "小鸭", "孔雀", "小鹅"];
      const icons =
        id === 9 ? ["🐶", "🐴", "🐱", "🐌"] : ["🐤", "🦆", "🦚", "🪿"];
      items = names.map((name, i) => animal(name, icons[i], i));
    }
    scene = { type: "line", items, direction, target, race: id >= 9 };
    const name = items[target].name,
      before = items.slice(0, target),
      after = items.slice(target + 1),
      options = items.map((i) => i.name);
    if (id === 8)
      tasks.push(
        task(
          "who",
          `队伍共有${items.length}人，哪位小朋友后面有${after.length}人？`,
          name,
          "先看行进箭头。后面的人不包括这位小朋友自己。",
          `从队尾往前检查，${name}后面正好有${after.length}人。`,
          { options, pick: [items[target].id] },
        ),
      );
    else if (id === 7)
      tasks.push(
        task(
          "front",
          `${name}的前面有几只动物？`,
          before.length,
          "先找箭头指向的队头，再看主角前面；不包括主角。",
          `${name}前面有${before.length}只动物。`,
        ),
        task(
          "back",
          `${name}的后面有几只动物？`,
          after.length,
          "只数主角后面的动物，主角自己不算。",
          `${name}后面有${after.length}只动物。`,
        ),
      );
    else
      tasks.push(
        task(
          "front-who",
          `${name}前面有哪些动物？选齐后提交。`,
          before.map((i) => i.name).join("、") || "没有",
          "前是行进箭头指向的一边；不是永远在画面左边。",
          `${name}前面是${before.map((i) => i.name).join("、") || "没有动物"}。`,
          { pick: before.map((i) => i.id) },
        ),
        task(
          "back-who",
          `${name}后面有哪些动物？选齐后提交。`,
          after.map((i) => i.name).join("、") || "没有",
          "先找到主角，再向行进箭头相反的方向检查。",
          `${name}后面是${after.map((i) => i.name).join("、") || "没有动物"}。`,
          { pick: after.map((i) => i.id) },
        ),
      );
    tasks.push(
      task(
        "leader",
        "谁走在最前面？",
        items[0].name,
        "最前面的伙伴，前面没有其他伙伴。",
        `${items[0].name}在队头。`,
        { options, pick: [items[0].id] },
      ),
      task(
        "last",
        "谁走在最后面？",
        items.at(-1)!.name,
        "最后面的伙伴，后面没有其他伙伴。",
        `${items.at(-1)!.name}在队尾。`,
        { options, pick: [items.at(-1)!.id] },
      ),
    );
    summary = "先判断行进方向，再找队头和队尾。前面、后面的人数都不包括自己。";
  } else if (id === 11) {
    const kinds = [
      "球",
      "长方体",
      "球",
      "长方体",
      "球",
      "正方体",
      "正方体",
      "长方体",
      "正方体",
      "正方体",
      "圆柱",
      "正方体",
      ...Array.from({ length: v.extra }, () => "正方体"),
    ];
    const items = kinds.map((kind, i) => ({
      id: "solid-" + i,
      name: `${kind}${i + 1}`,
      icon: kind,
      kind,
    }));
    scene = { type: "solids", items };
    const boxes = items.filter(
        (i) => i.kind === "长方体" || i.kind === "正方体",
      ).length,
      cyl = items.findIndex((i) => i.kind === "圆柱");
    tasks = [
      task(
        "boxes",
        "长方体和正方体一共有几个？",
        boxes,
        "只选这两类，球和圆柱不算进去。",
        `两类积木合起来有${boxes}个。`,
      ),
      task(
        "left",
        "从左边数，圆柱排第几？",
        cyl + 1,
        "从左边第一个物体开始数，圆柱本身也要数。",
        `从左数，圆柱第${cyl + 1}。`,
      ),
      task(
        "right",
        "从右边数，圆柱排第几？",
        items.length - cyl,
        "换到右边开始数，物体位置不变。",
        `从右数，圆柱第${items.length - cyl}。`,
      ),
      task(
        "balls",
        "球有几个？",
        3,
        "给球做记号，不要把圆柱圆圆的顶面当成球。",
        "球有3个。",
      ),
      task(
        "difference",
        "球比圆柱多几个？",
        2,
        "让一个球和一个圆柱配成一对，看看还剩几个球。",
        "3－1＝2。",
      ),
      task(
        "pick",
        "点选左边第4个物体，再提交。",
        "长方体4",
        "从左向右，一个位置一个位置数。",
        "左边第4个是长方体。",
        { pick: ["solid-3"] },
      ),
    ];
    summary = "形状分类和位置计数是两件事。数第几个时，所有物体都要经过。";
  } else if (id <= 15) {
    const a = v.a,
      b = v.b;
    scene = {
      type: "quantity",
      kind: ({ 12: "balls", 13: "eggs", 14: "chairs", 15: "bus" } as const)[
        id as 12 | 13 | 14 | 15
      ],
      a,
      b,
    };
    if (id === 12)
      tasks = [
        task(
          "total",
          "两边一共有多少个球？",
          a + b,
          "把左右两堆合在一起，每个球只数一次。",
          `${a}＋${b}＝${a + b}。`,
        ),
        task(
          "kind",
          "换成按球的种类分组，总数是多少？",
          a + b,
          "移动位置没有增加或拿走球。",
          "分类方式变了，总数不变。",
        ),
      ];
    if (id === 13)
      tasks = [
        task(
          "original",
          `还剩${a}枚鸡蛋，吃了${b}枚。原来有多少枚？`,
          a + b,
          "“原来”要把吃掉的那一部分也放回去。",
          `${a}＋${b}＝${a + b}枚。`,
        ),
      ];
    if (id === 14)
      tasks = [
        task(
          "missing",
          `要来${a}人，每人一把椅子，已有${b}把。还需要几把？`,
          a - b,
          "先给已有的椅子各配一位小朋友，看看谁还没椅子。",
          `${a}－${b}＝${a - b}把。`,
        ),
      ];
    if (id === 15)
      tasks = [
        task(
          "bus",
          `两车共有${a}人，小汽车${b}人，大巴有几人？`,
          a - b,
          "总人数由大巴和小汽车两部分组成，不能再把小汽车加一次。",
          `${a}－${b}＝${a - b}人。`,
        ),
      ];
    summary =
      id === 12
        ? "同一批球，按位置或按种类分类，总数都不变。"
        : id === 13
          ? "原来的数量＝剩下的数量＋拿走的数量。"
          : "总数＝已知部分＋未知部分；求未知部分，用总数减去已知部分。";
  } else {
    const names =
      id === 16
        ? ["松树", "圆冠树", "小树苗", "苹果树", "梨树", "椰子树"]
        : id === 17
          ? [
              "巧克力杯",
              "草莓筒",
              "粉色冰淇淋",
              "蓝色冰淇淋",
              "冰棒",
              "黄色蛋糕",
            ]
          : id === 18
            ? ["文具盒", "笔记本", "书包", "彩笔"]
            : id === 19
              ? ["梨", "葡萄", "苹果", "荔枝"]
              : id === 20
                ? ["飞机", "火箭", "小汽车"]
                : ["乒乓球拍", "网球拍", "羽毛球拍"];
    const icons =
      id === 16
        ? ["🌲", "🌳", "🌱", "🌳", "🌳", "🌴"]
        : id === 17
          ? ["🍨", "🍦", "🍧", "🍦", "🧊", "🧁"]
          : id === 18
            ? ["👝", "📒", "🎒", "🖍️"]
            : id === 19
              ? ["🍐", "🍇", "🍎", "🍒"]
              : id === 20
                ? ["🛩️", "🚀", "🚗"]
                : ["🏓", "🎾", "🏸"];
    const items = names.map((name, i) => ({
      id: "goods-" + i,
      name,
      icon: icons[i],
      price: v["p" + i],
    }));
    scene = {
      type: "shop",
      items,
      repeat: id <= 17 || id === 21,
      ...(id <= 17 ? { threshold: v.threshold, discount: v.discount } : {}),
    };
    if (id <= 17) {
      const threshold = v.threshold,
        discount = v.discount;
      const payment = (n: number) => (n >= threshold ? n - discount : n);
      const c1 = id === 16 ? [0, 1, 1, 0, 0, 0] : [1, 0, 1, 0, 0, 0],
        c2 = id === 16 ? [0, 0, 0, 0, 2, 1] : [0, 0, 0, 1, 0, 1];
      const total = (counts: number[]) =>
        counts.reduce((n, c, i) => n + c * items[i].price!, 0);
      const plan = (cs: number[]) =>
        cs.flatMap((c, i) => (c ? [`${c}件${items[i].name}`] : [])).join("和");
      tasks = [
        task(
          "purchase1",
          id === 16
            ? `选${plan(c1)}，应付多少元？`
            : `选${plan(c1)}，够参加满减吗？`,
          id === 16
            ? payment(total(c1))
            : total(c1) >= threshold
              ? "够"
              : "不够",
          "先算商品总价，再判断有没有达到满减门槛；“满”包括刚好相等。",
          `总价${total(c1)}元，${total(c1) >= threshold ? "达到" : "没有达到"}${threshold}元；应付${payment(total(c1))}元。`,
          {
            basket: "specified",
            counts: c1,
            ...(id === 17 ? { options: ["够", "不够"] } : {}),
          },
        ),
        task(
          "purchase2",
          `选${plan(c2)}，应付多少元？`,
          payment(total(c2)),
          "先把每件商品的钱加起来。达到门槛才减一次优惠金额。",
          `总价${total(c2)}元，应付${payment(total(c2))}元。`,
          { basket: "specified", counts: c2 },
        ),
        task(
          "open-plan",
          "自己选1～3件商品，设计一个达到满减门槛的方案。选好后填实际应付金额。",
          "dynamic",
          "可以重复买同一款。检查总价是否达到门槛，再算应付金额。",
          "这是开放题，方案不唯一；总价达到门槛，并正确减去一次优惠即可。",
          { basket: "offer" },
        ),
      ];
      summary =
        "先求总价，再与门槛比较，达到（包括等于）才减免。本实验按每笔订单减一次，不是每满一次都减。";
    } else {
      const prices = items.map((i) => i.price!).sort((a, b) => a - b),
        repeat = id === 21;
      const min = repeat ? prices[0] * 2 : prices[0] + prices[1],
        max = repeat ? prices.at(-1)! * 2 : prices.at(-1)! + prices.at(-2)!;
      tasks = [
        task(
          "minimum",
          `买${id === 21 ? "两副球拍，可以同款" : "两件不同商品"}，最少花多少元？`,
          min,
          repeat
            ? "题目允许买同款，试试都选便宜的。"
            : "先比较单价，选出两件较便宜的不同商品。",
          `最少花${min}元。`,
          { basket: "min" },
        ),
        task(
          "maximum",
          `买${id === 21 ? "两副球拍，可以同款" : "两件不同商品"}，最多花多少元？`,
          max,
          repeat
            ? "允许买同款，试试都选贵的。"
            : "必须不同，不能把最贵的商品买两次。",
          `最多花${max}元。`,
          { basket: "max" },
        ),
      ];
      summary = repeat
        ? "两副球拍可以同款：最少买两副最便宜的，最多买两副最贵的。"
        : "读清“不同”这个条件：最少选两种便宜的，最多选两种贵的。不能重复买同一款。";
    }
  }
  return {
    id,
    title,
    topic,
    story:
      id <= 6
        ? "拼图里藏着哪些基本图形？先看整体，再把部件分开，亲手做记号，检查有没有重复或遗漏。"
        : id <= 11
          ? "看清行进箭头或题目要求的左右方向。物体会移动、归位，再请你亲手找线索。"
          : id <= 15
            ? "每一个小物体都代表一个真实数量。移动、配对、合并，找出已知部分和未知部分。"
            : "先读清购买条件，再亲手选商品。每件商品的单价保持可见，试着找到自己的购买方案。",
    scene,
    tasks,
    summary,
    ...(id === 2
      ? {
          sourceNote:
            "轮船底部有两个三角区域；本动画按答案页的基本部件分类重绘，不额外统计组合外轮廓。",
        }
      : {}),
  };
}
export function basketTotal(
  scene: Extract<Scene, { type: "shop" }>,
  counts: number[],
) {
  return scene.items.reduce(
    (n, item, i) => n + (counts[i] ?? 0) * item.price!,
    0,
  );
}
export function payable(
  scene: Extract<Scene, { type: "shop" }>,
  counts: number[],
) {
  const total = basketTotal(scene, counts);
  return total >= (scene.threshold ?? Infinity)
    ? total - (scene.discount ?? 0)
    : total;
}
export function checkTask(
  lesson: Lesson,
  t: Task,
  answer: string,
  selected: string[],
  counts: number[],
): boolean {
  if (t.pick) {
    const a = [...selected].sort(),
      b = [...t.pick].sort();
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }
  if (t.basket && lesson.scene.type === "shop") {
    const s = lesson.scene,
      n = counts.reduce((a, b) => a + b, 0),
      total = basketTotal(s, counts);
    if (
      counts.length !== s.items.length ||
      counts.some((c) => !Number.isInteger(c) || c < 0 || (!s.repeat && c > 1))
    )
      return false;
    if (t.basket === "specified" && !t.counts!.every((c, i) => counts[i] === c))
      return false;
    if (t.basket === "offer")
      return (
        n >= 1 &&
        n <= 3 &&
        total >= s.threshold! &&
        Number(answer.trim()) === payable(s, counts) &&
        answer.trim() !== ""
      );
    if (
      (t.basket === "min" || t.basket === "max") &&
      (n !== 2 || total !== Number(t.answer))
    )
      return false;
  }
  return (
    answer.trim() !== "" &&
    (answer.trim() === t.answer ||
      !!t.accepted?.includes(answer.trim()) ||
      (!Number.isNaN(Number(t.answer)) &&
        Number(answer.trim()) === Number(t.answer)))
  );
}
export function observation(scene: Scene) {
  if (scene.type === "extension") return scene.frames;
  return [
    {
      text:
        scene.type === "line"
          ? `先看箭头，队伍向${scene.direction === "left" ? "左" : "右"}前进，伙伴依次进入场景。`
          : scene.type === "pieces"
            ? "每一块部件都有自己的位置，先观察拼成的整体。"
            : scene.type === "quantity"
              ? "先看看题目里的每一部分，各由哪些小物体组成。"
              : scene.type === "solids"
                ? "积木依次入场。注意球、圆柱、长方体和正方体。"
                : "商品走进货架。先看清单价和购买条件。",
      duration: 1800,
    },
    {
      text:
        scene.type === "pieces"
          ? "把基本部件轻轻分开，相同形状移到同一排，看看哪些容易漏数。"
          : scene.type === "quantity"
            ? "看物体移动和配对，想一想要求的是总数，还是其中一部分。"
            : scene.type === "line"
              ? "停在这一刻。先确定谁在队头，再判断主角的前面和后面。"
              : "准备好亲手点选和比较了吗？接下来先自己试一试。",
      duration: 2200,
    },
  ];
}

/** A concrete demonstration plan; used only after the child explicitly reaches full explanation. */
export function demonstrationCounts(
  scene: Extract<Scene, { type: "shop" }>,
  t: Task,
): number[] {
  if (t.counts) return [...t.counts];
  const counts = scene.items.map(() => 0);
  const order = scene.items
    .map((item, i) => ({ price: item.price!, i }))
    .sort((a, b) =>
      t.basket === "min" ? a.price - b.price : b.price - a.price,
    );
  if (t.basket === "offer")
    counts[order[0].i] = Math.max(
      1,
      Math.ceil(scene.threshold! / order[0].price),
    );
  else {
    counts[order[0].i]++;
    counts[scene.repeat ? order[0].i : order[1].i]++;
  }
  return counts;
}

/** Practice after help is separate from the later independent assessment. */
export function buildRetryLesson(
  id: number,
  values: Record<string, number>,
): Lesson {
  const original = buildLesson(id, values),
    transfer = buildLesson(id, values, true);
  const taskSignature = (q: Task) =>
    JSON.stringify({
      prompt: q.prompt,
      answer: q.answer,
      pick: q.pick,
      counts: q.counts,
    });
  const seen = new Set(
    [...original.tasks, ...transfer.tasks].map(taskSignature),
  );
  for (const field of defaults(id))
    for (let n = field.min; n <= field.max; n++) {
      const candidate = { ...values, [field.key]: n };
      if (validate(id, candidate).length) continue;
      const retry = buildLesson(id, candidate);
      if (
        JSON.stringify(retry.scene) === JSON.stringify(original.scene) ||
        JSON.stringify(retry.scene) === JSON.stringify(transfer.scene)
      )
        continue;
      const fresh = retry.tasks.find(
        (t) => t.answer !== "dynamic" && !seen.has(taskSignature(t)),
      );
      if (fresh) return { ...retry, tasks: [fresh] };
    }
  throw new Error("This lesson needs a separate valid practice model.");
}
