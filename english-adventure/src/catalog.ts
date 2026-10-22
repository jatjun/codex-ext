import type { Art, Kind, Lesson, Option, Task } from "./types";
const option = (label: string, art?: Art, id = label): Option => ({
  id,
  label,
  art,
});
const choice = (
  id: string,
  prompt: string,
  options: Option[],
  answer: string,
  scene: Art,
  explain: string,
  extra: Partial<Task> = {},
): Task => ({
  id,
  mode: "choice",
  prompt,
  options,
  answer: [answer],
  scene,
  explain,
  hint: "先想清楚场景或词义，再完整读一遍，不只看第一个字母。",
  ...extra,
});
const fill = (
  id: string,
  prompt: string,
  answer: string,
  scene: Art,
  extra: Partial<Task> = {},
): Task => ({
  id,
  mode: "fill",
  prompt,
  answer: [answer],
  scene,
  explain: `这里的单词是 ${answer}。看清字母顺序，再完整读一次。`,
  hint: "从头到尾检查字母，别漏掉重复的字母。",
  ...extra,
});
const order = (
  id: string,
  prompt: string,
  tokens: string[],
  answer: string,
  scene: Art,
): Task => ({
  id,
  mode: "order",
  prompt,
  tokens,
  answer: [answer],
  scene,
  explain: `${answer} 把句子从头读到尾，检查意思和标点。`,
  hint: "先找招呼语或句首，再找动作和后面的内容。",
});
const say = (
  id: string,
  prompt: string,
  listen: string[],
  scene: Art,
  example: string,
  checks = ["我按顺序读完了", "我愿意再听一次，核对没把握的词"],
): Task => ({
  id,
  mode: "say",
  prompt,
  listen,
  scene,
  example,
  checks,
  explain:
    "口语由自己检查，不自动判断口音、音准或流利程度。可以请家长一起听听。",
  hint: "先听一小句，再自己说。读名字不需要急。",
});
const count = (id: string, letters: string[], target: string): Task => ({
  id,
  mode: "count",
  prompt: `点出所有${target === target.toUpperCase() ? "大写" : "小写"} ${target}，再写出数量。`,
  letters,
  target,
  caseSensitive: true,
  scene: "play",
  explain: `${target} 和 ${target === target.toUpperCase() ? target.toLowerCase() : target.toUpperCase()} 是不同大小写。逐个标记，不重复，也不遗漏。`,
  hint: "先看大小写，再看字母的形状。可以再点一次，取消多选的字母。",
});
const wordChoice = (
  id: string,
  target: Art,
  labels: Art[],
  listen?: string[],
): Task =>
  choice(
    id,
    listen ? "先听一听，再选对应的图片或单词。" : "看动画，选出对应的单词。",
    labels.map((x) => option(x, x)),
    target,
    target,
    `${target} 是这里需要的单词。结合完整读音和图片来记。`,
    listen ? { listen } : {},
  );
const greetings = [
  option("Hello! I'm John.", "hello"),
  option("Bye!", "bye"),
  option("Hi! I'm Chen Jie.", "self"),
];
const retryWord = () =>
  wordChoice("retry-puppy", "puppy", ["kitten", "puppy", "piglet"]);
const transferWord = () =>
  wordChoice("transfer-bear", "bear", ["bee", "bear", "apple"]);
const helloRetry = () =>
  choice(
    "retry-hello",
    "刚见面，可以说什么？",
    [option("Hello!", "hello"), option("Goodbye!", "bye")],
    "Hello!",
    "hello",
    "见面时用Hello或Hi，离开时用Bye或Goodbye。",
  );
const helloTransfer = () =>
  choice(
    "transfer-bye",
    "准备离开，哪句话更合适？",
    [option("Goodbye!", "bye"), option("I'm Alex.", "self")],
    "Goodbye!",
    "bye",
    "告别时用Goodbye。",
  );
const listenRetry = () =>
  wordChoice(
    "retry-listen-ruler",
    "ruler",
    ["ruler", "pencil", "book"],
    ["ruler"],
  );
const listenTransfer = () =>
  wordChoice(
    "transfer-listen-puppy",
    "puppy",
    ["piglet", "kitten", "puppy"],
    ["puppy"],
  );
const variants = (kind: Kind): [Task, Task] => {
  if (kind === "letters")
    return [
      count("retry-count", ["b", "B", "b", "p", "b", "B"], "b"),
      count("transfer-count", ["a", "A", "a", "A", "A", "a", "A", "A"], "A"),
    ];
  if (kind === "greeting") return [helloRetry(), helloTransfer()];
  if (kind === "listen") return [listenRetry(), listenTransfer()];
  if (kind === "sentence")
    return [
      order(
        "retry-order",
        "排好这句自我介绍。",
        ["I'm", "Pip."],
        "I'm Pip.",
        "self",
      ),
      order(
        "transfer-order",
        "把邀请排成句子。",
        ["Let's", "read", "together."],
        "Let's read together.",
        "play",
      ),
    ];
  if (kind === "phonics")
    return [
      choice(
        "retry-b",
        "哪个单词和bee一样以 /b/ 开头？",
        [option("bear", "bear"), option("apple", "apple")],
        "bear",
        "bear",
        "bee和bear的开头都是 /b/。",
        { listen: ["bee", "bear", "apple"] },
      ),
      choice(
        "transfer-a",
        "哪个单词和ant一样以 /æ/ 开头？",
        [option("apple", "apple"), option("bee", "bee")],
        "apple",
        "apple",
        "ant和apple的开头都是 /æ/。",
        { listen: ["ant", "apple", "bee"] },
      ),
    ];
  return [retryWord(), transferWord()];
};
export const lessons: Lesson[] = [];
function add(
  book: number,
  title: string,
  subtitle: string,
  kind: Kind,
  tasks: Task[],
  note?: string,
  custom?: [Task, Task],
) {
  const number = lessons.filter((l) => l.book === book).length + 1;
  const [retry, transfer] = custom || variants(kind);
  lessons.push({
    id: `en-${book}-${number}`,
    book,
    number,
    title,
    subtitle,
    kind,
    tasks,
    retry,
    transfer,
    note,
  });
}
add(1, "王冠里的 q", "Queen’s garden", "word", [
  choice(
    "queen-gap",
    "给 __ueen 补上开头字母。",
    [option("k"), option("q"), option("p")],
    "q",
    "queen",
    "queen 是女王。开头写 q，后面接 ueen。",
    { caseSensitive: true },
  ),
]);
add(
  1,
  "认识三位朋友",
  "Hello, new friends",
  "greeting",
  [
    say(
      "names",
      "听一遍，再按图片顺序读出三位课本人物的名字。",
      ["Sarah", "Chen Jie", "John"],
      "self",
      "Sarah, Chen Jie, John",
    ),
  ],
  "人物为教材虚构角色，插画原创。浏览器可能不能准确读出中文姓名的英语音译；不据此给孩子判错。",
  [
    say(
      "retry-name",
      "听一听，再介绍虚构的小伙伴。",
      ["I'm Pip."],
      "self",
      "I'm Pip.",
    ),
    say(
      "transfer-name",
      "试着用Alex介绍自己这个虚构角色。",
      ["Hello! I'm Alex."],
      "self",
      "Hello! I'm Alex.",
    ),
  ],
);
add(1, "放学说再见", "See you soon", "greeting", [
  choice(
    "bye-context",
    "向别人告别时，你可以说：",
    greetings,
    "Bye!",
    "bye",
    "Bye! 表示再见。Hello和Hi是见面打招呼。",
  ),
]);
add(1, "见面小剧场", "Meet John and Sarah", "greeting", [
  say(
    "dialogue",
    "听一小句，停下来，再自己跟读。",
    ["Hello! I'm John.", "Hi! I'm Sarah."],
    "hello",
    "Hello! I'm John. Hi! I'm Sarah.",
    [
      "我读出了John和Sarah的名字",
      "我能用Hello或Hi打招呼",
      "我知道I’m表示“我是”",
    ],
  ),
]);
add(1, "听到哪种招呼", "Listen and wave", "listen", [
  choice(
    "listen-bye",
    "听英语，再选择对应的场景。",
    [
      option("见面打招呼", "hello", "hello"),
      option("离开时告别", "bye", "bye"),
      option("伤心哭泣", "cry", "cry"),
    ],
    "bye",
    "bye",
    "听力中的bye表示再见，所以对应告别场景。",
    { listen: ["Bye!"] },
  ),
]);
add(1, "自我介绍小火车", "Put words together", "sentence", [
  order(
    "intro-order",
    "把词卡排成一句完整的自我介绍。",
    ["Hello!", "I'm", "Li Dong."],
    "Hello! I'm Li Dong.",
    "self",
  ),
]);
add(1, "门口挥挥手", "A goodbye at the door", "greeting", [
  choice(
    "picture-bye",
    "小朋友背上书包，离开教室向伙伴挥手，哪句话合适？",
    greetings,
    "Bye!",
    "bye",
    "这是离开教室的告别，选Bye。",
  ),
]);
add(1, "把问好写下来", "Listen and write", "listen", [
  fill(
    "write-hello",
    "看见面场景，听录音，再写出问好的单词。",
    "hello",
    "hello",
    { listen: ["hello"], answer: ["hello", "Hello"] },
  ),
]);
add(1, "眨眨小眼睛", "My bright eye", "word", [
  choice(
    "eye",
    "This is my ____.",
    [option("eye", "eye"), option("dog", "dog"), option("owl", "owl")],
    "eye",
    "eye",
    "eye是眼睛。This is my eye. 这是我的眼睛。",
  ),
]);
add(
  1,
  "果酱的开头音",
  "Jam and a gentle buzz",
  "phonics",
  [
    choice(
      "jam-voice",
      "jam 中 j 的发音 /dʒ/ 是浊辅音。这个说法对吗？",
      [option("对", "jam", "true"), option("不对", "jam", "false")],
      "true",
      "jam",
      "/dʒ/ 是浊塞擦音，读音时声带振动；它不是字母名 jay /dʒeɪ/。可以轻触喉咙观察读jam时的感觉。",
      { listen: ["jam"] },
    ),
  ],
  "没有原录音；合成朗读完整单词jam，不用浏览器伪造孤立音标的标准发音。",
);
add(1, "小写 b 泡泡", "Bubble letter detective", "letters", [
  count("small-b", ["B", "b", "A", "b", "B", "b", "B", "a", "b", "B"], "b"),
]);
add(
  1,
  "墨水会滴答",
  "A drop of ink",
  "word",
  [
    choice(
      "ink-match",
      "图里是墨水，ink的拼写与图片匹配吗？",
      [option("匹配", "ink", "true"), option("不匹配", "ink", "false")],
      "true",
      "ink",
      "ink就是墨水，字母顺序为 i-n-k。",
    ),
  ],
  undefined,
  [
    fill("retry-ink", "墨水的单词是 i__k，写完整单词。", "ink", "ink"),
    fill(
      "transfer-igloo",
      "冰屋的单词是什么？注意最后两个o。",
      "igloo",
      "igloo",
    ),
  ],
);
add(
  1,
  "冰屋少了谁",
  "Igloo builders",
  "word",
  [
    choice(
      "igloo-match",
      "图中是冰屋。写成 iglo 正确吗？",
      [option("正确", "igloo", "true"), option("不正确", "igloo", "false")],
      "false",
      "igloo",
      "正确拼写是igloo，最后有两个o，iglo少了一个o。",
    ),
    fill("igloo-fix", "现在自己写出冰屋的完整单词。", "igloo", "igloo"),
  ],
  undefined,
  [
    fill("retry-igloo", "补全 i-g-l-o-o，写完整词。", "igloo", "igloo"),
    fill("transfer-ink", "看墨水瓶，写出单词。", "ink", "ink"),
  ],
);
add(1, "听声音，补字母", "A missing letter", "listen", [
  choice(
    "elephant-gap",
    "听单词，给 __lephant 选择开头字母。",
    [option("e"), option("c"), option("a")],
    "e",
    "elephant",
    "elephant是大象，开头字母为e。",
    { listen: ["elephant"], caseSensitive: true },
  ),
]);
add(1, "听见哪位小伙伴", "Listen and discover", "listen", [
  wordChoice("listen-bee", "bee", ["bee", "apple", "bear"], ["bee"]),
]);
add(1, "谁和 bear 同开头", "Beginning sounds", "phonics", [
  choice(
    "bear-bee",
    "听完整单词，再选和bear开头 /b/ 相同的词。",
    [option("apple", "apple"), option("bee", "bee"), option("ant", "ant")],
    "bee",
    "bear",
    "bear和bee都以 /b/ 开头。apple和ant以 /æ/ 开头。",
    { listen: ["bear", "apple", "bee", "ant"] },
  ),
]);
add(
  1,
  "听见哪种图案",
  "Listen to the whole word",
  "listen",
  [
    wordChoice(
      "listen-arrow",
      "arrow",
      ["arrow", "apple", "alligator"],
      ["arrow"],
    ),
  ],
  "本题三个选项的首音相同，应听完整单词，不能只辨第一个音。",
);
add(1, "大写 A 花田", "Capital letter garden", "letters", [
  count("big-A", ["A", "a", "A", "a", "A", "a", "A", "a"], "A"),
]);
add(
  2,
  "听句找线索",
  "Five little listening clues",
  "listen",
  [
    choice(
      "sister",
      "听对话，找出说话者的姐姐或妹妹。",
      [
        option("Mike：男孩", "self", "Mike"),
        option("Lily：女孩", "self", "Lily"),
      ],
      "Lily",
      "self",
      "对话说This is my sister, Lily. 关键线索是sister和Lily。",
      { listen: ["Who is this?", "This is my sister, Lily."] },
    ),
    choice(
      "ruler",
      "听对话，选择提到的物品。",
      [option("尺子", "ruler", "ruler"), option("铅笔盒", "case", "case")],
      "ruler",
      "ruler",
      "ruler是尺子。",
      { listen: ["Is this your ruler?", "Yes, it is."] },
    ),
    choice(
      "touch",
      "听指令，选择动作。",
      [option("摸鼻子", "nose", "nose"), option("摸头", "head", "head")],
      "head",
      "head",
      "Touch your head. 意思是摸摸你的头。",
      { listen: ["Touch your head.", "OK."] },
    ),
    choice(
      "fish",
      "听对话，选择鱼儿的颜色。",
      [
        { id: "green", label: "绿色的鱼", art: "fish", colour: "#68ae72" },
        { id: "blue", label: "蓝色的鱼", art: "fish", colour: "#66a5d6" },
      ],
      "green",
      "fish",
      "It’s green. 关键词green表示绿色。",
      { listen: ["What colour is your fish?", "It's green."] },
    ),
    choice(
      "china",
      "听对话，选择与对话中的国家有关的场景。",
      [
        option("澳大利亚袋鼠", "kangaroo", "Australia"),
        option("中国北京鸟巢", "stadium", "China"),
      ],
      "China",
      "stadium",
      "I’m from China. 表示我来自中国。鸟巢是北京的体育场；一张图不是一个国家的全部。",
      { listen: ["Where are you from?", "I'm from China."] },
    ),
  ],
  "依据题本提供的听力文字重建；原图“摸头”的指示位置较模糊，改画为明确的摸头/摸鼻子。所有听力均为浏览器合成，不是原录音。",
);
add(2, "小狗宝宝的名字", "A playful puppy", "word", [
  wordChoice("puppy", "puppy", ["puppy", "kitten", "piglet"]),
]);
add(
  2,
  "给场景找句子",
  "Match the moment",
  "greeting",
  [
    choice(
      "match-self",
      "I'm Lily. 对应哪个场景？",
      [
        option("介绍自己", "self", "self"),
        option("见面问好", "hello", "hello"),
        option("离开告别", "bye", "bye"),
      ],
      "self",
      "self",
      "I’m Lily. 是介绍自己的名字。",
    ),
    choice(
      "match-hello",
      "“Hi, Yaoyao.” “Hello, Dongdong.” 对应哪个场景？",
      [
        option("介绍自己", "self", "self"),
        option("见面问好", "hello", "hello"),
        option("离开告别", "bye", "bye"),
      ],
      "hello",
      "hello",
      "Hi和Hello用来见面问好。",
    ),
    choice(
      "match-bye",
      "“Goodbye!” “Bye!” 对应哪个场景？",
      [
        option("介绍自己", "self", "self"),
        option("见面问好", "hello", "hello"),
        option("离开告别", "bye", "bye"),
      ],
      "bye",
      "bye",
      "两个人在互相告别。",
    ),
  ],
  "原连线拆成三次场景配对，所有情境保留，不沿用重绘图片的原A/B/C顺序。",
);
add(2, "一起玩吧", "Let’s play together", "sentence", [
  order(
    "play-order",
    "把邀请排成完整句子。",
    ["Let's", "play", "together."],
    "Let's play together.",
    "play",
  ),
]);
add(2, "问候听写站", "Listen for a greeting", "listen", [
  fill("hi-gap", "听录音，补全：____! I’m Sarah.", "Hi", "hello", {
    listen: ["Hi! I'm Sarah."],
    caseSensitive: true,
    explain:
      "录音是Hi! I’m Sarah. 句首的Hi首字母大写；Hello意思接近，但这里要听清原话。",
  }),
]);
add(
  2,
  "句首穿大写外套",
  "A capital hello",
  "greeting",
  [
    choice(
      "capital-hello",
      "看见面场景，补全：____! I’m Li Dong. 注意句首大写。",
      [option("hi"), option("Bye"), option("Hello")],
      "Hello",
      "hello",
      "hi的意思也是你好，但本题句首应大写；所给选项中Hello的意思和大写都合适。",
      { caseSensitive: true },
    ),
  ],
  undefined,
  [
    choice(
      "retry-capital",
      "句首哪种写法合适？",
      [option("hello"), option("Hello")],
      "Hello",
      "hello",
      "句首首字母要大写。",
      { caseSensitive: true },
    ),
    choice(
      "transfer-capital",
      "句首哪种写法合适？",
      [option("hi"), option("Hi")],
      "Hi",
      "hello",
      "句首的Hi，H大写。",
      { caseSensitive: true },
    ),
  ],
);
add(2, "来吧，一起跑", "Come on!", "listen", [
  choice(
    "come-on",
    "听到“Come on, Li Dong.”，与伙伴招呼一起向前跑的画面匹配吗？",
    [option("匹配", "play", "true"), option("不匹配", "bed", "false")],
    "true",
    "play",
    "Come on在这里是来吧、加油，结合伙伴一起跑的场景理解。",
    { listen: ["Come on, Li Dong."] },
  ),
]);
const drawTask: Task = {
  id: "draw-playground",
  mode: "draw",
  prompt: "画一画操场活动，再用英语介绍你画的人喜欢做什么。",
  scene: "play",
  checks: [
    "画面里至少有一种活动",
    "我的英语和画面内容相符",
    "我检查了I like与He/She likes的区别",
  ],
  example: "I like running. She likes playing football.",
  explain:
    "I后面用like；he或she后面通常用likes。描述活动可以用running、playing football、playing tennis、jumping rope。答案可以不同。",
  hint: "先画或放一个活动角色，再想“谁喜欢做什么”。至少写一句，也可以先说给自己听。",
};
const timetableTask: Task = {
  id: "my-timetable",
  mode: "timetable",
  prompt: "安排星期一到星期五，每天5节课，再介绍最喜欢的课程。",
  scene: "school",
  checks: [
    "我填好了25个课程格",
    "我用英语说或写了最喜欢的课",
    "我的理由和这门课有关",
  ],
  example: "I like English best. I can sing English songs.",
  explain:
    "课程表可以有不同安排。用I like … best.说最喜欢的课，再用I can …或It is …说理由。",
  hint: "先选课程，再点课程格；最后选一门最喜欢的课说一说。",
};
const bagTask: Task = {
  id: "my-schoolbag",
  mode: "bag",
  prompt: "把物品放进书包，也可以自己画，再用英语介绍。",
  scene: "case",
  checks: [
    "书包或画面里有我介绍的物品",
    "一个物品用This is，多个用These are",
    "我说的是虚构书包，不写真实个人信息",
  ],
  example: "This is my book. These are my pencils.",
  explain:
    "This is用于一个，These are用于多个。可以介绍不同的学习用品，没有唯一标准答案。",
  hint: "先放物品或画物品，数清一个还是多个，再写一句对应的英语。",
};
const openVariants = (kind: "draw" | "timetable" | "bag"): [Task, Task] => {
  const base =
    kind === "draw" ? drawTask : kind === "timetable" ? timetableTask : bagTask;
  return [
    {
      ...base,
      id: "retry-" + kind,
      prompt:
        kind === "draw"
          ? "换个角色，画一种活动并用I like介绍。"
          : kind === "timetable"
            ? "重新安排一张不同的课程表，再介绍一门课。"
            : "换一组书包物品，再介绍一个物品。",
    },
    {
      ...base,
      id: "transfer-" + kind,
      prompt:
        kind === "draw"
          ? "独立再画一种不同活动，并写一句与图相符的英语。"
          : kind === "timetable"
            ? "独立再安排一张课程表，介绍另一门喜欢的课。"
            : "独立重新设计书包，试着同时介绍一个和多个物品。",
    },
  ];
};
add(
  2,
  "我的操场画册",
  "Draw, move and say",
  "playground",
  [drawTask],
  "支持手绘和活动印章。自查不等于系统判定口语或语法全部正确。",
  openVariants("draw"),
);
add(
  2,
  "我来排课程表",
  "My colourful school week",
  "timetable",
  [timetableTask],
  "保留5天×5节共25格；课程安排没有唯一答案。",
  openVariants("timetable"),
);
add(
  2,
  "书包里的小世界",
  "My magic schoolbag",
  "schoolbag",
  [bagTask],
  "可手绘、放物品并介绍；This/These的示例由当前实际数量生成。",
  openVariants("bag"),
);
add(2, "文具听写站", "Hear and spell", "listen", [
  fill("pencil", "看铅笔，听完整单词，再写出拼写。", "pencil", "pencil", {
    listen: ["pencil"],
  }),
]);
add(2, "到上学时间啦", "Time for school", "word", [
  choice(
    "school-time",
    "It's time for ____.",
    [
      option("breakfast", "breakfast"),
      option("bed", "bed"),
      option("school", "school"),
    ],
    "school",
    "school",
    "画面是去学校：It’s time for school. 到上学时间了。",
  ),
]);
export const books = [
  {
    title: "Hello, little explorer!",
    subtitle: "问候 · 字母 · 单词",
    count: 18,
  },
  { title: "My wonderful world", subtitle: "听力 · 生活 · 创作", count: 12 },
];
