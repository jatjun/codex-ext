import {
  buildLesson,
  defaultValues,
  defaults as pdfFields,
  catalog as pdfCatalog,
} from "../pdf/model";
import {
  allAddresses,
  fields as notebookFields,
  build as buildNotebook,
  valuesFor,
} from "../notebooks/model";
import {
  catalog as workbooks,
  build as buildWorkbook,
  defaults as workbookDefaults,
} from "../workbooks/model";
import { buildLevel, buildQueueLevel } from "../questions/builders";
import { defaults, defaultQueue, queueCatalog } from "../questions/models";
import type { Level } from "../questions/data";
import type { Lesson } from "../pdf/model";
export type LibraryEntry = {
  id: string;
  title: string;
  topic: string;
  source: string;
  story: string;
  prompts: string[];
  pending?: string;
  fields?: { key: string; label: string; value: number; choices?: string[] }[];
};
export function originalFields(
  id: string,
): { key: string; label: string; value: number; choices?: string[] }[] {
  if (id.startsWith("pdf-")) return pdfFields(Number(id.slice(4)));
  if (id.startsWith("book-")) {
    const [, b, n] = id.split("-");
    return notebookFields(b as "a" | "b", Number(n));
  }
  return workbooks.find((d) => d.id === id)?.fields || [];
}
export function originalLesson(id: string): Lesson | undefined {
  if (id.startsWith("pdf-")) {
    const n = Number(id.slice(4));
    return buildLesson(n, defaultValues(n));
  }
  if (id.startsWith("book-")) {
    const [, b, n] = id.split("-");
    return buildNotebook(
      b as "a" | "b",
      Number(n),
      valuesFor(b as "a" | "b", Number(n)),
    );
  }
  const d = workbooks.find((d) => d.id === id);
  return d && !d.pending ? buildWorkbook(d, workbookDefaults(d)) : undefined;
}
function topic(l: Lesson) {
  const s = l.scene;
  if (s.type === "workbook") {
    const k = s.panels[0]?.kind;
    return k === "clock"
      ? "钟表与时间"
      : k === "divide"
        ? "分组、除法与余数"
        : k === "direction"
          ? "方向与路线"
          : k === "sort"
            ? "分类与统计"
            : k === "measure"
              ? "单位与测量"
              : k === "segments" || k === "stack"
                ? "图形与空间"
                : k === "border"
                  ? "排队与方阵"
                  : k === "line" || k === "pattern"
                    ? "规律与间隔"
                    : k === "cards"
                      ? "数字与运算"
                      : "倍数与数量关系";
  }
  if (s.type === "extension") {
    const k = s.spec.kind;
    return k === "mass" || k === "ruler"
      ? "单位与测量"
      : k === "operations"
        ? "数字与运算"
        : ["solids", "net", "view", "motion", "symmetry", "roses"].includes(k)
          ? "图形与空间"
          : "倍数与数量关系";
  }
  return l.topic === "前后位置"
    ? "排队与方阵"
    : l.topic === "购物策略"
      ? "购物与钱数"
      : l.topic === "分类与位置"
        ? "分类与统计"
        : l.topic === "图形计数"
          ? "图形与空间"
          : "倍数与数量关系";
}
const entry = (id: string, source: string, l: Lesson): LibraryEntry => ({
  id,
  source,
  title: l.title,
  topic: topic(l),
  story:
    l.story +
    (originalFields(id).length
      ? "\n原题条件：" +
        originalFields(id)
          .map((f) => f.label + "＝" + (f.choices?.[f.value] ?? f.value))
          .join("；")
      : ""),
  fields: originalFields(id),
  prompts: l.tasks.map((t) => t.prompt),
});
const baseEntry = (id: string, l: Level, group: string): LibraryEntry => ({
  id,
  title: l.title,
  topic: group,
  source: id.startsWith("queue-") ? "排队专题" : "基础实验室",
  story: l.story,
  prompts: l.questions.map((t) => t.prompt),
});
export const mathLibrary: LibraryEntry[] = [
  ...(["shop", "shapes", "detective", "square"] as const).map((id, i) =>
    baseEntry(
      id,
      buildLevel(id, defaults),
      ["购物与钱数", "数字与运算", "分类与统计", "排队与方阵"][i],
    ),
  ),
  ...queueCatalog.map((q) =>
    baseEntry(
      "queue-" + q.kind,
      buildQueueLevel(defaultQueue(q.kind)),
      "排队与方阵",
    ),
  ),
  ...pdfCatalog.map((_, i) =>
    entry(
      "pdf-" + (i + 1),
      "首份题本 · 原题" + (i + 1),
      buildLesson(i + 1, defaultValues(i + 1)),
    ),
  ),
  ...allAddresses.map((a) =>
    entry(
      `book-${a.book}-${a.number}`,
      `${a.book.toUpperCase()}册 · 原题${a.number}`,
      buildNotebook(a.book, a.number, valuesFor(a.book, a.number)),
    ),
  ),
  ...workbooks.map((d) =>
    d.pending
      ? {
          id: d.id,
          title: d.title,
          topic: "待核对",
          source: `八册题本${d.book}册 · 原题${d.n}`,
          story: d.pending,
          prompts: [],
          pending: d.pending,
        }
      : entry(
          d.id,
          `八册题本${d.book}册 · 原题${d.n}`,
          buildWorkbook(d, workbookDefaults(d)),
        ),
  ),
];
export function entryForRecord(levelId: string, parameters?: string) {
  if (levelId === "queue") {
    try {
      return mathLibrary.find(
        (e) => e.id === "queue-" + JSON.parse(parameters || "{}").queue.kind,
      );
    } catch {
      return undefined;
    }
  }
  return mathLibrary.find((e) => e.id === levelId);
}
