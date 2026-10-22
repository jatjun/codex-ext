import test from "node:test";
import assert from "node:assert/strict";
import {
  collect,
  safeRows,
  keys,
  textAnswer,
  reviewURL,
} from "../learning-home/mistakes-model.js";
const cat = {
  math: [{ id: "shop", title: "玩具", topic: "购物", source: "实验室" }],
  chinese: [
    { id: "cn-1", title: "拼音", topic: "pinyin", prompts: ["选择正确拼音"] },
  ],
  english: [
    {
      id: "en-1",
      title: "字母",
      topic: "letters",
      prompts: [{ id: "q", prompt: "数b" }],
    },
  ],
};
const storage = (data) => ({ getItem: (k) => JSON.stringify(data[k] || []) });
test("三科错答自动汇集，未提交与正确题不算错题", () => {
  const data = {
    [keys.math]: [
      {
        id: "m",
        levelId: "shop",
        questionId: "q",
        attempts: 1,
        firstCorrect: false,
        firstAnswer: "12",
        dateTime: "2026-10-22",
        questionText: "每个多少元？",
        events: [],
      },
    ],
    [keys.chinese]: [
      {
        id: "c",
        lesson: "cn-1",
        task: 0,
        phase: "main",
        attempts: 1,
        firstCorrect: true,
        answerHistory: [],
      },
    ],
    [keys.english]: [
      {
        id: "e",
        lesson: "en-1",
        task: "q",
        phase: "main",
        attempts: 0,
        firstCorrect: false,
        history: [],
      },
    ],
  };
  const rows = collect(storage(data), cat);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].subject, "math");
  assert.equal(rows[0].firstAnswer, "12");
});
test("相同条件合并、改数字不合并、首次错答不被正确覆盖", () => {
  const r = {
    id: "a",
    levelId: "shop",
    questionId: "q",
    attempts: 1,
    firstCorrect: false,
    firstAnswer: "12",
    questionText: "每个多少？",
    parameters: '{"original":{"count":4}}',
    dateTime: "2026-10-21",
    events: [],
  };
  const rows = collect(
    storage({
      [keys.math]: [
        r,
        {
          ...r,
          id: "b",
          dateTime: "2026-10-22",
          firstAnswer: "6",
          firstCorrect: true,
          events: [{ kind: "answer", correct: false, answer: "8" }],
        },
        { ...r, id: "c", parameters: '{"original":{"count":6}}' },
      ],
    }),
    cat,
  );
  assert.equal(rows.length, 2);
  const merged = rows.find((r) => r.records.length === 2);
  assert.equal(merged.firstAnswer, "12");
  assert.equal(merged.recordId, "a");
});
test("自由表达和口语不自动判错，单列作品", () => {
  const rows = collect(
    storage({
      [keys.english]: [
        {
          id: "e",
          lesson: "en-1",
          task: "q",
          phase: "main",
          attempts: 1,
          firstCorrect: null,
          firstAnswer: { text: "I like running." },
          history: [],
        },
      ],
    }),
    cat,
  );
  assert.equal(rows[0].work, true);
  assert.equal(rows[0].firstAnswer, "I like running.");
});
test("旧迁移记录不误用原题题干", () => {
  const rows = collect(
    storage({
      [keys.chinese]: [
        {
          id: "c",
          lesson: "cn-1",
          task: 0,
          phase: "transfer",
          attempts: 1,
          firstCorrect: false,
          firstAnswer: "x",
          answerHistory: [],
        },
      ],
    }),
    cat,
  );
  assert.match(rows[0].prompt, /没有保存这一阶段/);
  assert.equal(rows[0].metadataMissing, true);
});
test("损坏存储安全回退", () =>
  assert.deepEqual(safeRows({ getItem: () => "{broken" }, keys.math), []));
test("绘画、课程表、词卡都显示真实作答摘要", () => {
  assert.equal(textAnswer({ tokens: ["Let's", "play."] }), "Let's play.");
  assert.match(textAnswer({ strokes: [1, 2], stamps: [] }), /2笔/);
  assert.match(textAnswer({ cells: ["Maths", ""] }), /1\/25/);
});
test("重做地址仅包含记录id，不把孩子答案放到URL", () => {
  const url = reviewURL({
    subject: "english",
    recordId: "id:/?x",
    firstAnswer: "秘密草稿",
  });
  assert.equal(url, "./english-adventure/?review=id%3A%2F%3Fx");
  assert.ok(!url.includes("草稿"));
});

test('数学先求助再答对不是实际错答',()=>{const rows=collect(storage({[keys.math]:[{id:'m',levelId:'shop',questionId:'q',attempts:1,firstCorrect:false,firstAnswer:'需要帮助',events:[{kind:'help',correct:false,answer:'需要帮助'},{kind:'answer',correct:true,answer:'12'}]}]}),cat);assert.equal(rows.length,0)});
