import { levels, patterns, type Level, type Question } from "./data";
import {
  defaults,
  queueCatalog,
  validateSettings,
  type Settings,
  type LessonModel,
  type QueueConfig,
} from "./models";
import { solveQueue, queueStory, transferQueue, validateQueue } from "./queue";
function question(
  id: string,
  prompt: string,
  answer: string | number,
  hints: [string, string, string],
  explanation: string,
  extra: Partial<Question> = {},
): Question {
  return {
    id,
    prompt,
    answer: String(answer),
    hints,
    explanation,
    error: "数量关系：" + id,
    retry: {
      prompt: "先试一小题：5个人，小明从前第2，从后第几？",
      answer: "4",
    },
    ...extra,
  };
}
export function makeAnimals(c: Settings["detective"]) {
  return [
    ["b", c.butterflies, "蝴蝶", "天上飞", "🦋"],
    ["d", c.dragonflies, "蜻蜓", "天上飞", "蜻蜓"],
    ["f", c.fish, "鱼", "水里游", "🐟"],
  ].flatMap(([prefix, count, kind, habitat, icon]) =>
    Array.from({ length: Number(count) }, (_, i) => ({
      id: String(prefix) + i,
      kind: String(kind),
      habitat: String(habitat),
      icon: String(icon),
    })),
  );
}
export function makePatterns(count: number) {
  if (count === 12) return patterns;
  const colors = ["红色", "蓝色", "黄色"],
    forms = ["圆形", "三角形", "正方形"];
  return Array.from({ length: count }, (_, i) => ({
    id: "p" + i,
    color: colors[i % 3],
    form: forms[(i + Math.floor(i / 3)) % 3],
  }));
}
export function lessonModels(settings: Settings): {
  model: LessonModel;
  transferModel: LessonModel;
} {
  const model = structuredClone(settings),
    transferModel = structuredClone(settings);
  const s = settings.shop;
  const candidates = [
    { count: s.price, price: s.count, groups: s.groups },
    { count: 3, price: 4, groups: 2 },
    ...Array.from({ length: 5 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => ({
        count: i + 2,
        price: j + 1,
        groups: s.groups,
      })),
    ).flat(),
  ];
  transferModel.shop = candidates.find(
    (v) =>
      v.count >= 2 &&
      v.count <= 6 &&
      v.price <= 6 &&
      v.count * v.price <= 24 &&
      (v.count * v.price) % v.groups === 0 &&
      JSON.stringify(v) !== JSON.stringify(s),
  )!;
  transferModel.shapes = {
    stars: 2,
    triangles: 3,
    starValue:
      settings.shapes.starValue === 8 ? 7 : settings.shapes.starValue + 1,
    triangleValue: settings.shapes.triangleValue,
  };
  transferModel.square = {
    rank: settings.square.rank === 1 ? 2 : settings.square.rank - 1,
  };
  return { model, transferModel };
}
function buildRawLevel(
  id: keyof Settings,
  settings: Settings = defaults,
): Level {
  const base = levels.find((l) => l.id === id)!;
  const models = lessonModels(settings),
    { model: m, transferModel: t } = models;
  if (JSON.stringify(settings[id]) === JSON.stringify(defaults[id]))
    return { ...base, ...models };
  if (id === "shop") {
    const { count, price, groups } = m.shop,
      total = count * price,
      each = total / groups,
      ts = t.shop,
      tt = ts.count * ts.price;
    return {
      ...base,
      ...models,
      story: `阳阳买了${count}只玩具，每只${price}元。乐乐花同样的钱买了${groups}只玩具。每只多少钱？`,
      questions: [
        question(
          "total",
          "阳阳一共花了多少钱？",
          total,
          [
            "每只玩具付几枚金币？",
            "看着玩具入篮，每次增加同样多的金币。",
            `${count}×${price}＝${total}元。`,
          ],
          `${count}组，每组${price}元，总钱数是${total}元。`,
          {
            retry: {
              prompt: `2只玩具，每只${price}元，一共几元？`,
              answer: String(2 * price),
            },
          },
        ),
        question(
          "meaning",
          `为什么不能把${total}元直接当成乐乐每只玩具的价格？`,
          `${total}元是${groups}只玩具的总价`,
          [
            "这笔钱买的是一只，还是全部玩具？",
            "看一看：同一笔钱要分给几个玩具？",
            "总价是合起来的钱，单价是每只玩具的钱。",
          ],
          `总价相同，还要平均分给${groups}只玩具。`,
          {
            options: [
              `${total}元是${groups}只玩具的总价`,
              `${total}元就是一只玩具的价格`,
            ],
            retry: { prompt: "两只玩具合起来8元，每只几元？", answer: "4" },
          },
        ),
        question(
          "share",
          `把${total}枚金币平均分给${groups}只玩具，再回答每只多少钱？`,
          each,
          [
            "总钱数和每只的价格一样吗？检查有没有剩下的金币。",
            "轮流分，每只每次得到1枚。全部分完后，每份应该一样多。",
            `${total}÷${groups}＝${each}元。`,
          ],
          `${groups}份，每份${each}枚；${groups}×${each}＝${total}。`,
          {
            interaction: "coins",
            retry: {
              prompt: `${groups * 2}枚金币平均分给${groups}只玩具，每只几枚？`,
              answer: "2",
            },
          },
        ),
      ],
      transfer: [
        question(
          "shop-transfer",
          `新任务：${ts.count}个玩具，每个${ts.price}元。同样的钱买${ts.groups}个玩具，每个多少钱？`,
          tt / ts.groups,
          [
            "先算总价，再平均分。",
            "画出所有金币，试着分成相同的几份。",
            `${ts.count}×${ts.price}＝${tt}，${tt}÷${ts.groups}＝${tt / ts.groups}。`,
          ],
          `先求总价，再求每只价格：${tt / ts.groups}元。`,
        ),
      ],
    };
  }
  if (id === "shapes") {
    const s = m.shapes,
      a = s.starValue,
      b = s.triangleValue,
      ta = t.shapes.starValue,
      tb = t.shapes.triangleValue;
    return {
      ...base,
      ...models,
      story: `${s.stars}颗相同星星合起来是${s.stars * a}，${s.triangles}个相同三角形合起来是${s.triangles * b}。先公平分配，再计算。`,
      questions: [
        question(
          "star",
          `${s.stars}颗星星合起来是${s.stars * a}，一颗代表几？`,
          a,
          [
            "相同图形表示相同的数。",
            "把能量点平均分给所有星星。",
            `${s.stars * a}÷${s.stars}＝${a}。`,
          ],
          `☆＝${a}。`,
        ),
        question(
          "triangle",
          `${s.triangles}个三角形合起来是${s.triangles * b}，一个代表几？`,
          b,
          [
            "每份应一样多。",
            "观察每个三角形得到的能量点。",
            `${s.triangles * b}÷${s.triangles}＝${b}。`,
          ],
          `△＝${b}。`,
        ),
        question(
          "sum",
          "☆＋△＝？先看清符号。",
          a + b,
          [
            "加法是把两份合起来。",
            "把两种颜色的能量点合并，逐个数。",
            `${a}＋${b}＝${a + b}。`,
          ],
          `两份合起来：${a}＋${b}＝${a + b}。`,
        ),
        question(
          "product",
          "☆×△＝？",
          a * b,
          [
            "乘号表示几组同样多。",
            "看一共有几组，每组有几个。",
            `${a}×${b}＝${a * b}。`,
          ],
          `${a}组，每组${b}个，共${a * b}个。`,
        ),
      ],
      transfer: [
        question(
          "shape-transfer-sum",
          `○＋○＝${ta * 2}，□＋□＋□＝${tb * 3}。○＋□＝？`,
          ta + tb,
          [
            "先分别求每个图形代表几。",
            "把一份圆和一份方块的点合起来。",
            `○＝${ta}，□＝${tb}，和是${ta + tb}。`,
          ],
          `${ta}＋${tb}＝${ta + tb}。`,
        ),
        question(
          "shape-transfer-product",
          "同样的○和□，○×□＝？",
          ta * tb,
          ["看清这是乘号。", "画几组同样多的点。", `${ta}×${tb}＝${ta * tb}。`],
          `${ta}组，每组${tb}个。`,
        ),
      ],
    };
  }
  if (id === "detective") {
    const s = m.detective,
      total = s.butterflies + s.dragonflies + s.fish,
      air = s.butterflies + s.dragonflies,
      pc = s.patternCount;
    const animalQ = (
      interaction: "animals" | "habitat",
      prompt: string,
      exp: string,
    ) =>
      question(
        interaction,
        prompt,
        "完成",
        [
          `一共有${total}位朋友，现在找到了多少？`,
          "突出未分类的朋友，再检查分类标准。",
          exp,
        ],
        exp,
        { interaction },
      );
    const patternQ = (interaction: "color" | "form", id: string) =>
      question(
        id,
        `把${pc}个图案按${interaction === "color" ? "颜色" : "形状"}分类，最后检查总数。`,
        "完成",
        [
          "先说出这次的分类标准。",
          "逐个检查，不遗漏、不重复。",
          `每类${pc / 3}个，合起来${pc}个。`,
        ],
        `分类标准变了，总数仍是${pc}。`,
        { interaction },
      );
    return {
      ...base,
      ...models,
      story: `${total}位动物朋友来聚会：请先按种类，再按生活环境分类。`,
      questions: [
        animalQ(
          "animals",
          `按种类把${total}位朋友分类，然后检查。`,
          `${s.butterflies}＋${s.dragonflies}＋${s.fish}＝${total}。`,
        ),
        animalQ(
          "habitat",
          "换个标准：按生活环境分类。",
          `${air}＋${s.fish}＝${total}。`,
        ),
      ],
      transfer: [
        patternQ("color", "patterns-color"),
        patternQ("form", "patterns-form"),
      ],
    };
  }
  const rank = m.square.rank,
    side = 2 * rank - 1,
    tr = t.square.rank,
    ts = 2 * tr - 1;
  return {
    ...base,
    ...models,
    story: `中间的小朋友从四个方向数都是第${rank}个。实心正方形队伍有多少人？`,
    questions: [
      question(
        "side",
        `中间的人从两边数都是第${rank}个，一边有几人？`,
        side,
        [
          "中间的人只数一次。",
          "把两个方向的计数放在一起，看看哪里重合。",
          `${rank}＋${rank}－1＝${side}。`,
        ],
        `${rank - 1}＋1＋${rank - 1}＝${side}。`,
      ),
      question(
        "square-total",
        `实心方阵每行${side}人，一共多少人？`,
        side * side,
        [
          "里面也站着小朋友。",
          "一行一行数，再看共有几行。",
          `${side}×${side}＝${side * side}。`,
        ],
        `每行${side}人，${side}行，共${side * side}人。`,
      ),
    ],
    transfer: [
      question(
        "square-transfer",
        `新队伍：从四个方向数，中间的人都是第${tr}个，一共多少人？`,
        ts * ts,
        [
          "先数一行，再数行数。",
          "中间的人只能算一次。",
          `${tr}＋${tr}－1＝${ts}，${ts}×${ts}＝${ts * ts}。`,
        ],
        `${ts}行${ts}列，共${ts * ts}人。`,
      ),
    ],
  };
}
export function buildLevel(
  id: keyof Settings,
  settings: Settings = defaults,
): Level {
  const errors = validateSettings(id, settings[id]);
  if (errors.length) throw Error(errors.join(" "));
  const level = buildRawLevel(id, settings);
  const errorName = {
    shop: "总价与单价关系",
    shapes: "图形代表值或运算",
    detective: "分类标准或遗漏",
    square: "方阵行列或中心重复计数",
  }[id];
  for (const q of [...level.questions, ...level.transfer])
    if (q.error.startsWith("数量关系：")) q.error = errorName;
  const retry: Record<keyof Settings, Question["retry"]> = {
    shop: { prompt: "6枚金币平均分成2份，每份几枚？", answer: "3" },
    shapes: { prompt: "3＋2＝？", answer: "5" },
    detective: { prompt: "2只蝴蝶和3条鱼，一共几位朋友？", answer: "5" },
    square: { prompt: "2行，每行3人，一共几人？", answer: "6" },
  };
  return {
    ...level,
    questions: level.questions.map((q) =>
      q.retry.prompt.startsWith("先试一小题：5个人")
        ? { ...q, retry: retry[id] }
        : q,
    ),
    transfer: level.transfer.map((q) =>
      q.retry.prompt.startsWith("先试一小题：5个人")
        ? { ...q, retry: retry[id] }
        : q,
    ),
  };
}
export function buildQueueLevel(c: QueueConfig): Level {
  const errors = validateQueue(c);
  if (errors.length) throw Error(errors.join(" "));
  const solutions = solveQueue(c),
    n = c.numbers,
    solution = solutions[0];
  const answer = solutions
    .map((s) => s.answer)
    .sort((a, b) => a - b)
    .join("、");
  const explanation = solutions.map((s) => s.equation).join("；");
  const title = queueCatalog.find((v) => v.kind === c.kind)!.title;
  const make = (
    id: string,
    prompt: string,
    result: string | number,
    hints: [string, string, string],
    detail = explanation,
  ) =>
    question(id, prompt, result, hints, detail, {
      answerKind: c.kind === "missing" ? "set" : undefined,
    });
  const questions: Question[] = [];
  if (c.kind === "rectangle") {
    const cols = n.left + n.right - 1,
      rows = n.frontRank + n.backRank - 1;
    questions.push(
      make(
        "queue-columns",
        "每一行一共有多少人？",
        cols,
        [
          "左右数到的是同一个人。",
          "把左右两边的名次接在一起，中间重合一次。",
          `${n.left}＋${n.right}－1＝${cols}。`,
        ],
        `${n.left}＋${n.right}－1＝${cols}，每行${cols}人。`,
      ),
    );
    questions.push(
      make(
        "queue-rows",
        "一共有多少行？",
        rows,
        [
          "从前后数，也数到了同一个人。",
          "看中间那一列，前后计数重合一次。",
          `${n.frontRank}＋${n.backRank}－1＝${rows}。`,
        ],
        `${n.frontRank}＋${n.backRank}－1＝${rows}，共有${rows}行。`,
      ),
    );
  }
  questions.push(
    make(
      "queue-" + c.kind,
      c.kind === "swap"
        ? queueStory(c).replace("从前、从后各排第几？", "从前排第几？")
        : queueStory(c),
      answer,
      [
        c.kind === "missing"
          ? "先想谁在前；题目没说明时，检查两种顺序。"
          : c.kind === "between" || c.kind === "same-direction"
            ? "先统一计数方向；中间不包括两位端点。"
            : c.kind === "rectangle"
              ? "不能只数边框，里面也站满了人。"
              : c.kind === "change"
                ? "只看小明前面的人：加入了几位？离开了几位？"
                : c.kind === "swap"
                  ? "位置交换了，名字没有交换。"
                  : "从两头数到同一个人时，别重复算，也别漏掉他。",
        c.kind === "missing"
          ? "切换顺序，试着把两种队伍都摆出来；不满足名次的情况不能算。"
          : c.kind === "rectangle"
            ? "高亮一整行，再看看这样的行一共有几行。"
            : "跟着两种颜色的计数标记，逐个检查。",
        explanation,
      ],
      c.kind === "swap"
        ? `交换后，小明从前排第${solution.ming}。`
        : explanation,
    ),
  );
  if (c.kind === "swap")
    questions.push(
      make(
        "queue-swap-back",
        "交换后，小明从后排第几？",
        n.total - n.otherFront + 1,
        [
          "交换的是位置。",
          "从队尾重新数到小明。",
          `${n.total}－${n.otherFront}＋1＝${n.total - n.otherFront + 1}。`,
        ],
      ),
    );
  if (c.kind === "change")
    questions.push(
      make("queue-change-total", "现在队伍一共有多少人？", solution.total, [
        "加入人数使总数增加，离开人数使总数减少。",
        "数一数还留在队伍里的人。",
        `${n.total}＋${n.join}－${n.leave}＝${solution.total}。`,
      ]),
    );
  const transfer = transferQueue(c),
    results = solveQueue(transfer),
    transferAnswer = results
      .map((s) => s.answer)
      .sort((a, b) => a - b)
      .join("、"),
    transferExplanation = results.map((s) => s.equation).join("；");
  const retries: Record<string, Question["retry"]> = {
    total: { prompt: "小明从前第2，从后第3，总共几人？", answer: "4" },
    reverse: { prompt: "5个人，小明从前第2，从后第几？", answer: "4" },
    between: { prompt: "从前数，两人分别第2和第5，中间几人？", answer: "2" },
    "same-direction": {
      prompt: "从前数，两人分别第2和第5，中间几人？",
      answer: "2",
    },
    missing: {
      prompt: "小红从前第2，小明从后第2，小红在前，中间1人，总共几人？",
      answer: "5",
    },
    rectangle: { prompt: "2行，每行3人，总共几人？", answer: "6" },
    change: { prompt: "小明原来第2，队首加入1人，现在第几？", answer: "3" },
    swap: { prompt: "小明第2，小红第4，交换后小明从前第几？", answer: "4" },
  };
  for (const q of questions) {
    q.retry = retries[c.kind];
    q.error = title + "：数量关系";
  }
  const model: LessonModel = { ...structuredClone(defaults), queue: c },
    transferModel: LessonModel = {
      ...structuredClone(defaults),
      queue: transfer,
    };
  return {
    id: "queue",
    title,
    subtitle: "排队动画实验室",
    icon: "⚑",
    color: "sky",
    story: queueStory(c),
    summary: "先统一方向，再找重合或间隔。名次、人数和中间人数有不同的意义。",
    model,
    transferModel,
    questions,
    transfer: [
      question(
        "queue-transfer-" + c.kind,
        "独立新题：" +
          (c.kind === "swap"
            ? queueStory(transfer).replace(
                "从前、从后各排第几？",
                "从前排第几？",
              )
            : queueStory(transfer)),
        transferAnswer,
        [
          "先画队伍，标出方向和关键人物。",
          "按同样的方法数一数，再检查有没有重复或遗漏。",
          transferExplanation,
        ],
        transferExplanation,
        {
          answerKind: c.kind === "missing" ? "set" : undefined,
          error: "独立迁移：" + title,
          retry: retries[c.kind],
        },
      ),
    ],
  };
}
