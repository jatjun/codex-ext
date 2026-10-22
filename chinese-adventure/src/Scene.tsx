import type { Kind } from "./types";
export const demos: Record<
  Kind,
  { title: string; lines: string[]; hint: string }
> = {
  pinyin: {
    title: "拼音积木工坊",
    lines: [
      "先看每块积木：声母、介母和韵母。",
      "积木靠近，拼成一个完整音节。",
      "读音相同不等于拼法相同。留意声调和小点。",
    ],
    hint: "先找声母，再看有没有介母；整体认读音节要整体记。",
  },
  character: {
    title: "汉字部件工坊",
    lines: [
      "观察“青”这个部件，再看看不同的偏旁。",
      "氵、讠、日和青结合，会成为不同的字。",
      "偏旁帮助理解意思，组词后还要读通顺。",
    ],
    hint: "看偏旁和词义是否相配，不只看读音像不像。",
  },
  sentence: {
    title: "句子的动作小剧场",
    lines: [
      "小猫向前推动小球。先看清谁做动作。",
      "从小猫说起：小猫把球推走了。",
      "从球说起：球被小猫推走了。动作没有改变。",
    ],
    hint: "先问“谁做什么，谁承受动作”。换说法，意思不能换。",
  },
  sequence: {
    title: "故事时间小火车",
    lines: [
      "秋天的农场，果实成熟了。",
      "小猫跑进农场，在草堆旁躲藏、玩耍。",
      "玩累了，小猫睡着了。事情有开始、经过和结尾。",
    ],
    hint: "找季节或起点，再找动作发展，最后找事情的结果。",
  },
  connector: {
    title: "句子之间的小桥",
    lines: [
      "先观察天气：雨滴从云里落下来。",
      "因为下雨，小兔打开雨伞。",
      "换成转折：虽然下雨，小兔仍穿雨衣出发。",
    ],
    hint: "是原因结果、转折、条件，还是两种选择？先想意思再选词。",
  },
  opposite: {
    title: "反义词小门",
    lines: [
      "门慢慢关上，通道变窄了。",
      "门慢慢打开，通道变宽了。",
      "开与关、宽与窄，表达相反的意思。",
    ],
    hint: "把两个词放在同一个情景里，看看意思是否相反。",
  },
  map: {
    title: "沿着词语去探险",
    lines: [
      "地图上北下南，左西右东。从大门出发。",
      "向北走，先来到荷花池，再来到假山。",
      "从假山向东走，到六角亭。边走边核对方向词。",
    ],
    hint: "先找到起点；每走一步再判断下一步，不跳过中间地点。",
  },
  writing: {
    title: "想象力观察窗",
    lines: [
      "看天上的白云和地上的小动物，观察它们的形状。",
      "云朵变得像绵羊，再变得像一条小鱼。",
      "同一朵云在不同时间变化，可以用“一会儿……一会儿……”。",
    ],
    hint: "先说清谁、在哪里、做什么，再添加样子和自己的感受。",
  },
  sound: {
    title: "声音会画画",
    lines: [
      "小鸟张开嘴，叫声向外传开。",
      "小门被推开，发出吱呀的声音。",
      "拟声词描写听到的声音，要结合实际情景。",
    ],
    hint: "想象你真正听到什么，词语要和声音来源相配。",
  },
  dictionary: {
    title: "字典寻宝站",
    lines: [
      "“河”可以分成氵和可，先找到部首氵。",
      "部首找到后，数剩余部分的笔画，再查字。",
      "音序查字法另走一条路：先找大写字母H，再查he。",
    ],
    hint: "分清部首查字法和音序查字法；“再查几画”通常指除部首后的笔画。",
  },
  story: {
    title: "故事里的小发现",
    lines: [
      "小兔来到树林，发现小伙伴正为问题发愁。",
      "它走近观察，先听清发生了什么。",
      "看清事情经过，再找书里的线索，用自己的话说出来。",
    ],
    hint: "回到题目或故事寻找线索。书中情节不能凭想象替换。",
  },
};
export default function Scene({
  kind,
  step,
  progress,
  paused,
  model,
  setModel,
}: {
  kind: Kind;
  step: number;
  progress: number;
  paused: boolean;
  model: number;
  setModel: (n: number) => void;
}) {
  const p = progress,
    whole = (step + p) / 3,
    s = (v: number) => Math.round(v * 1000) / 1000;
  return (
    <section
      className={"scene " + (paused ? "paused" : "")}
      aria-label={demos[kind].title}
    >
      <div className="scene-title">
        <span>观察示例 · 与待答题分开</span>
        <strong>{demos[kind].title}</strong>
      </div>
      <svg
        viewBox="0 0 720 310"
        role="img"
        aria-label={demos[kind].lines[step]}
        data-testid="scene"
        data-progress={s(progress)}
      >
        <defs>
          <linearGradient id="sky" x2="0" y2="1">
            <stop stopColor="#e5f3ef" />
            <stop offset="1" stopColor="#fffaf0" />
          </linearGradient>
          <pattern
            id="grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path d="M30 0H0V30" fill="none" stroke="#fff" opacity=".5" />
          </pattern>
        </defs>
        <rect width="720" height="310" rx="22" fill="url(#sky)" />
        <rect width="720" height="310" fill="url(#grid)" />
        {kind === "pinyin" && (
          <>
            {[0, 1, 2].map((i) => (
              <g
                key={i}
                transform={`translate(${s((step === 0 ? 80 + i * 240 : 200 + i * 110) + (step === 0 ? 0 : (1 - p) * ((i - 1) * 95)))},95)`}
                data-object="phoneme"
              >
                <rect
                  width="90"
                  height="86"
                  rx="18"
                  fill={["#ffd87b", "#b7d9f6", "#c9b9ef"][i]}
                />
                <text x="45" y="53" textAnchor="middle" fontSize="32">
                  {(model ? ["h", "u", "ǒ"] : ["x", "i", "ǎn"])[i]}
                </text>
                <text x="45" y="122" textAnchor="middle" fontSize="19">
                  {["声母", "介母", "韵母"][i]}
                </text>
              </g>
            ))}
            {step === 2 && (
              <text x="360" y="275" textAnchor="middle" fontSize="29">
                {model ? "huǒ · 火" : "xiǎn · 显"}
              </text>
            )}
          </>
        )}
        {kind === "character" && (
          <>
            <text x="100" y="74" fontSize="19">
              相同的“青”＋不同偏旁
            </text>
            {[
              ["氵", "清", "清水", "#84c9df"],
              ["讠", "请", "请问", "#e6b770"],
              ["日", "晴", "晴天", "#ecb481"],
            ].map(([rad, char, word, color], i) => (
              <g
                key={rad}
                transform={`translate(${150 + i * 210},165)`}
                data-object="character"
              >
                <text
                  x={step === 0 ? -65 : -25 - (1 - p) * 40}
                  y="0"
                  textAnchor="middle"
                  fontSize="55"
                  fill={color}
                >
                  {rad}
                </text>
                <text
                  x={step === 0 ? 25 : 15 + (1 - p) * 15}
                  y="0"
                  textAnchor="middle"
                  fontSize="55"
                >
                  青
                </text>
                {step === 2 && (
                  <>
                    <rect
                      x="-65"
                      y="-62"
                      width="125"
                      height="78"
                      rx="12"
                      fill="#fffaf1"
                    />
                    <text
                      y="0"
                      textAnchor="middle"
                      fontSize="58"
                      fill="#266e61"
                    >
                      {char}
                    </text>
                    <text y="60" textAnchor="middle" fontSize="25">
                      {word}
                    </text>
                  </>
                )}
              </g>
            ))}
          </>
        )}
        {kind === "sentence" && (
          <>
            <path d="M70 238H650" stroke="#9cc59e" strokeWidth="8" />
            <text
              x={s(80 + whole * 220)}
              y="200"
              fontSize="92"
              data-object="cat"
            >
              🐈
            </text>
            <circle
              cx={s(200 + whole * 350)}
              cy="214"
              r="27"
              fill="#e7ab68"
              data-object="ball"
            />
            <path
              d={`M${220 + whole * 240} 178h65l-14 -10m14 10l-14 10`}
              fill="none"
              stroke="#d89d56"
              strokeWidth="4"
            />
            <text x="360" y="70" textAnchor="middle" fontSize="27">
              {step === 0
                ? "谁推动了球？"
                : step === 1
                  ? "小猫 把 球 推走了。"
                  : "球 被 小猫 推走了。"}
            </text>
            <text x="360" y="285" textAnchor="middle" fontSize="20">
              主动者：小猫　动作：推　承受者：球
            </text>
          </>
        )}
        {kind === "sequence" && (
          <>
            <path d="M0 245Q160 215 360 245T720 235V310H0" fill="#c4d69a" />
            <text x="545" y="192" fontSize="110">
              🌳
            </text>
            <text x="540" y="123" fontSize="25">
              🍎
            </text>
            <text x="600" y="159" fontSize="25">
              🍊
            </text>
            <g
              transform={`translate(${s(step === 0 ? 110 + p * 70 : step === 1 ? 180 + p * 270 : 450)},215)`}
              data-object="story-cat"
            >
              <text fontSize="75">🐈</text>
              {step === 2 && (
                <text x="70" y={-30 - p * 15} fontSize="30">
                  Z z
                </text>
              )}
            </g>
            <text x="360" y="58" textAnchor="middle" fontSize="28">
              {["① 秋天的农场", "② 来到农场，捉迷藏", "③ 玩累了，睡着了"][step]}
            </text>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <circle
                  cx={290 + i * 70}
                  cy="285"
                  r="16"
                  fill={i === step ? "#e9af69" : "#fff"}
                />
                <text
                  x={290 + i * 70}
                  y="292"
                  textAnchor="middle"
                  fontSize="20"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </>
        )}
        {kind === "connector" && (
          <>
            <text x="125" y="95" fontSize="90">
              ☁️
            </text>
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={`M${135 + (i % 6) * 38} ${110 + ((p * 120 + i * 31) % 125)}l-7 15`}
                stroke="#79afc8"
                strokeWidth="4"
                data-object="raindrop"
              />
            ))}
            <g
              transform={`translate(${s(step === 2 ? 430 + p * 70 : 460)},218)`}
            >
              <text fontSize="84">🐇</text>
              {step > 0 && (
                <g
                  transform={`translate(47,-90) scale(${step === 1 ? 0.3 + 0.7 * p : 1})`}
                >
                  <path d="M-75 0Q0 -100 75 0Z" fill="#e5b762" />
                  <path
                    d="M0 0v90q0 20 -15 10"
                    fill="none"
                    stroke="#65737c"
                    strokeWidth="6"
                  />
                </g>
              )}
            </g>
            <text x="360" y="285" textAnchor="middle" fontSize="24">
              {
                ["雨下起来了", "因为下雨，所以带伞", "虽然下雨，但是仍出发"][
                  step
                ]
              }
            </text>
          </>
        )}
        {kind === "opposite" && (
          <>
            <rect
              x="245"
              y="40"
              width="210"
              height="230"
              rx="10"
              fill="#729c8c"
            />
            <rect x="257" y="52" width="186" height="218" fill="#e7f3d7" />
            <g
              transform={`translate(257,52) scale(${s(step === 0 ? 0.18 + 0.82 * p : step === 1 ? 1 - 0.82 * p : 0.18)},1)`}
              data-object="door"
            >
              <rect width="186" height="218" rx="4" fill="#dba266" />
              <circle cx="156" cy="118" r="7" fill="#fff4dc" />
            </g>
            <text x="148" y="155" fontSize="40">
              开
            </text>
            <text x="535" y="155" fontSize="40">
              关
            </text>
            <text x="360" y="300" textAnchor="middle" fontSize="21">
              门的开合方向相反 · 通道宽窄也在变化
            </text>
          </>
        )}
        {kind === "map" && (
          <>
            <path
              d="M350 260V70H600"
              fill="none"
              stroke="#d7bc87"
              strokeWidth="20"
              strokeLinejoin="round"
            />
            <text x="650" y="45" fontSize="20">
              ↑北
            </text>
            <text x="650" y="75" fontSize="20">
              东→
            </text>
            {[
              [350, 265, "大门"],
              [350, 170, "荷花池"],
              [350, 70, "假山"],
              [600, 70, "六角亭"],
            ].map(([x, y, label]) => (
              <g key={label} transform={`translate(${x},${y})`}>
                <circle r="17" fill="#fff" />
                <text x="-100" y="7" fontSize="21">
                  {label}
                </text>
              </g>
            ))}
            <g
              transform={`translate(${s(step === 2 ? 350 + 250 * p : 350)},${s(step === 0 ? 265 - 95 * p : step === 1 ? 170 - 100 * p : 70)})`}
              data-object="map-walker"
            >
              <circle r="18" fill="#dc845e" />
              <text y="8" textAnchor="middle" fontSize="23">
                ♟
              </text>
            </g>
          </>
        )}
        {kind === "writing" && (
          <>
            <path d="M0 260Q200 205 360 255T720 240V310H0" fill="#c9d7a4" />
            <g
              transform={`translate(${s(175 + whole * 260)},105)`}
              data-object="cloud"
            >
              <ellipse
                rx={75 + (step === 1 ? 20 * p : 0)}
                ry="39"
                fill="white"
              />
              <circle cx="-35" cy="-25" r="37" fill="white" />
              <circle cx="22" cy="-35" r="42" fill="white" />
              {step === 1 && (
                <>
                  <text x="-45" y="20" fontSize="70" opacity={p}>
                    🐑
                  </text>
                </>
              )}
              {step === 2 && (
                <text x="-43" y="20" fontSize="70" opacity={p}>
                  🐟
                </text>
              )}
            </g>
            <text x="120" y="250" fontSize="70">
              🐇
            </text>
            <text x="510" y="255" fontSize="65">
              🌷
            </text>
            <text x="360" y="292" textAnchor="middle" fontSize="22">
              {
                ["先观察：颜色、形状、动作", "一会儿像绵羊", "一会儿像小鱼"][
                  step
                ]
              }
            </text>
          </>
        )}
        {kind === "sound" && (
          <>
            <text x={step === 1 ? 100 : 260} y="195" fontSize="105">
              {step === 1 ? "🚪" : "🐦"}
            </text>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${420 + i * 45} ${110 - i * 10}q${35 + p * 30} 45 0 ${75 + i * 20}`}
                stroke="#dcab64"
                strokeWidth="5"
                fill="none"
                opacity={Math.max(0.15, 1 - ((p + i / 3) % 1))}
                data-object="sound-wave"
              />
            ))}
            <text x="360" y="270" textAnchor="middle" fontSize="30">
              {step === 1 ? "吱呀——" : "叽叽喳喳"}
            </text>
          </>
        )}
        {kind === "dictionary" && (
          <>
            <path
              d="M355 80Q250 55 160 80V245Q250 225 355 250Q460 225 560 245V80Q460 55 355 80"
              fill="#fffdf6"
              stroke="#a7ba9b"
              strokeWidth="4"
            />
            <path d="M355 80V250" stroke="#a7ba9b" strokeWidth="3" />
            <text
              x={s(step === 0 ? 90 + p * 140 : 230)}
              y="157"
              textAnchor="middle"
              fontSize="60"
              fill="#4d92ad"
              data-object="radical"
            >
              {step === 2 ? "H" : "氵"}
            </text>
            <text
              x={s(step === 0 ? 390 - p * 10 : 425)}
              y="157"
              textAnchor="middle"
              fontSize="60"
            >
              {step === 2 ? "he" : "可"}
            </text>
            <text x="360" y="292" textAnchor="middle" fontSize="23">
              {
                ["河 = 氵 ＋ 可", "氵是部首 · 可有5画", "音序：H　音节：he"][
                  step
                ]
              }
            </text>
          </>
        )}
        {kind === "story" && (
          <>
            <path d="M0 260Q300 205 720 260V310H0" fill="#c5d6a3" />
            <text x="520" y="185" fontSize="130">
              🌳
            </text>
            <text
              x={s(80 + whole * 310)}
              y="225"
              fontSize="87"
              data-object="rabbit"
            >
              🐇
            </text>
            <text x="520" y="242" fontSize="65">
              🐿️
            </text>
            <text x="360" y="70" textAnchor="middle" fontSize="25">
              {
                ["发现问题", "走近，听清发生了什么", "找线索，再说自己的想法"][
                  step
                ]
              }
            </text>
          </>
        )}
      </svg>
      <div className="scene-footer">
        <span>看一看，也可以回放</span>
        {kind === "pinyin" && (
          <button disabled={paused} onClick={() => setModel(model ? 0 : 1)}>
            换一组示例：{model ? "显" : "火"}
          </button>
        )}
      </div>
      {kind === "dictionary" && (
        <details className="alphabet">
          <summary>完整大小写字母表</summary>
          <p>
            {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
              .map((a) => a + a.toLowerCase())
              .join("　")}
          </p>
        </details>
      )}
    </section>
  );
}
