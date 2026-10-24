import { useState } from "react";
import { calculate, parse } from "./arithmetic";
const comparisons = [
  ["15+25÷5", "19"],
  ["9×7-53", "10"],
  ["12+54÷6", "21-5+7"],
  ["24÷8×3", "32-24÷4"],
  ["35-23+18", "35-(23-18)"],
  ["24÷8×2", "24÷(8÷2)"],
];
const corrections = [
  {
    expression: "36-13+7",
    wrong: "36−20＝16",
    answer: 30,
    why: "减去13之后应加7，不能把13与7先相加再一起减。",
  },
  {
    expression: "7+14÷7",
    wrong: "21÷7＝3",
    answer: 9,
    why: "先算除法14÷7，再加7。",
  },
  {
    expression: "18÷3×3",
    wrong: "18÷9＝2",
    answer: 18,
    why: "乘除同级，从左往右。不是所有情况都先乘后除。",
  },
];
const names = [
  "购票方案实验",
  "不等式填数",
  "两边算式比较",
  "找错与纠正",
  "选条件搭问题",
  "用算式讲故事",
  "减法数量关系",
];
const KEY = "textbook-adventure.explore.v1";
export function bestTickets(adults: number, children: number) {
  let best = Infinity;
  for (let a = 0; a <= adults; a++)
    for (let c = 0; c <= children; c++) {
      if (a + c !== 0 && a + c < 6) continue;
      best = Math.min(
        best,
        (a + c) * 8 + (adults - a) * 10 + (children - c) * 5,
      );
    }
  return best;
}
export function Explore() {
  const [game, setGame] = useState<number | null>(null),
    [attempt, setAttempt] = useState(0),
    [feedback, setFeedback] = useState(""),
    [done, setDone] = useState(false),
    [show, setShow] = useState(false),
    [selected, setSelected] = useState<number[]>([]),
    [round, setRound] = useState(0),
    [value, setValue] = useState(""),
    [left, setLeft] = useState(""),
    [right, setRight] = useState(""),
    [sign, setSign] = useState(""),
    [text, setText] = useState(""),
    [self, setSelf] = useState<number[]>([]),
    [records, setRecords] = useState<any[]>(() => {
      try {
        const r = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(r)
          ? r.filter((x) => x && typeof x.id === "string")
          : [];
      } catch {
        return [];
      }
    }),
    [report, setReport] = useState(false),
    [storageError, setStorageError] = useState(false);
  function reset(g: number) {
    setGame(g);
    setAttempt(0);
    setFeedback("");
    setDone(false);
    setShow(false);
    setSelected([]);
    setRound(0);
    setValue("");
    setLeft("");
    setRight("");
    setSign("");
    setText("");
    setSelf([]);
    setReport(false);
  }
  function toggle(n: number) {
    setSelected(
      selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n],
    );
  }
  function save(answer: string, correct: boolean | null) {
    const id = `explore-${game}-${round}`;
    const prev = records.find((r) => r.id === id);
    const row = {
      id,
      title: names[game!],
      firstAnswer: prev?.firstAnswer ?? answer,
      firstCorrect: prev ? prev.firstCorrect : correct,
      attempts: (prev?.attempts || 0) + 1,
      lastAnswer: answer,
      correct,
      time: prev?.time || new Date().toISOString(),
    };
    const next = [...records.filter((r) => r.id !== id), row];
    setRecords(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  }
  function check(
    correct: boolean,
    answer: string,
    light: string,
    visual: string,
    explain: string,
  ) {
    save(answer, correct);
    setAttempt(attempt + 1);
    if (correct) {
      setDone(true);
      setFeedback("验证通过。请说说你用了哪些条件、每一步求的是什么。");
    } else {
      setFeedback(attempt === 0 ? light : attempt === 1 ? visual : explain);
      if (attempt >= 1) setShow(true);
    }
  }
  const ga = selected.filter((x) => x < 4).length,
    gc = selected.filter((x) => x >= 4).length,
    total = (ga + gc) * 8 + (4 - ga) * 10 + (5 - gc) * 5,
    valid = selected.length === 0 || selected.length >= 6;
  const pair = comparisons[round % comparisons.length],
    a = calculate(parse(pair[0])),
    b = calculate(parse(pair[1]));
  const correction = corrections[round % corrections.length];
  return (
    <>
      <header>
        <a href="?unit=mixed">← 动画工坊</a>
        <a href="?unit=arithmetic">分步练习</a>
        <button
          onClick={() => {
            setGame(null);
            setReport(false);
          }}
        >
          探索目录
        </button>
        <button onClick={() => setReport(!report)}>探索记录</button>
      </header>
      <main>
        <h1>数学小侦探 · 方法探索</h1>
        {report ? (
          <section className="paper">
            <button
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(records, null, 2)], {
                    type: "application/json",
                  }),
                );
                const el = document.createElement("a");
                el.href = url;
                el.download = "mixed-exploration.json";
                el.click();
                setTimeout(() => URL.revokeObjectURL(url), 500);
              }}
            >
              导出探索JSON
            </button>
            {records.map((r) => (
              <p key={r.id}>
                {r.title} · 首次：{r.firstAnswer} ·{" "}
                {r.firstCorrect === null
                  ? "自查作品"
                  : r.firstCorrect
                    ? "首次正确"
                    : "首次需检查"}
              </p>
            ))}
          </section>
        ) : game === null ? (
          <div className="cards">
            {names.map((name, i) => (
              <button key={name} className="course" onClick={() => reset(i)}>
                <h2>{name}</h2>
                <p>先尝试，再观察，解释自己的发现。</p>
              </button>
            ))}
          </div>
        ) : (
          <section className="paper">
            <h2>{names[game]}</h2>
            {game === 0 ? (
              <>
                <p>
                  教材第17页：4位成人带5名儿童。成人票10元、儿童票5元；团体至少6人，每人8元。
                </p>
                <p>
                  <b>本活动允许部分成员买团体票，其余成员买单人票。</b>
                  点击人物，决定谁加入团体。
                </p>
                <div className="ticket-people">
                  {Array.from({ length: 9 }, (_, i) => (
                    <button
                      key={i}
                      aria-pressed={selected.includes(i)}
                      onClick={() => toggle(i)}
                      style={{
                        transform: selected.includes(i)
                          ? "translateY(-10px)"
                          : "none",
                        transition: "transform .3s",
                      }}
                    >
                      {i < 4 ? "🧑 成人" : "🧒 儿童"}
                      {i < 4 ? i + 1 : i - 3}
                      <small>
                        {selected.includes(i) ? "团体票" : "单人票"}
                      </small>
                    </button>
                  ))}
                </div>
                <p>
                  团体{selected.length}人；
                  {valid ? `当前总价 ${total} 元` : "不足6人，不能使用团体票"}
                </p>
                <button
                  disabled={!valid}
                  onClick={() =>
                    check(
                      total === bestTickets(4, 5),
                      `${ga}成人${gc}儿童团体，${total}元`,
                      "比较成人、儿童改买团体票后，谁省钱，谁反而多花钱？",
                      "成人10元变8元会省钱；儿童5元变8元会多花钱。让团体刚好够6人试试。",
                      "4成人与2儿童买团体票48元，其余3儿童15元，共63元。",
                    )
                  }
                >
                  这是我找到的最省方案
                </button>
                {show && (
                  <p>全部买单票65元；全部买团体票72元。混合买票会怎样？</p>
                )}
              </>
            ) : game === 1 ? (
              <>
                <p>
                  教材第11页：39＋8×5＜100−□×7。这里□限定为0～9的整数。勾选所有符合条件的数。
                </p>
                <div className="answers">
                  {Array.from({ length: 10 }, (_, i) => (
                    <button
                      key={i}
                      aria-pressed={selected.includes(i)}
                      onClick={() => toggle(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    check(
                      selected.length === 3 &&
                        [0, 1, 2].every((x) => selected.includes(x)),
                      selected.sort((x, y) => x - y).join(","),
                      "先算左边。右边的□越大，被减去的数量会怎样变化？",
                      "左边是79。右边必须严格大于79，等于也不可以。",
                      "□可以是0、1、2；填3时右边恰好79，不符合严格小于。",
                    )
                  }
                >
                  检查所有可能
                </button>
                {show && (
                  <div>
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="compare-row">
                        <span>填{i}</span>
                        <div
                          style={{
                            width: `${100 - i * 7}%`,
                            height: 22,
                            background: "#64a58f",
                            transition: "width .5s",
                          }}
                        />
                        <span>{100 - i * 7}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : game === 2 ? (
              <>
                <p>
                  先分别算两边，再比较：{pair[0]} ○ {pair[1]}
                </p>
                <label>
                  左边结果
                  <input
                    aria-label="左边结果"
                    type="number"
                    value={left}
                    onChange={(e) => setLeft(e.target.value)}
                  />
                </label>
                <label>
                  右边结果
                  <input
                    aria-label="右边结果"
                    type="number"
                    value={right}
                    onChange={(e) => setRight(e.target.value)}
                  />
                </label>
                <div className="actions">
                  {[">", "<", "="].map((s) => (
                    <button
                      key={s}
                      aria-pressed={sign === s}
                      onClick={() => setSign(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    check(
                      Number(left) === a &&
                        Number(right) === b &&
                        sign === (a > b ? ">" : a < b ? "<" : "="),
                      `${left}${sign}${right}`,
                      "先检查两边各自的运算顺序，不要只比较第一个数字。",
                      `分别圈出先算的部分：${pair[0]} 与 ${pair[1]}。`,
                      `左边${a}，右边${b}，应填${a > b ? ">" : a < b ? "<" : "="}。`,
                    )
                  }
                >
                  检查比较
                </button>
                {show && (
                  <svg
                    viewBox="0 0 600 130"
                    role="img"
                    aria-label="两边数量比较"
                  >
                    <rect
                      x="20"
                      y="20"
                      width={(a / Math.max(a, b)) * 450}
                      height="30"
                      fill="#3e927c"
                    />
                    <rect
                      x="20"
                      y="75"
                      width={(b / Math.max(a, b)) * 450}
                      height="30"
                      fill="#d6a24c"
                    />
                    <text x="480" y="42">
                      左 {a}
                    </text>
                    <text x="480" y="97">
                      右 {b}
                    </text>
                  </svg>
                )}
                {done && (
                  <button
                    onClick={() => {
                      setRound(round + 1);
                      setDone(false);
                      setAttempt(0);
                      setShow(false);
                      setValue("");
                      setLeft("");
                      setRight("");
                      setSign("");
                      setFeedback("");
                    }}
                  >
                    比较下一组
                  </button>
                )}
              </>
            ) : game === 3 ? (
              <>
                <p>
                  教材第9页的错误过程：{correction.expression}＝
                  {correction.wrong}
                </p>
                <p>想一想，第一步哪里改变了原式的意思？请填写正确结果。</p>
                <input
                  aria-label="订正结果"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <button
                  onClick={() =>
                    check(
                      Number(value) === correction.answer,
                      value,
                      "先判断同级运算，还是乘除与加减混合。",
                      correction.why,
                      `${correction.why} 正确结果是${correction.answer}。`,
                    )
                  }
                >
                  检查订正
                </button>
                {done && (
                  <button
                    onClick={() => {
                      setRound(round + 1);
                      setDone(false);
                      setAttempt(0);
                      setValue("");
                      setFeedback("");
                    }}
                  >
                    订正下一题
                  </button>
                )}
              </>
            ) : game === 4 ? (
              <>
                <p>
                  教材第16页。要对应计算过程“先9÷3，再18÷刚才的结果”，请选出条件和问题。
                </p>
                {[
                  "①红彩带18条",
                  "②黄彩带9条",
                  "③红彩带是蓝彩带的3倍",
                  "④黄彩带是蓝彩带的3倍",
                  "⑤红彩带是蓝彩带的几倍？",
                  "⑥黄彩带是蓝彩带的几倍？",
                ].map((s, i) => (
                  <button
                    className="reason"
                    key={i}
                    aria-pressed={selected.includes(i)}
                    onClick={() => toggle(i)}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() =>
                    check(
                      selected.length === 4 &&
                        [0, 1, 3, 4].every((x) => selected.includes(x)),
                      selected.map((x) => x + 1).join(","),
                      "9÷3在求谁的数量？18除以它，又是在比较谁与谁？",
                      "先用黄彩带9条和“黄是蓝的3倍”求蓝，再用红18条与蓝比较。",
                      "应选①②④⑤。蓝有9÷3＝3条，红是蓝的18÷3＝6倍。",
                    )
                  }
                >
                  检查条件链
                </button>
                {show && (
                  <p className="solved-expression">
                    黄9条 → 除以3 → 蓝的数量 → 红18条除以蓝的数量
                  </p>
                )}
              </>
            ) : game === 5 ? (
              <>
                <p>
                  教材第19页：用6×(5＋4)讲一个数学小故事。可以是6组物品，每组有两部分，也可以用其他合理情境。
                </p>
                <textarea
                  aria-label="我的数学故事"
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="我想让6表示……，5和4表示……"
                />
                {[
                  "故事中的6、5、4各有明确含义",
                  "5和4可以合并成同一单位的数量",
                  "合并后的数量有6份",
                  "提出了问题，并能解释每一步",
                ].map((s, i) => (
                  <label className="exercise-visibility" key={i}>
                    <input
                      type="checkbox"
                      checked={self.includes(i)}
                      onChange={() =>
                        setSelf(
                          self.includes(i)
                            ? self.filter((x) => x !== i)
                            : [...self, i],
                        )
                      }
                    />
                    {s}
                  </label>
                ))}
                <button
                  disabled={!text.trim() || self.length !== 4}
                  onClick={() => {
                    save(text, null);
                    setFeedback(
                      "故事已作为自查作品保存。可以讲给家人听；系统没有自动判断语意是否正确。",
                    );
                  }}
                >
                  保存我的自查作品
                </button>
              </>
            ) : (
              <>
                <p>
                  教材第17页：被减数、减数与差的和是54，减数是差的2倍。试着填写一个符合全部条件的减法算式。
                </p>
                <label>
                  被减数
                  <input
                    aria-label="被减数"
                    type="number"
                    value={left}
                    onChange={(e) => setLeft(e.target.value)}
                  />
                </label>
                <label>
                  减数
                  <input
                    aria-label="减数"
                    type="number"
                    value={right}
                    onChange={(e) => setRight(e.target.value)}
                  />
                </label>
                <label>
                  差
                  <input
                    aria-label="差"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </label>
                <button
                  onClick={() =>
                    check(
                      left !== "" &&
                        right !== "" &&
                        value !== "" &&
                        Number(left) - Number(right) === Number(value) &&
                        Number(left) + Number(right) + Number(value) === 54 &&
                        Number(right) === Number(value) * 2,
                      `${left}−${right}＝${value}`,
                      "被减数和“减数＋差”有什么关系？54里面有几份被减数？",
                      "被减数占总和的一半；减数是2份，差是1份。",
                      "54÷2＝27是被减数；27÷3＝9是差；减数18。所以27−18＝9。",
                    )
                  }
                >
                  检查三个条件
                </button>
                {show && (
                  <p className="solved-expression">
                    总和54 → 2份被减数 → 被减数分成“2份差＋1份差”
                  </p>
                )}
              </>
            )}
            <p aria-live="polite" className="feedback">
              {feedback}
            </p>
          </section>
        )}
        {storageError && <p role="alert">无法保存记录，请导出JSON备份。</p>}
      </main>
    </>
  );
}
