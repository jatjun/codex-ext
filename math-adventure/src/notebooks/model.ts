import {
  buildLesson as originalLesson,
  defaults as originalFields,
  type Lesson,
  type Task,
} from "../pdf/model";
import {
  cubeNets,
  cuboidNets,
  netAnalysis,
  voxelView,
  symmetryAxes,
  canTranslate,
  type PatternKind,
  type View,
} from "./geometry";
import {
  evaluate,
  exprText,
  op,
  toGrams,
  type AdvancedSpec,
  type Field,
  type Book,
  type Expr,
  type Batch,
} from "./types";
export const titles = {
  a: [
    "精细测量用毫米",
    "粮店卖出大米",
    "扣掉瓶子再分水",
    "哪组正好一吨",
    "统一单位比轻重",
    "质量换算四连关",
    "大象的复名数",
    "吨千克克互换",
    "一吨有几袋米",
    "合并与拆分质量",
    "给动物选单位",
    "铁和沙谁更重",
    "卡车载重的单位",
    "谁最接近一吨",
    "生活中的质量单位",
    "立体积木再检查",
    "红黄珠子手串",
    "大船与小船",
    "两首诗的字数",
    "两种中国结",
    "每个年级的班级",
    "体育课分组",
    "一家人包粽子",
    "两种图书差价",
    "淡季门票",
  ],
  b: [
    "一家人包粽子",
    "两种图书差价",
    "淡季门票",
    "签字笔和笔记本",
    "相向跑步靠近多少",
    "花束平均分",
    "公交车上下客",
    "乘除与加法",
    "算式比较大小",
    "乘除同级从左算",
    "检查计算步骤",
    "先算括号里面",
    "计算树变综合算式",
    "积木桥分类",
    "积木小动物分类",
    "正方体展开图",
    "哪些能折成正方体",
    "长方体展开图",
    "从哪面看积木",
    "平移还是旋转",
    "折一折找对称",
    "小方块的平移",
    "玫瑰能否平移重合",
    "再找轴对称图形",
    "顺时针与逆时针",
  ],
} as const;
export const allAddresses = (["a", "b"] as Book[]).flatMap((book) =>
  titles[book].map((title, i) => ({
    book,
    number: i + 1,
    title,
    id: `book-${book}-${i + 1}`,
  })),
);
export function canonical(book: Book, number: number): [Book, number] {
  return book === "a" && number >= 23 ? ["b", number - 22] : [book, number];
}
const f = (
  key: string,
  label: string,
  value: number,
  min = 1,
  max = 12,
  step = 1,
): Field => ({ key, label, value, min, max, step });
export function fields(book: Book, number: number): Field[] {
  const [b, n] = canonical(book, number);
  if (b === "a")
    switch (n) {
      case 1:
        return [f("mm", "物体长度（毫米）", 23, 5, 90)];
      case 2:
        return [
          f("tons", "运来大米（吨）", 2, 1, 8),
          f("left", "剩余大米（千克）", 800, 100, 7900, 100),
        ];
      case 3:
        return [
          f("bottle", "空瓶质量（克）", 250, 50, 900, 50),
          f("cups", "水杯数", 5, 2, 10),
          f("total", "连瓶质量（千克）", 1, 1, 3),
        ];
      case 4:
        return [
          f("tons", "目标质量（吨）", 1, 1, 5),
          f("part", "C组第一部分（千克）", 300, 100, 900, 100),
        ];
      case 5:
        return [
          f("tons", "A质量（整吨）", 3, 1, 8),
          f("kg", "A额外质量（千克）", 300, 0, 999),
          f("b", "B质量（千克）", 2900, 100, 9999),
          f("c", "C质量（千克）", 3330, 100, 9999),
        ];
      case 6:
        return [
          f("k", "第一问千克数", 5, 1, 9),
          f("t", "第二问整吨数", 2, 1, 9),
          f("minus", "第二问减去千克数", 1500, 100, 8900, 100),
          f("bulk", "第三问整吨数", 8, 1, 9),
          f("gk", "第四问克数中的整千克数", 3, 1, 9),
        ];
      case 7:
        return [
          f("tons", "大象质量（吨部分）", 6, 1, 8),
          f("kg", "另加千克数", 60, 10, 990, 10),
        ];
      case 8:
        return [
          f("tons", "整吨数", 7, 1, 9),
          f("kg", "克数中的整千克数", 4, 1, 9),
        ];
      case 9:
        return [
          f("tons", "目标大米（吨）", 1, 1, 5),
          f("bag", "每袋大米（千克）", 50, 10, 500),
        ];
      case 10:
        return [
          f("tons", "第一问整吨数", 1, 1, 8),
          f("kg", "第一问另加千克数", 1500, 100, 3000, 100),
          f("mixed", "第二问总千克数", 7080, 1001, 9999),
        ];
      case 11:
        return [
          f("elephant", "大象质量（吨）", 6, 2, 8),
          f("sheep", "绵羊质量（千克）", 30, 20, 80),
          f("monkey", "小猴质量（千克）", 5, 2, 15),
        ];
      case 12:
        return [
          f("iron", "铁块质量（吨）", 3, 1, 8),
          f("sand", "沙子质量（吨）", 3, 1, 8),
        ];
      case 13:
        return [f("capacity", "卡车载重数值", 8, 2, 20)];
      case 14:
        return [
          f("target", "目标质量（吨）", 1, 1, 3),
          f("elephants", "大象数量", 1000, 1, 1000),
          f("pupils", "学生数量", 30, 10, 100),
          f("coins", "硬币数量", 1000, 100, 1000, 100),
          f("perPupil", "估算每名学生（千克）", 30, 20, 40),
        ];
      case 15:
        return [
          f("melon", "西瓜质量数值", 3, 2, 8),
          f("ball", "乒乓球质量数值", 3, 2, 4),
          f("truck", "卡车载重数值", 5, 2, 12),
          f("dog", "小狗质量数值", 5, 2, 12),
        ];
      case 16:
        return originalFields(11);
      case 17:
        return [
          f("a", "每串红珠子", 7, 2, 10),
          f("b", "每串黄珠子", 4, 1, 9),
          f("n", "相同手串数量", 5, 2, 6),
        ];
      case 18:
        return [
          f("a", "每只大船人数", 6, 2, 10),
          f("b", "每只小船人数", 4, 1, 8),
          f("n", "大船和小船各几只", 3, 2, 6),
        ];
      case 19:
        return [
          f("a", "第一首每句字数", 5, 2, 10),
          f("b", "第二首每句字数", 7, 3, 12),
          f("n", "每首诗句数", 4, 2, 6),
        ];
      case 20:
        return [
          f("a", "第一种每个用绳（米）", 3, 1, 10),
          f("b", "第二种每个用绳（米）", 5, 1, 10),
          f("n", "两种各做几个", 5, 2, 6),
        ];
      case 21:
        return [
          f("grades", "两个学校各有几个年级", 6, 2, 8),
          f("a", "第一小学班级总数", 30, 4, 72),
          f("b", "第二小学班级总数", 24, 2, 64),
        ];
      case 22:
        return [
          f("group", "每组人数", 4, 2, 8),
          f("a", "跳绳总人数", 20, 4, 60),
          f("b", "拍球总人数", 16, 4, 60),
        ];
    }
  switch (n) {
    case 1:
      return [
        f("a", "每人豆沙粽数量", 8, 2, 10),
        f("b", "每人鲜肉粽数量", 5, 2, 10),
        f("n", "一起包粽子的人数", 3, 2, 6),
      ];
    case 2:
      return [
        f("price", "文艺书和故事书同一单价", 12, 2, 30),
        f("a", "文艺书本数", 4, 1, 8),
        f("b", "故事书本数", 6, 2, 10),
        f("techPrice", "科技书单价（干扰条件）", 28, 2, 40),
        f("techN", "科技书本数（干扰条件）", 4, 1, 8),
      ];
    case 3:
      return [
        f("price", "旺季每人票价", 10, 3, 30),
        f("discount", "淡季每人便宜多少", 3, 1, 10),
        f("friends", "好朋友人数（另加主人公）", 4, 1, 7),
      ];
    case 4:
      return [
        f("a", "签字笔单价", 3, 2, 20),
        f("b", "笔记本单价", 7, 2, 20),
        f("n", "两种各买几件", 2, 2, 8),
      ];
    case 5:
      return [
        f("distance", "两人起点距离（米）", 100, 30, 300),
        f("a", "第一人每秒跑（米）", 6, 1, 10),
        f("b", "第二人每秒跑（米）", 5, 1, 10),
        f("seconds", "跑步时间（秒）", 8, 1, 12),
      ];
    case 6:
      return [
        f("a", "白玫瑰枝数", 35, 4, 80),
        f("b", "茉莉枝数", 21, 4, 80),
        f("n", "花束数量", 7, 2, 10),
      ];
    case 7:
      return [
        f("before", "车上原有人数", 32, 5, 50),
        f("off", "下车人数", 15, 1, 40),
        f("on", "上车人数", 18, 1, 40),
      ];
    case 8:
      return [
        f("quotient", "除法得数（被除数自动生成）", 8, 2, 12),
        f("divisor", "除数", 9, 2, 9),
        f("a", "乘法第一个数", 7, 2, 9),
        f("b", "乘法第二个数", 7, 2, 9),
      ];
    case 9:
      return [
        f("a", "第一式第一个加数", 37, 20, 70),
        f("b", "第一式第二个加数", 24, 10, 40),
        f("c", "第一式减数", 20, 1, 30),
        f("target", "第一式比较数", 67, 10, 99),
        f("q1", "第二式左边商", 8, 1, 12),
        f("q2", "第二式右边商", 7, 1, 12),
        f("q3", "第三式左边商", 7, 1, 12),
        f("factor", "第三式右边乘数", 2, 1, 8),
      ];
    case 10:
      return [
        f("quotient", "第一步除法得数", 6, 2, 12),
        f("divisor", "第一步除数", 7, 2, 9),
        f("times", "第二步乘数", 3, 2, 9),
        f("last", "最后一步除数", 9, 2, 12),
      ];
    case 11:
      return [
        f("scheme", "计算示例方案（0原题，1变式）", 0, 0, 1),
        f("factor", "正确计算的第一个因数", 4, 2, 8, 2),
      ];
    case 12:
      return [
        f("total", "括号外被减数", 88, 20, 150),
        f("a", "括号内第一个加数", 35, 5, 60),
        f("b", "括号内第二个加数", 12, 2, 40),
      ];
    case 13:
      return [
        f("result", "最终商（被除数自动生成）", 3, 2, 9),
        f("a", "先乘的第一个因数", 3, 2, 8),
        f("b", "先乘的第二个因数", 3, 2, 8),
      ];
    case 14:
    case 15:
      return [
        f("cube", "正方体数量", n === 14 ? 2 : 1, 1, 8),
        f("box", "长方体数量", n === 14 ? 5 : 4, 1, 10),
        f("cylinder", "圆柱数量", n === 14 ? 3 : 4, 1, 8),
        f("ball", "球的数量", n === 14 ? 4 : 2, 1, 8),
      ];
    case 16:
    case 17:
      return [
        f("edge", "正方体棱长（厘米）", 2, 1, 6),
        f("scheme", "图形排列方案", 0, 0, n === 16 ? 2 : 3),
        f("yaw", "观察角度（度）", 30, 0, 80),
      ];
    case 18:
      return [
        f("length", "长边（厘米）", 2, 1, 6),
        f("short", "短边（厘米）", 1, 1, 4),
        f("scheme", "图形排列方案", 0, 0, 3),
        f("yaw", "观察角度（度）", 30, 0, 80),
      ];
    case 19:
      return [
        f("length", "底层横向方块数", 3, 3, 5),
        f("height", "左端叠几层", 2, 1, 4),
        f("view", "目标方向：0上，1前，2左，3右", 0, 0, 3),
        f("yaw", "初始观察角度", 30, 10, 70),
      ];
    case 20:
      return [
        f("distance", "平移距离（画面单位）", 100, 40, 160),
        f("angle", "转动角度（度）", 180, 45, 360),
      ];
    case 21:
    case 24:
      return [
        f("angle", "整体转动角度（度）", 0, 0, 180),
        f("size", "图形大小（百分比）", 100, 60, 120),
        f("scheme", "图形排列方案", 0, 0, 3),
      ];
    case 22:
      return [
        f("dx", "水平移动距离", 140, 40, 220),
        f("dy", "竖直移动距离", 0, -60, 60),
        f("angle", "同时转动角度（0表示不转）", 0, 0, 180, 15),
      ];
    case 23:
      return [
        f("angle", "目标花朵整体方向（度）", 0, 0, 180),
        f("size", "花朵大小（百分比）", 100, 70, 120),
        f("scheme", "选项排列方案", 0, 0, 6),
      ];
    case 25:
      return [
        f("angle", "转动角度（度）", 180, 45, 360),
        f("scheme", "物体排列方案", 0, 0, 2),
        f("reverse", "方向方案：0原题，1全部反向", 0, 0, 1),
      ];
  }
  throw Error("Unknown notebook address");
}
export const valuesFor = (book: Book, n: number) =>
  Object.fromEntries(fields(book, n).map((f) => [f.key, f.value]));
export function validate(
  book: Book,
  number: number,
  v: Record<string, number>,
): string[] {
  const issues = fields(book, number)
    .filter(
      (f) =>
        !Number.isInteger(v[f.key]) ||
        v[f.key] < f.min ||
        v[f.key] > f.max ||
        (v[f.key] - f.min) % (f.step ?? 1) !== 0,
    )
    .map((f) => `${f.label}应在${f.min}～${f.max}之间，步长${f.step ?? 1}。`);
  const [b, n] = canonical(book, number);
  const check = (condition: boolean, msg: string) => {
    if (!condition) issues.push(msg);
  };
  if (b === "a") {
    if (n === 2) check(v.left < v.tons * 1000, "剩余大米必须少于运来大米。");
    if (n === 3)
      check(
        v.total * 1000 - v.bottle > 0 &&
          (v.total * 1000 - v.bottle) % v.cups === 0,
        "扣除空瓶后，应能平均分成整数克的水。",
      );
    if (n === 5)
      check(
        new Set([v.tons * 1000 + v.kg, v.b, v.c]).size === 3,
        "请设置三个不同的质量，避免并列最重。",
      );
    if (n === 6) check(v.minus < v.t * 1000, "减去的千克数必须小于总质量。");
    if (n === 9)
      check(
        (v.tons * 1000) % v.bag === 0 && (v.tons * 1000) / v.bag <= 100,
        "每袋质量需整除总质量，且总袋数不超过100。",
      );
    if (n === 14) {
      const ds = [
        v.elephants * 3000000,
        v.pupils * v.perPupil * 1000,
        v.coins * 2,
      ].map((g) => Math.abs(g - v.target * 1000000));
      check(
        ds.filter((d) => d === Math.min(...ds)).length === 1,
        "请调整数值，保证只有一组最接近目标。",
      );
    }
    if (n === 17 || n === 18) check(v.a > v.b, "第一种每组数量应多于第二种。");
    if (n === 19) check(v.b > v.a, "第二首每句字数应多于第一首。");
    if (n >= 17 && n <= 20)
      check((v.a + v.b) * v.n <= 120, "物体总数请控制在120以内。");
    if (n === 21)
      check(
        v.a > v.b &&
          v.a % v.grades === 0 &&
          v.b % v.grades === 0 &&
          v.a + v.b <= 120,
        "第一校班级更多，且两校各自均能按年级平均分，总班级不超过120。",
      );
    if (n === 22)
      check(
        v.a % v.group === 0 && v.b % v.group === 0 && v.a + v.b <= 120,
        "两种练习人数各自需能按每组人数分完，总数不超过120。",
      );
  } else {
    if (n === 1 || n === 4)
      check((v.a + v.b) * v.n <= 120, "物体总数请控制在120以内。");
    if (n === 2) check(v.b > v.a, "故事书本数应多于文艺书。");
    if (n === 3) check(v.price > v.discount, "淡季票价必须大于0。");
    if (n === 5)
      check(
        (v.a + v.b) * v.seconds <= v.distance,
        "本题只演示相遇前（含刚好相遇），请增大起点距离或缩短时间。",
      );
    if (n === 6)
      check(
        v.a % v.n === 0 && v.b % v.n === 0 && v.a + v.b <= 120,
        "两类花都需能平均分成整数枝，总花数不超过120。",
      );
    if (n === 7)
      check(
        v.off <= v.before && v.before - v.off + v.on <= 80,
        "下车人数不能超过原有人数，最后人数不超过80。",
      );
    if (n === 9) check(v.a + v.b >= v.c, "第一式不能出现负数。");
    if (n === 10)
      check((v.quotient * v.times) % v.last === 0, "最后一步需要得到整数。");
    if (n === 12) check(v.total > v.a + v.b, "括号内的和应小于被减数。");
    if (n === 18) check(v.length >= v.short, "长边不能短于短边。");
  }
  return issues;
}
const T = (
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
const choose = (
  id: string,
  prompt: string,
  choices: string[],
  correct: number,
  hint: string,
  explanation: string,
) => T(id, prompt, choices[correct], hint, explanation, { options: choices });
const mass = (
  mode: Extract<AdvancedSpec, { kind: "mass" }>["mode"],
  values: Extract<AdvancedSpec, { kind: "mass" }>["values"],
  extra: Partial<Extract<AdvancedSpec, { kind: "mass" }>> = {},
): AdvancedSpec => ({ kind: "mass", mode, values, ...extra });
const M = (
  label: string,
  amount: number,
  unit: "g" | "kg" | "t",
  icon = "▣",
) => ({ label, amount, unit, icon });
const batch = (
  label: string,
  icon: string,
  per: number,
  copies = 1,
  value = 1,
  color = "#528d79",
): Batch => ({ label, icon, per, copies, value, color });
const shift = <A>(a: A[], n: number) => a.map((_, i) => a[(i + n) % a.length]);
function groupTasks(
  prompt: string,
  answer: number,
  method1: string,
  method2: string,
  wrong: string,
  unit: string,
): Task[] {
  return [
    choose(
      "method1",
      prompt + "先选一种符合题意的合并方法。",
      [method1, wrong],
      0,
      "看清括号里表示什么；同样的每一组都要计算。",
      `第一种方法：${method1}。`,
    ),
    choose(
      "method2",
      "再选一种分开计算后合并的方法。",
      [wrong, method2],
      1,
      "两部分先各自计算，再合并或求差。",
      `第二种方法：${method2}。`,
    ),
    T(
      "result",
      `最后的结果是多少${unit}？`,
      answer,
      "用两种方法检查，看看结果是否一致。",
      `${method1}＝${method2}＝${answer}${unit}。`,
    ),
  ];
}
export function build(
  book: Book,
  number: number,
  values = valuesFor(book, number),
): Lesson {
  const [b, n] = canonical(book, number),
    v = values;
  let spec: AdvancedSpec,
    tasks: Task[] = [],
    summary = "先看数量关系，再选择条件，算完用另一种方法检查。";
  const title = titles[book][number - 1];
  let story =
    "先看物体如何移动，再亲手操作和作答。改变数字后，画面里的数量和数学关系会一起更新。";
  if (b === "a" && n === 16) {
    const old = originalLesson(11, v);
    return {
      ...old,
      id: 116,
      title,
      sourceNote:
        "与上一份错题本第11题相同，共用立体积木模型，单独保存本次学习记录。",
    };
  }
  if (b === "a" && n <= 15) {
    summary =
      "质量计算先统一单位：1吨＝1000千克，1千克＝1000克。物体的质量不会因为单位改变而改变。";
    switch (n) {
      case 1:
        spec = { kind: "ruler", mm: v.mm };
        tasks = [
          choose(
            "unit",
            "量较短的物体或需要更精确时，可以用毫米作单位。这句话对吗？",
            ["正确", "错误"],
            0,
            "比较厘米里的小刻度；毫米比厘米更小。",
            "1厘米＝10毫米，可以记录更细的长度。",
          ),
          T(
            "read",
            `移动放大镜看看：这根小棒长多少毫米？`,
            v.mm,
            "从0刻度数到小棒末端，不要从1开始。",
            `小棒从0到${v.mm}毫米，长${v.mm}毫米。`,
          ),
        ];
        break;
      case 2:
        spec = mass("convert", [
          M("运来", v.tons, "t", "🌾"),
          M("剩余", v.left, "kg", "🌾"),
        ]);
        tasks = [
          T(
            "kg",
            `运来${v.tons}吨大米，先换成多少千克？`,
            v.tons * 1000,
            "先统一单位，再计算卖出多少。",
            `${v.tons}×1000＝${v.tons * 1000}千克。`,
          ),
          T(
            "sold",
            `还剩${v.left}千克，这周卖出多少千克？`,
            v.tons * 1000 - v.left,
            "运来部分分成卖出和剩余两部分。",
            `${v.tons * 1000}－${v.left}＝${v.tons * 1000 - v.left}千克。`,
          ),
        ];
        break;
      case 3:
        spec = mass(
          "bottle",
          [M("连瓶", v.total, "kg", "🫙"), M("空瓶", v.bottle, "g", "🫙")],
          { cupCount: v.cups },
        );
        tasks = [
          T(
            "water",
            `空瓶${v.bottle}克，连瓶${v.total}千克。只有水重多少克？`,
            v.total * 1000 - v.bottle,
            "总质量里包含空瓶，先扣掉它。",
            `${v.total * 1000}－${v.bottle}＝${v.total * 1000 - v.bottle}克。`,
          ),
          T(
            "cup",
            `这些水来自${v.cups}杯，平均每杯水多少克？`,
            (v.total * 1000 - v.bottle) / v.cups,
            "把水的质量平均分，不能把瓶子也分进去。",
            `（${v.total * 1000}－${v.bottle}）÷${v.cups}＝${(v.total * 1000 - v.bottle) / v.cups}克。`,
          ),
        ];
        break;
      case 4: {
        const choices = [
          "A：300克和700克",
          "B：3千克和7千克",
          `C：${v.part}千克和${v.tons * 1000 - v.part}千克`,
        ];
        spec = mass(
          "compare",
          [
            M("A组", 1000, "g"),
            M("B组", 10, "kg"),
            M("C组", v.tons * 1000, "kg"),
          ],
          { target: v.tons * 1000 },
        );
        tasks = [
          choose(
            "pair",
            `哪组总质量恰好是${v.tons}吨？`,
            choices,
            2,
            "先换成同一个单位，再把每组两部分相加。",
            `${v.tons}吨＝${v.tons * 1000}千克，C组合适。`,
          ),
        ];
        break;
      }
      case 5: {
        const kg = [v.tons * 1000 + v.kg, v.b, v.c];
        spec = mass("compare", [
          M("A", v.tons, "t"),
          M("A另加", v.kg, "kg"),
          M("B", v.b, "kg"),
          M("C", v.c, "kg"),
        ]);
        tasks = [
          choose(
            "heaviest",
            "统一单位后，哪一个最重？",
            [`A：${v.tons}吨${v.kg}千克`, `B：${v.b}千克`, `C：${v.c}千克`],
            kg.indexOf(Math.max(...kg)),
            "不能只比数字大小。把吨换成千克，再加上另外的千克数。",
            `A为${kg[0]}千克，B为${kg[1]}千克，C为${kg[2]}千克。`,
          ),
        ];
        break;
      }
      case 6:
        spec = mass("convert", [
          M("千克换克", v.k, "kg"),
          M("整吨", v.t, "t"),
          M("减去", v.minus, "kg"),
          M("总千克", v.bulk * 1000, "kg"),
          M("总克", v.gk * 1000, "g"),
        ]);
        tasks = [
          T(
            "g",
            `${v.k}千克＝多少克？`,
            v.k * 1000,
            "1千克里有1000克。",
            `${v.k}×1000＝${v.k * 1000}克。`,
          ),
          T(
            "minus",
            `${v.t}吨－${v.minus}千克＝多少千克？`,
            v.t * 1000 - v.minus,
            "先换单位，再做减法。",
            `${v.t * 1000}－${v.minus}＝${v.t * 1000 - v.minus}千克。`,
          ),
          T(
            "ton",
            `多少吨＝${v.bulk * 1000}千克？`,
            v.bulk,
            "每1000千克组成1吨。",
            `${v.bulk * 1000}÷1000＝${v.bulk}吨。`,
          ),
          T(
            "kg",
            `${v.gk * 1000}克＝多少千克？`,
            v.gk,
            "克换千克，按每1000克一组。",
            `${v.gk * 1000}÷1000＝${v.gk}千克。`,
          ),
        ];
        break;
      case 7: {
        const kg = v.tons * 1000 + v.kg;
        spec = mass("convert", [
          M("大象整吨", v.tons, "t", "🐘"),
          M("另外", v.kg, "kg"),
        ]);
        tasks = [
          choose(
            "elephant",
            `大象重${v.tons}吨${v.kg}千克，合多少千克？`,
            [String(kg), String(kg + 540), String(kg - 54)],
            0,
            "吨部分乘1000，千克部分保持不变，再相加。",
            `${v.tons}×1000＋${v.kg}＝${kg}千克。`,
          ),
        ];
        break;
      }
      case 8:
        spec = mass("convert", [
          M("整吨", v.tons, "t"),
          M("整克", v.kg * 1000, "g"),
        ]);
        tasks = [
          T(
            "kg",
            `${v.tons}吨＝多少千克？`,
            v.tons * 1000,
            "吨换千克，每吨是1000千克。",
            `${v.tons}×1000＝${v.tons * 1000}。`,
          ),
          T(
            "g",
            `${v.kg * 1000}克＝多少千克？`,
            v.kg,
            "克换千克，按1000分组。",
            `${v.kg * 1000}÷1000＝${v.kg}。`,
          ),
        ];
        break;
      case 9: {
        const count = (v.tons * 1000) / v.bag;
        spec = mass("bags", [M("每袋香米", v.bag, "kg", "🌾")], {
          bagCount: count,
          target: v.tons * 1000,
        });
        tasks = [
          T(
            "bags",
            `每袋${v.bag}千克，多少袋正好是${v.tons}吨？`,
            count,
            "先换成千克，再看有多少份每袋的质量。",
            `${v.tons * 1000}÷${v.bag}＝${count}袋。`,
          ),
        ];
        break;
      }
      case 10:
        spec = mass("convert", [
          M("整吨", v.tons, "t"),
          M("另加", v.kg, "kg"),
          M("拆分", v.mixed, "kg"),
        ]);
        tasks = [
          T(
            "sum",
            `${v.tons}吨＋${v.kg}千克＝多少千克？`,
            v.tons * 1000 + v.kg,
            "先把吨换成千克。",
            `${v.tons * 1000}＋${v.kg}＝${v.tons * 1000 + v.kg}千克。`,
          ),
          T(
            "tons",
            `${v.mixed}千克里，先取出多少整吨？`,
            Math.floor(v.mixed / 1000),
            "每1000千克组成1吨，只取完整的一份。",
            `有${Math.floor(v.mixed / 1000)}个完整的1000千克。`,
          ),
          T(
            "rest",
            "取出整吨后，还剩多少千克？",
            v.mixed % 1000,
            "检查整吨部分与剩余部分加起来是否等于原数。",
            `${v.mixed}＝${Math.floor(v.mixed / 1000)}×1000＋${v.mixed % 1000}。`,
          ),
        ];
        break;
      case 11:
        spec = mass("units", [
          M("大象", v.elephant, "t", "🐘"),
          M("绵羊", v.sheep, "kg", "🐑"),
          M("小猴", v.monkey, "kg", "🐒"),
        ]);
        tasks = [
          choose(
            "animal",
            "哪种动物的质量用吨作单位最合适？",
            ["大象", "绵羊", "小猴"],
            0,
            "吨适合描述非常重的物体，估一估动物的质量。",
            "这组动物中，大象的质量是吨的量级。",
          ),
        ];
        break;
      case 12:
        spec = mass("equal", [M("铁块", v.iron, "t"), M("沙子", v.sand, "t")]);
        tasks = [
          choose(
            "balance",
            `${v.iron}吨铁块比${v.sand}吨沙子怎样？`,
            ["轻", "重", "一样重"],
            v.iron === v.sand ? 2 : v.iron < v.sand ? 0 : 1,
            "比较给出的质量，不根据材料名字判断。",
            `统一单位后分别是${v.iron * 1000}千克和${v.sand * 1000}千克。`,
          ),
        ];
        break;
      case 13:
        spec = mass("units", [M("卡车载重", v.capacity, "t", "🚚")]);
        tasks = [
          choose(
            "truck",
            `大卡车约载货${v.capacity}（ ），选什么单位？`,
            ["吨", "千克", "克"],
            0,
            "结合大卡车能运很多货物的实际情况。",
            "吨适合计量大卡车的载重。",
          ),
        ];
        break;
      case 14: {
        const items = [
            M(`${v.elephants}头大象`, v.elephants * 3000, "kg", "🐘"),
            M(`${v.pupils}名学生`, v.pupils * v.perPupil, "kg", "🧒"),
            M(`${v.coins}枚硬币`, v.coins * 2, "g", "◉"),
          ],
          delta = items.map((i) =>
            Math.abs(toGrams(i.amount, i.unit) - v.target * 1000000),
          );
        spec = mass("estimate", items, { target: v.target * 1000 });
        tasks = [
          choose(
            "close",
            `按图中估算，每头大象约3吨、每名学生约${v.perPupil}千克、每枚硬币约2克。哪组最接近${v.target}吨？`,
            items.map((i) => i.label),
            delta.indexOf(Math.min(...delta)),
            "统一单位，比较与目标相差多少；这里只是题目中的估算值。",
            items
              .map((i) => `${i.label}约${toGrams(i.amount, i.unit) / 1000}千克`)
              .join("；") + "。",
          ),
        ];
        break;
      }
      default:
        spec = mass("units", [
          M("西瓜", v.melon, "kg", "🍉"),
          M("乒乓球", v.ball, "g", "🏓"),
          M("卡车载重", v.truck, "t", "🚚"),
          M("小狗", v.dog, "kg", "🐶"),
        ]);
        tasks = [
          ["西瓜", v.melon, "千克"],
          ["乒乓球", v.ball, "克"],
          ["卡车载重", v.truck, "吨"],
          ["小狗", v.dog, "千克"],
        ].map(([label, num, u], i) =>
          choose(
            "unit-" + i,
            `${label}约重${num}（ ），选合适单位。`,
            ["克", "千克", "吨"],
            ["克", "千克", "吨"].indexOf(String(u)),
            "先想物体有多重，再选择克、千克或吨。",
            `${label}的这个数值用${u}作单位。`,
          ),
        );
    }
  } else if (b === "a") {
    let a = v.a,
      c = v.b,
      copies = v.n,
      distribution: "copies" | "mixed" | "separate" | "compare" = "copies",
      groups = copies,
      difference = false,
      unit = "个",
      labels = ["第一种", "第二种"],
      icons = ["●", "●"],
      valueA = 1,
      valueB = 1,
      answer = 0,
      m1 = "",
      m2 = "",
      wrong = "";
    if (n === 17) {
      difference = true;
      unit = "颗";
      labels = ["红珠子", "黄珠子"];
      icons = ["●", "●"];
      answer = (a - c) * copies;
      m1 = `（${a}－${c}）×${copies}`;
      m2 = `${a}×${copies}－${c}×${copies}`;
      wrong = `${a}－${c}×${copies}`;
      story = `每串有${a}颗红珠子、${c}颗黄珠子，一共${copies}串，红珠子比黄珠子多多少颗？`;
    }
    if (n === 18) {
      unit = "人";
      labels = ["大船座位", "小船座位"];
      icons = ["🧒", "🧒"];
      answer = (a + c) * copies;
      m1 = `（${a}＋${c}）×${copies}`;
      m2 = `${a}×${copies}＋${c}×${copies}`;
      wrong = `${a}＋${c}×${copies}`;
      story = `大船每只坐${a}人，小船每只坐${c}人，各有${copies}只且坐满，一共多少人？`;
    }
    if (n === 19) {
      difference = true;
      unit = "字";
      labels = ["第一首字格", "第二首字格"];
      icons = ["字", "字"];
      answer = (c - a) * copies;
      m1 = `（${c}－${a}）×${copies}`;
      m2 = `${c}×${copies}－${a}×${copies}`;
      wrong = `${c}－${a}×${copies}`;
      story = `第一首每句${a}字、第二首每句${c}字，两首各${copies}句（不含诗名），第一首比第二首少多少字？修改后的字格是数学练习，不虚构新诗句。`;
    }
    if (n === 20) {
      unit = "米";
      labels = ["第一种绳段", "第二种绳段"];
      icons = ["━", "━"];
      answer = (a + c) * copies;
      m1 = `（${a}＋${c}）×${copies}`;
      m2 = `${a}×${copies}＋${c}×${copies}`;
      wrong = `${a}＋${c}×${copies}`;
      story = `两种中国结每个分别用${a}米和${c}米红绳，各编${copies}个，一共多少米？每个小绳段表示1米。`;
    }
    if (n === 21) {
      distribution = "compare";
      groups = v.grades;
      copies = 1;
      difference = true;
      labels = ["第一校班级", "第二校班级"];
      icons = ["▣", "▣"];
      unit = "个班";
      answer = (a - c) / groups;
      m1 = `（${a}－${c}）÷${groups}`;
      m2 = `${a}÷${groups}－${c}÷${groups}`;
      wrong = `${a}－${c}÷${groups}`;
      story = `两校各有${groups}个年级，每校各年级班数相同；第一校${a}班，第二校${c}班，每个年级相差几班？`;
    }
    if (n === 22) {
      distribution = "separate";
      groups = v.group;
      copies = 1;
      labels = ["跳绳同学", "拍球同学"];
      icons = ["🧒", "🧒"];
      unit = "组";
      answer = (a + c) / groups;
      m1 = `（${a}＋${c}）÷${groups}`;
      m2 = `${a}÷${groups}＋${c}÷${groups}`;
      wrong = `${a}＋${c}÷${groups}`;
      story = `跳绳${a}人、拍球${c}人，每组${groups}人，一共有几组？`;
    }
    spec = {
      kind: "groups",
      batches: [
        batch(labels[0], icons[0], a, copies, valueA, "#c56e69"),
        batch(labels[1], icons[1], c, copies, valueB, "#d4ae45"),
      ],
      distribution,
      groups,
      difference,
      methods: [m1, m2],
      unit,
    };
    tasks = groupTasks(story, answer, m1, m2, wrong, unit);
  } else if (n <= 6) {
    if (n === 5) {
      spec = {
        kind: "race",
        distance: v.distance,
        a: v.a,
        b: v.b,
        seconds: v.seconds,
      };
      const sum = (v.a + v.b) * v.seconds;
      story = `从${v.distance}米的两端相向跑，每秒分别跑${v.a}米和${v.b}米，跑${v.seconds}秒。靠近多少米，是问两人一共跑了多少米。`;
      tasks = [
        choose(
          "wrong",
          "下面哪种列式错误？",
          [
            `（${v.a}＋${v.b}）×${v.seconds}`,
            `（${v.a}－${v.b}）×${v.seconds}`,
            `${v.a}×${v.seconds}＋${v.b}×${v.seconds}`,
          ],
          1,
          "相向跑，两个人都在缩短距离，要把两人的路程加起来。",
          `两种正确方法都表示两人路程之和。`,
        ),
        T(
          "closer",
          `${v.seconds}秒后，两人靠近多少米？`,
          sum,
          "“靠近多少”与“还相距多少”是两个问题。",
          `（${v.a}＋${v.b}）×${v.seconds}＝${sum}米。`,
        ),
        T(
          "gap",
          "这时还相距多少米？",
          v.distance - sum,
          "从起点总距离扣掉两人已跑的距离。",
          `${v.distance}－${sum}＝${v.distance - sum}米。`,
        ),
      ];
    } else {
      let batches: Batch[],
        distribution: "copies" | "mixed" = "copies",
        groups = v.n,
        difference = false,
        unit = "元",
        m1 = "",
        m2 = "",
        wrong = "",
        answer = 0;
      if (n === 1) {
        unit = "个";
        batches = [
          batch("豆沙粽", "🔺", v.a, v.n, 1, "#609d75"),
          batch("鲜肉粽", "🔺", v.b, v.n, 1, "#d0a453"),
        ];
        m1 = `（${v.a}＋${v.b}）×${v.n}`;
        m2 = `${v.a}×${v.n}＋${v.b}×${v.n}`;
        wrong = `${v.a}＋${v.b}×${v.n}`;
        answer = (v.a + v.b) * v.n;
        story = `${v.n}人每人包${v.a}个豆沙粽、${v.b}个鲜肉粽，一共多少个？`;
      } else if (n === 2) {
        difference = true;
        groups = 1;
        batches = [
          batch("文艺书", "📕", v.a, 1, v.price, "#8e7eb6"),
          batch("故事书", "📗", v.b, 1, v.price, "#4e9b79"),
        ];
        m1 = `${v.price}×（${v.b}－${v.a}）`;
        m2 = `${v.price}×${v.b}－${v.price}×${v.a}`;
        wrong = `${v.price}×${v.b}－${v.a}`;
        answer = v.price * (v.b - v.a);
        story = `文艺书和故事书每本都是${v.price}元，分别买${v.a}本、${v.b}本；科技书${v.techPrice}元，买${v.techN}本（此问不需要）。故事书比文艺书多花多少元？`;
      } else if (n === 3) {
        difference = true;
        groups = v.friends + 1;
        batches = [
          batch("旺季票价单位", "◉", v.price, groups, 1, "#5a9883"),
          batch("每人优惠单位", "◉", v.discount, groups, 1, "#cf9a52"),
        ];
        m1 = `（${v.price}－${v.discount}）×${groups}`;
        m2 = `${v.price}×${groups}－${v.discount}×${groups}`;
        wrong = `（${v.price}－${v.discount}）×${v.friends}`;
        answer = (v.price - v.discount) * groups;
        story = `旺季每人${v.price}元，淡季每人便宜${v.discount}元；主人公和${v.friends}位朋友一起去，注意还要算上主人公。`;
      } else if (n === 4) {
        batches = [
          batch("签字笔", "🖊️", v.n, 1, v.a, "#6d91b3"),
          batch("笔记本", "📒", v.n, 1, v.b, "#d0a453"),
        ];
        groups = v.n;
        m1 = `${v.a}×${v.n}＋${v.b}×${v.n}`;
        m2 = `（${v.a}＋${v.b}）×${v.n}`;
        wrong = `${v.a}＋${v.b}×${v.n}`;
        answer = (v.a + v.b) * v.n;
        story = `签字笔每支${v.a}元，笔记本每本${v.b}元，两种各买${v.n}件，一共多少钱？`;
      } else {
        distribution = "mixed";
        unit = "枝";
        batches = [
          batch("白玫瑰", "✿", v.a, 1, 1, "#9babb4"),
          batch("茉莉", "✿", v.b, 1, 1, "#d3ae4f"),
        ];
        m1 = `（${v.a}＋${v.b}）÷${v.n}`;
        m2 = `${v.a}÷${v.n}＋${v.b}÷${v.n}`;
        wrong = `${v.a}＋${v.b}÷${v.n}`;
        answer = (v.a + v.b) / v.n;
        story = `${v.a}枝白玫瑰、${v.b}枝茉莉平均扎成${v.n}束，每束多少枝？`;
      }
      spec = {
        kind: "groups",
        batches,
        distribution,
        groups,
        difference,
        methods: [m1, m2],
        unit,
      };
      if (n === 1)
        tasks = [
          choose(
            "expression",
            story + "哪种算式正确？",
            [m1, wrong, `${v.a}×${v.n}＋${v.b}`, `（${v.a}－${v.b}）×${v.n}`],
            0,
            "每个人的两种粽子都要计算。",
            "先求每人两种粽子的总数，再乘人数。",
          ),
          T(
            "result",
            "一共多少个粽子？",
            answer,
            "可以分别算两类粽子，再合起来。",
            `${m1}＝${answer}。`,
          ),
        ];
      else if (n >= 2 && n <= 4) {
        const choices =
          n === 2
            ? [m1, wrong, m2]
            : n === 3
              ? [wrong, m1, m2]
              : [m1, m2, wrong];
        tasks = [
          ...(n === 3
            ? [
                T(
                  "people",
                  "一共几人去公园？",
                  groups,
                  "朋友之外，主人公自己也要买票。",
                  `1＋${v.friends}＝${groups}人。`,
                ),
              ]
            : []),
          choose(
            "wrong",
            "下面算式中，错误的是哪一个？",
            choices,
            n === 2 ? 1 : n === 3 ? 0 : 2,
            "检查每个算式中的数分别表示什么，单位是否一致。",
            `正确的两种方法是${m1}和${m2}。`,
          ),
          T(
            "result",
            n === 2 ? "故事书比文艺书多花多少元？" : "实际一共花多少元？",
            answer,
            "用另一种正确方法再检查。",
            `${m1}＝${answer}元。`,
          ),
        ];
      } else tasks = groupTasks(story, answer, m1, m2, wrong, unit);
    }
  } else if (n === 7) {
    spec = { kind: "bus", before: v.before, off: v.off, on: v.on };
    tasks = [
      T(
        "off",
        `车上原有${v.before}人，先下车${v.off}人，还剩几人？`,
        v.before - v.off,
        "下车的人离开了车厢，所以先减。",
        `${v.before}－${v.off}＝${v.before - v.off}。`,
      ),
      T(
        "on",
        `再上车${v.on}人，现在共有几人？`,
        v.before - v.off + v.on,
        "把上车的人加入留下的人中。",
        `${v.before}－${v.off}＋${v.on}＝${v.before - v.off + v.on}人。`,
      ),
    ];
    summary =
      "先减去下车人数，再加上上车人数。动画中的人都有固定身份，不会重复增加。";
  } else if (n <= 13) {
    let expressions: Expr[] = [],
      captions: string[] = [],
      working: string[] | undefined;
    if (n === 8) {
      const e = op(
        "+",
        op("÷", v.quotient * v.divisor, v.divisor),
        op("×", v.a, v.b),
      );
      expressions = [e];
      captions = ["乘除优先于加减"];
      tasks = [
        choose(
          "first",
          `${exprText(e)}，优先处理哪类运算？`,
          ["乘除", "加减"],
          0,
          "先看有没有括号；这里没有括号。",
          "先算乘除，再算加法；两边的乘除可分别计算。",
        ),
        T(
          "result",
          `${exprText(e)}＝？`,
          evaluate(e),
          "先得到左右两部分的结果，再相加。",
          `${v.quotient}＋${v.a * v.b}＝${evaluate(e)}。`,
        ),
      ];
    }
    if (n === 9) {
      expressions = [
        op("-", op("+", v.a, v.b), v.c),
        v.target,
        op("+", op("÷", v.q1 * 7, 7), 2),
        op("+", op("÷", v.q2 * 7, 7), 2),
        op("+", op("÷", v.q3 * 5, 5), 6),
        op("-", op("×", v.factor, 9), 1),
      ];
      captions = [
        "比较1左",
        "比较1右",
        "比较2左",
        "比较2右",
        "比较3左",
        "比较3右",
      ];
      tasks = Array.from({ length: 3 }, (_, i) => {
        const a = evaluate(expressions[i * 2]),
          b = evaluate(expressions[i * 2 + 1]);
        return T(
          "cmp" + i,
          `${exprText(expressions[i * 2])} ○ ${exprText(expressions[i * 2 + 1])}，填哪一个符号？`,
          a === b ? "=" : a > b ? ">" : "<",
          "分别算左右两边，再比较；不要只看算式长短。",
          `左边${a}，右边${b}。`,
          { options: [">", "<", "="], focus: "cmp" + i },
        );
      });
    }
    if (n === 10) {
      const e = op(
        "÷",
        op("×", op("÷", v.quotient * v.divisor, v.divisor), v.times),
        v.last,
      );
      expressions = [e];
      captions = ["同级乘除从左往右"];
      tasks = [
        choose(
          "order",
          `${v.quotient * v.divisor}÷${v.divisor}×${v.times}÷${v.last}，应该先做什么？`,
          [
            `先算${v.quotient * v.divisor}÷${v.divisor}`,
            `先算${v.times}÷${v.last}`,
          ],
          0,
          "乘和除是同一级，不能认为乘法总比除法先算。",
          "只有同级运算，按从左往右的顺序。",
        ),
        T(
          "result",
          "最后结果是多少？",
          evaluate(e),
          "每完成一步，再继续向右。",
          `${v.quotient}×${v.times}÷${v.last}＝${evaluate(e)}。`,
        ),
      ];
    }
    if (n === 11) {
      const offset = v.scheme * 2;
      expressions = [
        op("+", op("-", 42 + offset, 28), 2),
        op("÷", op("×", v.factor, 9), 6),
        op("+", 18, op("÷", 27, 9)),
        op("-", op("÷", 24, 6), 3),
      ];
      working = [
        `A：${42 + offset}－28＋2＝${42 + offset}－30＝${12 + offset}`,
        `B：${v.factor}×9÷6＝${v.factor * 9}÷6＝${(v.factor * 9) / 6}`,
        `C：18＋27÷9＝45÷9＝5`,
        `D：24÷6－3＝24÷3＝8`,
      ];
      tasks = [
        choose(
          "correct",
          "哪一份计算步骤正确？",
          working,
          1,
          "检查先算哪一步，不能把减法与加法任意合并，也不能先加再除。",
          "B按从左往右计算；其余示例的第一步改变了运算关系。",
        ),
      ];
      captions = ["同级加减", "同级乘除", "先除后加", "先除后减"];
    }
    if (n === 12) {
      const e = op("-", v.total, op("+", v.a, v.b));
      expressions = [e];
      captions = ["括号先形成一个整体"];
      tasks = [
        choose(
          "first",
          `${v.total}－（${v.a}＋${v.b}），应该先算什么法？`,
          ["加法", "减法"],
          0,
          "小括号里的运算先做。",
          "先求括号里两部分的和，再从总数中减。",
        ),
        T(
          "result",
          "最后结果是多少？",
          evaluate(e),
          "先把括号里的和看作一个数。",
          `${v.total}－${v.a + v.b}＝${evaluate(e)}。`,
        ),
      ];
    }
    if (n === 13) {
      const e = op("÷", v.result * v.a * v.b, op("×", v.a, v.b));
      expressions = [e];
      captions = ["先乘成一份，再看总数里有几份"];
      tasks = [
        choose(
          "tree",
          "计算树先算两个数相乘，再用总数除以它。哪种综合算式正确？",
          [
            `${v.result * v.a * v.b}÷（${v.a}×${v.b}）`,
            `${v.result * v.a * v.b}÷${v.a}×${v.b}`,
            `${v.result * v.a * v.b + 10}×${v.a}÷${v.b}`,
          ],
          0,
          "把先求出的乘积放进括号里，除数才是完整的一份。",
          "括号保护先乘后除的计算关系。",
        ),
        T(
          "result",
          "计算树最后得到多少？",
          v.result,
          "先求除数，再计算商。",
          `${exprText(e)}＝${v.result}。`,
        ),
      ];
    }
    spec = { kind: "operations", expressions, captions, working };
    summary = "有括号先括号；没有括号先乘除后加减；只有同级运算，从左往右。";
  } else if (n === 14 || n === 15) {
    const counts = [
      { kind: "正方体", count: v.cube },
      { kind: "长方体", count: v.box },
      { kind: "圆柱", count: v.cylinder },
      { kind: "球", count: v.ball },
    ];
    spec = { kind: "solids", counts, construction: n === 14 ? 1 : 2 };
    tasks = (
      n === 14 ? counts : [counts[1], counts[3], counts[0], counts[2]]
    ).map((c, i) =>
      T(
        "count-" + i,
        `模型中有几个${c.kind}？`,
        c.count,
        "把同类积木拆开，逐个做记号；遮挡的部件也要检查。",
        `${c.kind}有${c.count}个。`,
        { focus: c.kind },
      ),
    );
    summary = "先辨认立体形状，再拆开计数，分类结果的总数要与所有部件相等。";
  } else if (n >= 16 && n <= 18) {
    const nets = shift(
        n === 18
          ? cuboidNets(v.length, v.short)
          : cubeNets(n as 16 | 17, v.edge),
        v.scheme,
      ),
      valid = nets.map((net) => netAnalysis(net).valid);
    spec = {
      kind: "net",
      nets,
      length: n === 18 ? v.length : v.edge,
      short: n === 18 ? v.short : v.edge,
      yaw: v.yaw,
      question: n as 16 | 17 | 18,
    };
    const wanted = valid
      .map((ok, i) => ((n === 17 ? ok : !ok) ? "option-" + i : null))
      .filter((x): x is string => x !== null);
    tasks = [
      T(
        "fold",
        n === 17
          ? "点选所有能折成正方体的展开图，再提交。"
          : `点选不能折成${n === 18 ? "长方体" : "正方体"}的展开图，再提交。`,
        wanted
          .map((id) => String.fromCharCode(65 + Number(id.split("-")[1])))
          .join("、"),
        "逐个折叠观察：六个面能否恰好围住，是否有面重合或缺口？",
        `几何检查：${valid.map((ok, i) => String.fromCharCode(65 + i) + (ok ? "可以围成" : "不能围成")).join("；")}。`,
        { pick: wanted },
      ),
    ];
    summary =
      "有六个面还不够：折起后应覆盖六个不同方向，面不重叠，尺寸也要吻合。实际按棱旋转每个面进行检查。";
  } else if (n === 19) {
    const views: View[] = ["上", "前", "左", "右"],
      voxels: Array<[number, number, number]> = Array.from(
        { length: v.length },
        (_, x) => [x, 0, 0],
      );
    voxels.push([v.length - 1, 1, 0]);
    for (let z = 1; z < v.height; z++) voxels.push([0, 0, z]);
    const target = views[v.view],
      sig = JSON.stringify(voxelView(voxels, target)),
      accepted = views.filter(
        (view) => JSON.stringify(voxelView(voxels, view)) === sig,
      );
    spec = { kind: "view", voxels, target, yaw: v.yaw };
    tasks = [
      T(
        "view",
        "从哪个方向能看到右侧的目标图？如果有多个方向，选一个即可。",
        target,
        "从一个方向看时，前后的方块可能挡住彼此。试着切换观察方向。",
        `目标图可从${accepted.join("、")}面看到。`,
        { options: views, accepted },
      ),
      T(
        "squares",
        "目标图中能看到几个小正方形？",
        voxelView(voxels, target).length,
        "只数投影中露出的方格，不把背后重叠的方块再加一次。",
        `投影共有${voxelView(voxels, target).length}格。`,
      ),
    ];
    summary =
      "立体里的方块数与一个方向看到的方格数不同：被挡住的部分不会在投影里重复出现。";
  } else if (n === 20 || n === 22 || n === 25) {
    const objects =
      n === 20
        ? [
            {
              label: "风扇",
              icon: "fan" as const,
              rotation: v.angle,
              dx: 0,
              dy: 0,
            },
            {
              label: "推拉窗",
              icon: "window" as const,
              rotation: 0,
              dx: v.distance,
              dy: 0,
            },
            {
              label: "电梯",
              icon: "elevator" as const,
              rotation: 0,
              dx: 0,
              dy: -v.distance,
            },
            {
              label: "钟表",
              icon: "clock" as const,
              rotation: v.angle,
              dx: 0,
              dy: 0,
            },
          ]
        : n === 22
          ? [
              {
                label: "被拉动的方块",
                icon: "block" as const,
                rotation: v.angle,
                dx: v.dx,
                dy: v.dy,
              },
            ]
          : shift(
              [
                {
                  label: "风车",
                  icon: "fan" as const,
                  rotation: v.angle,
                  dx: 0,
                  dy: 0,
                },
                {
                  label: "方向盘",
                  icon: "wheel" as const,
                  rotation: v.angle,
                  dx: 0,
                  dy: 0,
                },
                {
                  label: "陀螺",
                  icon: "top" as const,
                  rotation: -v.angle,
                  dx: 0,
                  dy: 0,
                },
              ],
              v.scheme,
            ).map((o) => ({
              ...o,
              rotation: o.rotation * (v.reverse ? -1 : 1),
            }));
    spec = { kind: "motion", objects };
    if (n === 20)
      tasks = objects.map((o, i) =>
        choose(
          "motion-" + i,
          `${o.label}的运动是平移还是旋转？`,
          ["平移", "旋转"],
          o.rotation ? 1 : 0,
          "平移保持方向不变；旋转围绕固定点改变方向。",
          `${o.label}是${o.rotation ? "旋转" : "平移"}。`,
        ),
      );
    else if (n === 22)
      tasks = [
        choose(
          "translation",
          "这个方块从起点移动到终点，是纯平移吗？",
          ["是", "不是"],
          v.angle === 0 ? 0 : 1,
          "检查大小、形状、方向是否都不变。位置变化本身并不够。",
          v.angle === 0
            ? "只移动位置，方向不变，是平移。"
            : "它还改变了方向，所以不是纯平移。",
        ),
      ];
    else {
      const wanted = objects
        .map((o, i) => (o.rotation < 0 ? "option-" + i : null))
        .filter((x): x is string => !!x);
      tasks = [
        T(
          "ccw",
          "点选所有按逆时针方向旋转的物体，再提交。",
          wanted
            .map((id) => String.fromCharCode(65 + Number(id.split("-")[1])))
            .join("、"),
          "沿箭头追踪一个彩色标记点。与钟表指针相反的是逆时针。",
          objects
            .map(
              (o, i) =>
                String.fromCharCode(65 + i) +
                (o.rotation < 0 ? "逆时针" : "顺时针"),
            )
            .join("；") + "。",
          { pick: wanted },
        ),
      ];
    }
    summary =
      "平移不改变物体的大小、形状和方向；旋转绕中心转动。顺时针与钟表指针相同，逆时针相反。";
  } else if (n === 21 || n === 24) {
    const patterns = shift(
      (n === 21
        ? ["star", "aperture", "rings", "windmill"]
        : ["scale", "windmill", "rings", "cross"]) as PatternKind[],
      v.scheme,
    );
    spec = { kind: "symmetry", patterns, angle: v.angle, size: v.size };
    const symmetric = patterns.map((k) => symmetryAxes(k).length > 0);
    if (n === 21)
      tasks = patterns
        .map((_, i) =>
          choose(
            "sym-" + i,
            `图${i + 1}是轴对称图形吗？`,
            ["是", "不是"],
            symmetric[i] ? 0 : 1,
            "沿可能的对称轴对折，检查两边能否完全重合。有旋转规律不一定有对称轴。",
            `图${i + 1}${symmetric[i] ? "能找到对称轴" : "没有能使两边重合的对称轴"}。`,
          ),
        )
        .map((t, i) => ({ ...t, focus: "pattern-" + i }));
    else {
      const wanted = symmetric
        .map((ok, i) => (ok ? "option-" + i : null))
        .filter((x): x is string => !!x);
      tasks = [
        T(
          "symmetries",
          "点选所有轴对称图形，再提交。",
          wanted.map((id) => String(Number(id.split("-")[1]) + 1)).join("、"),
          "每个图形都用对折检查，不能只看它能不能旋转重合。",
          `可对折重合的是图${wanted.map((id) => String(Number(id.split("-")[1]) + 1)).join("、")}。`,
          { pick: wanted },
        ),
      ];
    }
    summary = "轴对称要求沿一条直线对折后完全重合，不能把旋转对称当成轴对称。";
  } else {
    const target = { angle: v.angle, size: v.size, mirror: false },
      options = shift(
        [
          { angle: v.angle, size: v.size, mirror: false },
          { angle: v.angle, size: v.size, mirror: true },
          { angle: v.angle, size: v.size, mirror: false },
          { angle: v.angle, size: v.size, mirror: false },
          { angle: v.angle - 50, size: v.size, mirror: false },
          { angle: v.angle + 50, size: v.size, mirror: false },
          { angle: v.angle, size: v.size, mirror: false },
        ],
        v.scheme,
      );
    spec = { kind: "roses", target, options };
    const wanted = options
      .map((o, i) => (canTranslate(o, target) ? "option-" + i : null))
      .filter((s): s is string => !!s);
    tasks = [
      T(
        "roses",
        "点选所有只用平移就能与目标玫瑰重合的花朵，再提交。",
        wanted
          .map((id) => String.fromCharCode(65 + Number(id.split("-")[1])))
          .join("、"),
        "平移不能转动、翻面或缩放。仔细看茎的方向和左右叶片。",
        `符合的是${wanted.map((id) => String.fromCharCode(65 + Number(id.split("-")[1]))).join("、")}。`,
        { pick: wanted },
      ),
    ];
    summary =
      "只移动位置，才是平移；需要转动、翻面或改变大小，就不能只靠平移重合。";
  }
  const frames = [
    {
      text:
        spec.kind === "net"
          ? "先观察展开图的六个面与相连的棱。选项可逐一切换。"
          : spec.kind === "groups"
            ? story
            : spec.kind === "operations"
              ? "每个数字卡片有自己的位置。先观察括号与运算层次，不急着从左一路算下去。"
              : "先看物体的位置、单位和题目给出的条件。",
      duration: 1800,
    },
    {
      text:
        spec.kind === "net"
          ? "每个面围绕相连的棱转动，看看六个面能否恰好围住。"
          : spec.kind === "symmetry"
            ? "沿虚线对折观察。检查形状的两边是否完全重合。"
            : spec.kind === "view"
              ? "观察视角逐渐改变。注意前后遮挡与投影的关系。"
              : spec.kind === "groups"
                ? "现在移动并分组。相同的每一份都不能漏掉，试着用两种方法表示。"
                : spec.kind === "mass"
                  ? "拆开或合并有标注单位的质量块。每个块代表标出的质量，不一定是1克或1千克。"
                  : "看物体怎样移动或合并。接下来先自己操作和作答。",
      duration: 2400,
    },
  ];
  // Keep the original PDF order for default numbers; edited exercises vary choice position.
  if (fields(book, number).some((f) => values[f.key] !== f.value)) {
    const seed =
      Object.values(values).reduce((sum, value) => sum + value, 0) + number;
    tasks = tasks.map((task) => {
      if (!task.options || task.options.length < 2) return task;
      const rotation = (Math.abs(seed) % (task.options.length - 1)) + 1;
      const choices = shift(task.options, rotation);
      if (spec.kind === "operations" && spec.working && task.id === "correct") {
        const correct = choices.indexOf(task.answer);
        const renamed = choices.map(
          (text, i) => String.fromCharCode(65 + i) + text.slice(1),
        );
        spec.expressions = shift(spec.expressions, rotation);
        spec.captions = shift(spec.captions, rotation);
        spec.working = renamed;
        return {
          ...task,
          options: renamed,
          answer: renamed[correct],
          explanation:
            String.fromCharCode(65 + correct) +
            "按从左往右计算；其余示例的第一步改变了运算关系。",
        };
      }
      return { ...task, options: choices };
    });
  }
  return {
    id: (book === "a" ? 100 : 200) + number,
    title,
    topic:
      spec.kind === "mass" || spec.kind === "ruler"
        ? "单位与测量"
        : spec.kind === "groups" || spec.kind === "race" || spec.kind === "bus"
          ? "数量关系"
          : spec.kind === "operations"
            ? "运算顺序"
            : "空间与运动",
    story,
    scene: { type: "extension", spec, frames },
    tasks,
    summary,
  };
}
export function variant(
  book: Book,
  n: number,
  v: Record<string, number>,
  excluded: Lesson[] = [],
): Lesson {
  const base = build(book, n, v),
    seen = new Set(
      [base, ...excluded].map((l) =>
        JSON.stringify({ scene: l.scene, tasks: l.tasks }),
      ),
    ),
    seenTasks = new Set(
      [base, ...excluded].flatMap((l) =>
        l.tasks.map((t) =>
          JSON.stringify({ prompt: t.prompt, answer: t.answer, pick: t.pick }),
        ),
      ),
    );
  for (const field of fields(book, n)) {
    const candidates = [
      ...Array.from(
        {
          length: Math.min(
            6,
            Math.floor((field.max - field.min) / (field.step ?? 1)) + 1,
          ),
        },
        (_, i) => v[field.key] + (i + 1) * (field.step ?? 1),
      ),
      ...Array.from(
        { length: Math.floor((field.max - field.min) / (field.step ?? 1)) + 1 },
        (_, i) => field.min + i * (field.step ?? 1),
      ),
    ];
    for (const num of candidates) {
      const values = { ...v, [field.key]: num };
      if (validate(book, n, values).length) continue;
      const l = build(book, n, values);
      if (seen.has(JSON.stringify({ scene: l.scene, tasks: l.tasks })))
        continue;
      const fresh = l.tasks.filter(
        (t) =>
          !seenTasks.has(
            JSON.stringify({
              prompt: t.prompt,
              answer: t.answer,
              pick: t.pick,
            }),
          ),
      );
      if (fresh.length)
        return { ...l, tasks: excluded.length ? [fresh[0]] : fresh };
    }
  }
  // Geometric measurements may change without changing a yes/no classification; the independent visual model still differs.
  for (const field of fields(book, n))
    for (let num = field.min; num <= field.max; num += field.step ?? 1) {
      const values = { ...v, [field.key]: num };
      if (validate(book, n, values).length) continue;
      const l = build(book, n, values);
      if (!seen.has(JSON.stringify({ scene: l.scene, tasks: l.tasks })))
        return excluded.length ? { ...l, tasks: [l.tasks[0]] } : l;
    }
  throw Error("No valid independent variant");
}
