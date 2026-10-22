export const keys = {
  math: "math-adventure.records.v1",
  chinese: "chinese-adventure.records.v1",
  english: "english-adventure.records.v1",
};
export const subjects = {
  all: "全部",
  math: "数学",
  chinese: "语文",
  english: "英语",
};
export function safeRows(storage, key) {
  try {
    const r = JSON.parse(storage.getItem(key) || "[]");
    return Array.isArray(r)
      ? r.filter((v) => v && typeof v === "object" && typeof v.id === "string")
      : [];
  } catch {
    return [];
  }
}
export function textAnswer(a) {
  if (a == null) return "未保存";
  if (typeof a === "string") return a || "空白作答";
  if (typeof a !== "object") return String(a);
  if (a.text) return a.text;
  if (a.tokens?.length) return a.tokens.join(" ");
  if (a.strokes?.length || a.stamps?.length)
    return `绘画作品：${a.strokes?.length || 0}笔，${a.stamps?.length || 0}个印章`;
  if (a.cells?.some(Boolean))
    return `课程表：已安排${a.cells.filter(Boolean).length}/25格`;
  if (a.bag?.length) return `书包：${a.bag.length}件物品`;
  return "口语／作品自查（未录音）";
}
export function collect(storage, catalog) {
  const groups = new Map();
  for (const subject of ["math", "chinese", "english"])
    for (const r of safeRows(storage, keys[subject])) {
      if (!Number.isFinite(r.attempts) || r.attempts < 1) continue;
      const history =
        subject === "math"
          ? r.events
          : subject === "chinese"
            ? r.answerHistory
            : r.history;
      const hasWrongSubmission =
        Array.isArray(history) &&
        history.some(
          (h) =>
            h.correct === false && (subject !== "math" || h.kind === "answer"),
        );
      const wrong =
        subject === "math" && Array.isArray(history) && history.length > 0
          ? hasWrongSubmission
          : r.firstCorrect === false || hasWrongSubmission;
      const work = subject !== "math" && r.firstCorrect === null;
      if (!wrong && !work) continue;
      const id = subject === "math" ? r.levelId : r.lesson;
      let meta = catalog[subject]?.find((e) => e.id === id);
      if (subject === "math" && id === "queue") {
        try {
          meta = catalog.math.find(
            (e) => e.id === "queue-" + JSON.parse(r.parameters).queue.kind,
          );
        } catch {}
      }
      const prompt =
        r.questionText ||
        (subject === "math"
          ? "旧记录没有完整题干"
          : r.phase !== "main"
            ? "旧记录没有保存这一阶段的题干"
            : subject === "chinese"
              ? meta?.prompts[r.task]
              : meta?.prompts.find((t) => t.id === r.task)?.prompt) ||
        "旧记录缺少此阶段题干，请回来源核对";
      let condition = "";
      if (subject === "math")
        try {
          condition = JSON.stringify(
            JSON.parse(r.parameters).original || JSON.parse(r.parameters),
          );
        } catch {}
      const key = JSON.stringify([
        subject,
        id,
        subject === "math" ? r.questionId : r.task,
        r.phase || r.transfer,
        prompt,
        condition,
      ]);
      const date = r.dateTime || r.date || "";
      let extraConditions = "";
      if (subject === "math" && !r.transfer && meta?.fields?.length) {
        try {
          const v = JSON.parse(r.parameters).original;
          extraConditions =
            "\n当时条件：" +
            meta.fields
              .map((f) => f.label + "＝" + (f.choices?.[v[f.key]] ?? v[f.key]))
              .join("；");
        } catch {}
      }
      const item = {
        key,
        subject,
        lesson: id,
        entryId: meta?.id,
        title: r.lessonTitle || meta?.title || id || "历史记录",
        topic: meta?.topic || "历史记录",
        source: meta?.source || "旧记录",
        prompt,
        story:
          r.storyText ||
          r.lessonSnapshot?.story ||
          (subject === "math" && !r.parameters ? meta?.story : "") ||
          "",
        firstAnswer: textAnswer(r.firstAnswer),
        firstCorrect: r.firstCorrect,
        recordId: r.id,
        date,
        work,
        records: [r],
        metadataMissing:
          !r.questionText && (subject === "math" || r.phase !== "main"),
      };
      item.story += extraConditions;
      const old = groups.get(key);
      if (!old) groups.set(key, item);
      else {
        old.records.push(r);
        if (date < old.date) {
          Object.assign(old, {
            firstAnswer: item.firstAnswer,
            firstCorrect: item.firstCorrect,
            recordId: r.id,
            date,
          });
        }
      }
    }
  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date));
}
export function reviewURL(item) {
  return `./${item.subject === "math" ? "math" : item.subject === "chinese" ? "chinese" : "english"}-adventure/?review=${encodeURIComponent(item.recordId)}`;
}
