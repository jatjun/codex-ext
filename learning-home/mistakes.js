import { collect, subjects, textAnswer, reviewURL } from "./mistakes-model.js";
const topicLabels = {
  pinyin: "拼音",
  character: "汉字",
  sentence: "句子与组句",
  sequence: "故事排序",
  connector: "关联词",
  opposite: "反义词",
  map: "路线",
  writing: "表达",
  sound: "声音",
  dictionary: "字典",
  story: "故事理解",
  word: "单词与图画",
  greeting: "情境问候",
  listen: "听力",
  letters: "字母",
  phonics: "语音发现",
  playground: "操场表达",
  timetable: "课程表",
  schoolbag: "书包介绍",
};
const $ = (id) => document.getElementById(id),
  el = (tag, text, cls) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  };
let catalog,
  items = [],
  shown = [],
  subject = new URLSearchParams(location.search).get("subject") || "all";
if (!Object.hasOwn(subjects,subject)) subject = "all";
const markerKey = "learning-garden.review-status.v1";
let markers = {};
try {
  const data = JSON.parse(localStorage.getItem(markerKey) || "{}");
  if (data && typeof data === "object" && !Array.isArray(data)) markers = data;
} catch {}
function render() {
  const query = $("search").value.trim(),
    status = $("status").value;
  shown = items.filter(
    (i) =>
      (subject === "all" || subject === i.subject) &&
      `${i.title} ${i.prompt} ${i.story} ${i.topic} ${i.source}`.includes(
        query,
      ) &&
      (status === "works"
        ? i.work
        : !i.work &&
          (status === "all" ||
            (status === "reviewed" ? !!markers[i.key] : !markers[i.key]))),
  );
  $("subjects").replaceChildren();
  for (const [k, v] of Object.entries(subjects)) {
    const button = el(
      "button",
      v + " · " + items.filter((i) => k === "all" || i.subject === k).length,
    );
    button.setAttribute("aria-pressed", String(subject === k));
    button.onclick = () => {
      subject = k;
      render();
    };
    $("subjects").append(button);
  }
  $("count").textContent =
    `找到 ${shown.length} 道${status === "works" ? "自查作品" : "错题"}（相同条件和小问合并，历史记录保留）`;
  $("groups").replaceChildren();
  if (!shown.length) {
    $("groups").append(
      el(
        "p",
        status === "works"
          ? "还没有提交过口语或表达作品。"
          : "这里还没有符合筛选条件的错题。先去三科练习；提交答错后会自动收进来。",
        "empty",
      ),
    );
    return;
  }
  const topics = [
    ...new Set(shown.map((i) => subjects[i.subject] + " · " + i.topic)),
  ];
  for (const topic of topics) {
    const section = el("section", undefined, "topic");
    section.append(el("h2", topic));
    const cards = el("div", undefined, "cards");
    for (const item of shown.filter(
      (i) => subjects[i.subject] + " · " + i.topic === topic,
    )) {
      const card = el("article", undefined, "card");
      card.append(
        el(
          "small",
          item.source +
            (item.records.length > 1
              ? ` · ${item.records.length}次学习记录`
              : ""),
        ),
        el("h3", item.title),
      );
      if (item.story) card.append(el("p", item.story, "story"));
      card.append(
        el("p", item.prompt, "question"),
        el(
          "p",
          "首次作答：" +
            item.firstAnswer +
            (item.firstCorrect === false
              ? "（当时答错）"
              : item.work
                ? "（作品自查，未自动评分）"
                : ""),
          "first",
        ),
        el("small", new Date(item.date).toLocaleString("zh-CN")),
      );
      if (item.metadataMissing)
        card.append(
          el("p", "此旧记录未保存完整阶段题干，重做时会校验能否准确还原。"),
        );
      const details = el("details");
      details.append(el("summary", "看看历次尝试"));
      for (const r of item.records) {
        const h = r.events || r.answerHistory || r.history || [];
        for (const e of h.filter(
          (e) => e.kind === undefined || e.kind === "answer",
        ))
          details.append(
            el(
              "p",
              `${new Date(e.at).toLocaleString("zh-CN")} · ${textAnswer(e.answer)} · ${e.correct === null ? "作品自查" : e.correct ? "正确" : "当时答错"}`,
            ),
          );
      }
      card.append(details);
      const actions = el("div", undefined, "actions"),
        link = el("a", "回到这道题重做 →");
      link.href = reviewURL(item);
      actions.append(link);
      if (item.entryId) {
        const sourceLink = el("a", "查看来源原题");
        sourceLink.href = `./${item.subject === "math" ? "math" : item.subject === "chinese" ? "chinese" : "english"}-adventure/?${item.subject === "math" ? "entry" : "lesson"}=${encodeURIComponent(item.entryId)}`;
        actions.append(sourceLink);
      }
      const button = el(
        "button",
        markers[item.key] ? "恢复为待巩固" : "我复习过了，做个标记",
      );
      button.onclick = () => {
        const next = { ...markers };
        if (next[item.key]) delete next[item.key];
        else next[item.key] = new Date().toISOString();
        try {
          localStorage.setItem(markerKey, JSON.stringify(next));
          markers = next;
          $("notice").textContent = "";
          render();
        } catch {
          $("notice").textContent =
            "浏览器未能保存复习标记，原错题记录未改变。";
        }
      };
      actions.append(button);
      card.append(actions);
      cards.append(card);
    }
    section.append(cards);
    $("groups").append(section);
  }
}
$("search").oninput = render;
$("status").onchange = render;
$("export").onclick = () => {
  const data = shown.map((i) => ({ ...i, reviewedAt: markers[i.key] || null }));
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = el("a");
  a.href = url;
  a.download = "三科错题本-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
async function load() {
  try {
    if (!catalog) {
      const response = await fetch("./learning-catalog.json");
      if (!response.ok) throw Error("目录读取失败");
      catalog = await response.json();
    }
    items = collect(localStorage, catalog).map((i) => ({
      ...i,
      topic: topicLabels[i.topic] || i.topic,
    }));
    render();
  } catch {
    $("notice").textContent =
      "题目目录暂时未能加载，请联网刷新。没有修改原来的学习记录。";
  }
}
window.addEventListener("storage", load);
window.addEventListener("pageshow", load);
load();
