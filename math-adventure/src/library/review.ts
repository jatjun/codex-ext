import {
  buildLesson,
  validate as validatePdf,
  buildRetryLesson,
  type Lesson,
} from "../pdf/model";
import {
  build as notebook,
  validate as validateNotebook,
  variant as notebookVariant,
} from "../notebooks/model";
import {
  catalog,
  build as workbook,
  validate as validateWorkbook,
  variant as workbookVariant,
} from "../workbooks/model";
import { buildLevel, buildQueueLevel } from "../questions/builders";
import { defaults, validateSettings } from "../questions/models";
import { validateQueue } from "../questions/queue";
import type { Level } from "../questions/data";
import type { RecordEntry } from "../records/store";
export function restoreMathRecord(
  r: RecordEntry,
):
  | { kind: "pdf"; lesson: Lesson; values: Record<string, number> }
  | { kind: "base"; level: Level } {
  const p = JSON.parse(r.parameters || "null");
  if (["shop", "shapes", "detective", "square", "queue"].includes(r.levelId)) {
    const model = p || defaults;
    const level =
      r.levelId === "queue"
        ? validateQueue(model.queue).length
          ? null
          : buildQueueLevel(model.queue)
        : validateSettings(r.levelId as keyof typeof defaults, model[r.levelId])
              .length
          ? null
          : buildLevel(r.levelId as keyof typeof defaults, model);
    if (!level) throw Error("保存的条件不完整");
    const q =
      r.questionSnapshot ||
      [...level.questions, ...level.transfer].find(
        (q) => q.id === r.questionId && q.prompt === r.questionText,
      );
    if (!q || q.prompt !== r.questionText)
      throw Error("此旧记录缺少可验证的完整题目快照");
    return {
      kind: "base",
      level: { ...level, story: r.storyText || level.story, questions: [q] },
    };
  }
  const values = p?.original;
  if (
    !values ||
    Object.values(values).some(
      (v) => typeof v !== "number" || !Number.isFinite(v),
    )
  )
    throw Error("保存的条件不完整");
  let lesson: Lesson;
  if (r.lessonSnapshot) lesson = r.lessonSnapshot;
  else if (r.levelId.startsWith("pdf-")) {
    const n = Number(r.levelId.slice(4));
    if (validatePdf(n, values).length) throw Error("保存的条件无效");
    lesson = buildLesson(n, values, r.transfer);
  } else if (r.levelId.startsWith("book-")) {
    const [, b, n] = r.levelId.split("-");
    if (
      !["a", "b"].includes(b) ||
      validateNotebook(b as "a" | "b", Number(n), values).length
    )
      throw Error("保存的条件无效");
    lesson = r.transfer
      ? notebookVariant(b as "a" | "b", Number(n), values)
      : notebook(b as "a" | "b", Number(n), values);
  } else {
    const d = catalog.find((d) => d.id === r.levelId);
    if (!d || d.pending || validateWorkbook(d, values).length)
      throw Error("题目待核对或条件无效");
    lesson = r.transfer ? workbookVariant(d, values) : workbook(d, values);
  }
  const q = lesson.tasks.find(
    (q) =>
      q.prompt === r.questionText &&
      ("main-" + q.id === r.questionId || "transfer-" + q.id === r.questionId),
  );
  if (!q) throw Error("此旧记录无法准确还原原错题，请从来源重新学习");
  return { kind: "pdf", lesson: { ...lesson, tasks: [q] }, values };
}
