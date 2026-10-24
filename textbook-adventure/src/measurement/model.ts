export type Kind =
  | "ruler"
  | "units"
  | "fold"
  | "overlap"
  | "track"
  | "journey"
  | "route"
  | "scale"
  | "boat";
export type N = { a: number; b: number; c: number };
export type Param = {
  key: keyof N;
  label: string;
  min: number;
  max: number;
  options?: string[];
};
export type Lesson = {
  id: Kind;
  title: string;
  icon: string;
  page: string;
  source: string;
  goal: string;
  seed: N;
  practice: N;
  transfer: N;
  easy: N;
  params: Param[];
  reason: string;
  misconception: string;
};
const number = (
  key: keyof N,
  label: string,
  min: number,
  max: number,
): Param => ({ key, label, min, max });
export const conversions = [
  ["厘米", "毫米", 10],
  ["分米", "厘米", 10],
  ["米", "分米", 10],
  ["千米", "米", 1000],
  ["千克", "克", 1000],
  ["吨", "千克", 1000],
] as const;
export const lessons: Lesson[] = [
  {
    id: "ruler",
    title: "尺子侦探",
    icon: "📏",
    page: "20～23",
    source:
      "读尺、从非零刻度测量、按指定长度画线段。截图缩放不能作为实物尺寸；本课使用设定长度的原创线段。",
    goal: "长度是两个端点读数的差，不一定是末端读数。",
    seed: { a: 10, b: 50, c: 0 },
    practice: { a: 20, b: 35, c: 0 },
    transfer: { a: 30, b: 28, c: 0 },
    easy: { a: 10, b: 20, c: 0 },
    params: [
      number("a", "起点刻度（毫米）", 0, 40),
      number("b", "物品长度（毫米）", 5, 80),
    ],
    reason: "起点不是0时，终点读数减去起点读数才是长度。",
    misconception: "把终点读数当长度",
  },
  {
    id: "units",
    title: "单位变换车间",
    icon: "🧩",
    page: "20～25、32～37",
    source:
      "1厘米＝10毫米；1分米＝10厘米；1米＝10分米；1千米＝1000米；1千克＝1000克；1吨＝1000千克。",
    goal: "物品没有变，选择的单位变小，表示它的数变大。",
    seed: { a: 3, b: 0, c: 0 },
    practice: { a: 6, b: 1, c: 0 },
    transfer: { a: 4, b: 3, c: 0 },
    easy: { a: 2, b: 0, c: 0 },
    params: [
      number("a", "大单位的个数", 1, 9),
      {
        ...number("b", "换算关系", 0, 5),
        options: conversions.map(([u, v, k]) => `1${u}＝${k}${v}`),
      },
    ],
    reason: "每个大单位可以换成相应数量的小单位，实际长度或质量没有改变。",
    misconception: "换算方向或进率混淆",
  },
  {
    id: "fold",
    title: "折绳实验室",
    icon: "🪢",
    page: "22、24",
    source: "4分米的绳子对折后再对折，求每段长度。另有2米木料平均分4段。",
    goal: "每次对折让段数加倍，每段长度减半，总长不变。",
    seed: { a: 40, b: 2, c: 0 },
    practice: { a: 80, b: 2, c: 0 },
    transfer: { a: 200, b: 2, c: 0 },
    easy: { a: 20, b: 2, c: 0 },
    params: [
      number("a", "绳子总长（厘米）", 8, 240),
      number("b", "对折次数", 1, 3),
    ],
    reason: "对折后的等长段数是2、4、8；总长除以段数得到每段长度。",
    misconception: "把对折次数当成段数",
  },
  {
    id: "overlap",
    title: "木板拼接站",
    icon: "🪵",
    page: "24",
    source: "两块各8分米的木板，重叠15厘米。求拼接后的总长度。",
    goal: "重叠的部分被算了两次，所以只减去一次。",
    seed: { a: 80, b: 80, c: 15 },
    practice: { a: 60, b: 50, c: 10 },
    transfer: { a: 40, b: 35, c: 5 },
    easy: { a: 20, b: 20, c: 5 },
    params: [
      number("a", "第一块长（厘米）", 10, 100),
      number("b", "第二块长（厘米）", 10, 100),
      number("c", "重叠长（厘米）", 1, 50),
    ],
    reason: "先把两块长度相加，再减掉重复计算的一段重叠长度。",
    misconception: "忽略或重复扣除重叠部分",
  },
  {
    id: "track",
    title: "跑道与游泳池",
    icon: "🏊",
    page: "25、27",
    source: "跑道每圈400米，跑5圈；泳池长50米，游1千米需要几个来回。",
    goal: "一个来回含去和回两程，不能只算一程。",
    seed: { a: 50, b: 10, c: 1 },
    practice: { a: 25, b: 4, c: 1 },
    transfer: { a: 400, b: 5, c: 0 },
    easy: { a: 10, b: 3, c: 1 },
    params: [
      number("a", "单程或一圈长（米）", 10, 500),
      number("b", "来回或圈数", 1, 10),
      {
        ...number("c", "运动方式", 0, 1),
        options: ["绕跑道一圈", "游泳一个来回"],
      },
    ],
    reason: "来回要把单程长度算两次，绕跑道一圈只算一圈长度。",
    misconception: "把来回当作单程",
  },
  {
    id: "journey",
    title: "准时到校挑战",
    icon: "🚌",
    page: "26～28",
    source:
      "到校3千米，每分钟约100米，7:00出发，7:45能到吗？长途车308千米、每小时80千米、8时到12时。",
    goal: "统一单位，比较可走路程与目的地距离。速度是题设估计，不代表所有人。",
    seed: { a: 3000, b: 100, c: 45 },
    practice: { a: 2400, b: 80, c: 20 },
    transfer: { a: 3200, b: 80, c: 40 },
    easy: { a: 600, b: 100, c: 10 },
    params: [
      number("a", "目标路程（米）", 100, 6000),
      number("b", "每分钟走多少米", 10, 200),
      number("c", "可用时间（分钟）", 1, 60),
    ],
    reason: "用每单位时间走的距离乘可用时间，再与目标路程比较。",
    misconception: "单位不统一或只比较数字",
  },
  {
    id: "route",
    title: "路线规划师",
    icon: "🗺️",
    page: "30",
    source:
      "小军家到少年宫：超市路线500＋600＋900；花园医院路线600＋500＋900；花园宾馆路线600＋920＋300。",
    goal: "距离由道路标注相加，不能看图上的直线长短。",
    seed: { a: 500, b: 600, c: 920 },
    practice: { a: 400, b: 500, c: 600 },
    transfer: { a: 200, b: 900, c: 300 },
    easy: { a: 100, b: 100, c: 100 },
    params: [
      number("a", "家→超市（米）", 100, 1000),
      number("b", "家→花园（米）", 100, 1000),
      number("c", "花园→宾馆（米）", 100, 1000),
    ],
    reason: "把每条可行路线的路段相加，比较总距离，选最小的。",
    misconception: "凭图形外观判断最短路线",
  },
  {
    id: "scale",
    title: "水果称重铺",
    icon: "⚖️",
    page: "32～35",
    source:
      "认识秤面刻度、先估再称、比较轻重。为避免猜测截图小刻度，本课使用明确标注的示例质量。",
    goal: "先看单位和每格表示多少，再读指针；大小不一定代表轻重。",
    seed: { a: 200, b: 150, c: 0 },
    practice: { a: 350, b: 200, c: 0 },
    transfer: { a: 500, b: 300, c: 0 },
    easy: { a: 100, b: 50, c: 0 },
    params: [
      number("a", "苹果质量（克，50的倍数）", 50, 1000),
      number("b", "橙子质量（克，50的倍数）", 50, 1000),
    ],
    reason: "用秤读出的质量比较，较重的质量减去较轻的质量得到相差多少克。",
    misconception: "看外观判断质量或读错刻度",
  },
  {
    id: "boat",
    title: "曹冲的水线实验",
    icon: "⛵",
    page: "31、36",
    source:
      "同一条船，替换物品后回到同一水线，分批称出石头质量相加。教材没有给出大象质量；本课数字均为模拟实验。",
    goal: "保持船和水不变，用等量替换把不能直接称的质量拆开称。",
    seed: { a: 1000, b: 200, c: 0 },
    practice: { a: 1200, b: 200, c: 0 },
    transfer: { a: 800, b: 100, c: 0 },
    easy: { a: 600, b: 200, c: 0 },
    params: [
      number("a", "模拟目标载荷（千克）", 200, 2000),
      number("b", "每袋石头（千克）", 50, 500),
    ],
    reason:
      "同一条船回到相同水线时，替换的载荷质量相等；总质量是各袋质量之和。",
    misconception: "把物品体积或袋数当质量",
  },
];
export function validate(k: Kind, n: N): string {
  const l = lessons.find((x) => x.id === k)!;
  for (const p of l.params)
    if (!Number.isInteger(n[p.key]) || n[p.key] < p.min || n[p.key] > p.max)
      return `${p.label}需为${p.min}～${p.max}的整数。`;
  if (k === "ruler" && n.a + n.b > 100)
    return "终点不能超过100毫米，请缩短物品或移动起点。";
  if (k === "fold" && n.a % 2 ** n.b)
    return "请选能平均分成这些段的整厘米长度。";
  if (k === "overlap" && n.c >= Math.min(n.a, n.b))
    return "重叠必须小于每一块木板的长度。";
  if (k === "scale" && (n.a < n.b || n.a % 50 || n.b % 50))
    return "本课设定苹果不轻于橙子，质量使用50克的倍数。";
  if (k === "boat" && (n.a % n.b || n.a / n.b > 10))
    return "目标载荷要能整分为1～10袋石头。";
  return "";
}
export function routes(n: N) {
  return [
    n.a + 600 + 900,
    n.b + 500 + 900,
    n.b + n.c + 300,
    n.a + 600 + 500 + n.c + 300,
  ];
}
export const routeNames = [
  "家→超市→医院→少年宫",
  "家→花园→医院→少年宫",
  "家→花园→宾馆→少年宫",
  "家→超市→医院→花园→宾馆→少年宫",
];
export type Step = {
  title: string;
  text: string;
  question: string;
  answer: number;
  unit: string;
  hint: string;
  explain: string;
  choices?: { value: number; label: string }[];
};
export function steps(k: Kind, n: N): Step[] {
  const { a, b, c } = n;
  const s = (
    title: string,
    text: string,
    question: string,
    answer: number,
    unit: string,
    hint: string,
    explain: string,
  ): Step => ({ title, text, question, answer, unit, hint, explain });
  switch (k) {
    case "ruler":
      return [
        s(
          "先找起点",
          "尺子的边不等于0刻度。观察物品左端对着哪条线。",
          "起点读数是多少毫米？",
          a,
          "毫米",
          "看左端的虚线，不看右端。",
          `左端对着${a}毫米。`,
        ),
        s(
          "再找终点",
          "放大看刻度，每一小格是1毫米。",
          "终点读数是多少毫米？",
          a + b,
          "毫米",
          "大格和小格一起数，10毫米是1厘米。",
          `右端对着${a + b}毫米。`,
        ),
        s(
          "数两端之间的距离",
          "从起点数到终点，已经经过的那一段才是物品长度。",
          "物品长多少毫米？",
          b,
          "毫米",
          "起点不是0，末端读数包含前面空着的一段。",
          `${a + b}−${a}＝${b}毫米。`,
        ),
      ];
    case "units": {
      const [u, v, f] = conversions[b];
      return [
        s(
          "选一份大单位",
          `一条带子代表1${u}，长度或质量固定不变。`,
          `1${u}等于多少${v}？`,
          f,
          v,
          "先想这一对单位的进率；千字常提醒我们1000。",
          `1${u}＝${f}${v}。`,
        ),
        s(
          "把每份拆开",
          `现在有${a}份，每份换成${f}${v}。`,
          `一共有多少${v}？`,
          a * f,
          v,
          "先求每份多少，再求几份。",
          `${a}×${f}＝${a * f}${v}。`,
        ),
        s(
          "再合回去",
          "把小单位重新归成完整的大单位，检查总量没有变。",
          `${a * f}${v}等于多少${u}？`,
          a,
          u,
          "小单位的数除以进率。",
          `${a * f}÷${f}＝${a}${u}。`,
        ),
      ];
    }
    case "fold":
      return [
        s(
          "量好整根绳",
          "先看原来的总长，不剪掉任何部分。",
          "原绳总长多少厘米？",
          a,
          "厘米",
          "题目给出的总长是一整根。",
          `整根长${a}厘米。`,
        ),
        s(
          "第一次对折",
          "把右端拉到左端，两半重合，绳子没有变短。",
          "对折一次后，每段长多少厘米？",
          a / 2,
          "厘米",
          "对折一次分成两个相等部分。",
          `${a}÷2＝${a / 2}厘米。`,
        ),
        s(
          "完成全部对折",
          `总共对折${b}次。数一数重合了多少段。`,
          "最后每段长多少厘米？",
          a / 2 ** b,
          "厘米",
          "每对折一次，段数都加倍，不是加1。",
          `${b}次对折有${2 ** b}段，${a}÷${2 ** b}＝${a / 2 ** b}厘米。`,
        ),
      ];
    case "overlap":
      return [
        s(
          "统一单位",
          "两块木板都用厘米表示，先首尾相接。",
          "还没有重叠时，两块一共长多少厘米？",
          a + b,
          "厘米",
          "相接时两块都完整算入。",
          `${a}＋${b}＝${a + b}厘米。`,
        ),
        s(
          "推进重叠处",
          `把第二块向左推进${c}厘米。颜色重合的区域只能算一遍。`,
          "重复计算了多少厘米？",
          c,
          "厘米",
          "数的是重叠的一段，不是两块板上各减一次。",
          `重复的一段是${c}厘米。`,
        ),
        s(
          "数实际覆盖长度",
          "从最左端量到最右端；重叠处仍是一段距离。",
          "拼接后长多少厘米？",
          a + b - c,
          "厘米",
          "相加后减去重复的那一段。",
          `${a}＋${b}−${c}＝${a + b - c}厘米。`,
        ),
      ];
    case "track":
      return [
        s(
          "先认一程",
          c ? "从泳池一端游到另一端是一程。" : "沿跑道走完一圈，回到起点。",
          c ? "一程长多少米？" : "一圈长多少米？",
          a,
          "米",
          "只看题目给的一程或一圈。",
          `是${a}米。`,
        ),
        s(
          "认清一次运动",
          c
            ? "去一次，再回来一次，才叫一个来回。"
            : "一圈就是完整走一周，不再额外乘2。",
          c ? "一个来回多少米？" : "一圈多少米？",
          a * (c + 1),
          "米",
          c ? "去和回都要算。" : "跑一圈与游一个来回的条件不同。",
          `${a}×${c + 1}＝${a * (c + 1)}米。`,
        ),
        s(
          "累计路程",
          `完成${b}${c ? "个来回" : "圈"}，里程表持续累加。`,
          "总共走了多少米？",
          a * (c + 1) * b,
          "米",
          "每次的距离乘次数。",
          `${a * (c + 1)}×${b}＝${a * (c + 1) * b}米。`,
        ),
      ];
    case "journey": {
      const unit = "米",
        time = "分钟";
      return [
        s(
          "圈出时间条件",
          `目标${a}${unit}，每${time}约${b}${unit}，可用${c}${time}。`,
          `可用时间是多少${time}？`,
          c,
          time,
          "用出发和截止时刻之间的时间，不把时刻直接相乘。",
          `可用${c}${time}。`,
        ),
        s(
          "边走边累计",
          "每过一个单位时间，都增加相同距离。",
          `可用时间内可行进多少${unit}？`,
          b * c,
          unit,
          "时间有几份，就有几份每次走的距离。",
          `${b}×${c}＝${b * c}${unit}。`,
        ),
        {
          ...s(
            "比较能否到达",
            "按题设平均速度，不计额外停留；比较能走的距离和目标。",
            "按题设能按时到达吗？",
            Number(b * c >= a),
            "",
            "能走的距离至少等于目标才够。",
            `${b * c}${b * c >= a ? "≥" : "＜"}${a}，${b * c >= a ? "能" : "不能"}按时到达。`,
          ),
          choices: [
            { value: 1, label: "能到达" },
            { value: 0, label: "不能到达" },
          ],
        },
      ];
    }
    case "route": {
      const r = routes(n);
      return [
        s(
          "走超市路线",
          "每到一站，就把刚走过的路段累加。",
          "家→超市→医院→少年宫共多少米？",
          r[0],
          "米",
          `这条路经过${a}、600、900三个路段。`,
          `${a}＋600＋900＝${r[0]}米。`,
        ),
        s(
          "换花园路线",
          "比较另一条经过花园、医院的路线。",
          "家→花园→医院→少年宫共多少米？",
          r[1],
          "米",
          "只加本条路径经过的路段。",
          `${b}＋500＋900＝${r[1]}米。`,
        ),
        s(
          "试遍可行路线",
          "点击地图下方的路线，分别走一走；所有路段都是双向，且不绕圈。",
          "最短路线是多少米？",
          Math.min(...r),
          "米",
          "还可以经过花园和宾馆，注意不要漏掉可行路线。",
          `四条不绕圈路线分别为${r.join("、")}米，最短${Math.min(...r)}米。`,
        ),
      ];
    }
    case "scale":
      return [
        s(
          "先读单位与小格",
          "满量程1000克，共20小格，每格50克。放上苹果，观察指针。",
          "苹果重多少克？",
          a,
          "克",
          "从0起数小格，每格50克，不能把格数当克数。",
          `指针在${a / 50}格：${a / 50}×50＝${a}克。`,
        ),
        s(
          "换上橙子",
          "拿走苹果，再称橙子。先猜轻重，再看秤。",
          "橙子重多少克？",
          b,
          "克",
          "换物品后重新读数；颜色和大小不是质量。",
          `橙子重${b}克。`,
        ),
        s(
          "比较质量",
          "两个盘子表示比较，较重的一侧下降。",
          "苹果比橙子重多少克？",
          a - b,
          "克",
          "比较相差多少用减法。",
          `${a}−${b}＝${a - b}克。`,
        ),
      ];
    case "boat":
      return [
        {
          ...s(
            "先做水线标记",
            "同一条船和同一池水。大象上船后标记船身接触水面的位置。",
            "大象上船后，船会怎样？",
            1,
            "",
            "载荷增加，船要排开更多水。",
            "载荷增加，船会下沉，然后标记水线。",
          ),
          choices: [
            { value: 1, label: "下沉" },
            { value: 0, label: "上升" },
          ],
        },
        s(
          "用石头替换",
          "大象下船。逐袋放石头，观察船身何时回到红色水线。",
          "恢复红色水线时共放了几袋？",
          a / b,
          "袋",
          "看船身标记与水面是否对齐；不是看石头是否堆得和大象一样高。",
          `放入${a / b}袋时回到原水线。`,
        ),
        s(
          "分批称出总量",
          `每袋石头${b}千克，称一袋就记一袋。模拟中各袋相同。`,
          "模拟大象的质量是多少千克？",
          a,
          "千克",
          "袋数不是质量；每袋质量乘袋数。",
          `${a / b}×${b}＝${a}千克。`,
        ),
      ];
  }
}
export function target(k: Kind, n: N) {
  return steps(k, n)[2].answer;
}
export function problem(k: Kind, n: N): string {
  const { a, b, c } = n;
  switch (k) {
    case "ruler":
      return `一条彩带的左端对着${a}毫米，右端对着${a + b}毫米，长多少毫米？`;
    case "units": {
      const [u, v, f] = conversions[b];
      return `${a * f}${v}等于多少${u}？`;
    }
    case "fold":
      return `${a}厘米绳子对折${b}次，每段长多少厘米？`;
    case "overlap":
      return `两条纸带长${a}厘米和${b}厘米，重叠${c}厘米，拼接后长多少厘米？`;
    case "track":
      return c
        ? `池长${a}米，游${b}个来回，总路程多少米？`
        : `一圈${a}米，跑${b}圈，共多少米？`;
    case "journey":
      return `目标${a}个长度单位，每单位时间走${b}，可用${c}个时间单位，能否到达？（能填1，不能填0）`;
    case "route":
      return `四条路线长分别为${routes(n).join("、")}米，最短多少米？`;
    case "scale":
      return `一袋米${a}克，一袋豆${b}克，相差多少克？`;
    case "boat":
      return `使用同一浮盆，${a / b}袋每袋${b}克的盐替换花盆，恰好回到原水线。花盆多少克？`;
  }
}
