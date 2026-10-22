import { entryForRecord } from "./catalog";
import { buildLesson, buildRetryLesson } from "../pdf/model";
import { variant as notebookVariant } from "../notebooks/model";
import { variant as workbookVariant, catalog } from "../workbooks/model";
import { readRecords } from "../records/store";
import { restoreMathRecord } from "./review";
import { PdfSession } from "../pdf/Lab";
import { LevelSession } from "../components/LevelSession";
export function Review({ id, back }: { id: string; back: () => void }) {
  const row = readRecords().find((r) => r.id === id);
  if (!row)
    return (
      <main className="page-width">
        <h1>此浏览器没有这条错题记录</h1>
        <p>错题保存在原来使用的设备和浏览器中。</p>
        <button onClick={back}>返回数学首页</button>
      </main>
    );
  let restored;
  try {
    restored = restoreMathRecord(row);
  } catch (e) {
    return (
      <main className="page-width">
        <h1>原错题记录</h1>
        <p>{row.storyText}</p>
        <p>{row.questionText}</p>
        <a
          href={
            "?entry=" +
            (entryForRecord(row.levelId, row.parameters)?.id || "shop")
          }
        >
          打开来源原题（原始条件）
        </a>
        <p role="alert">
          {(e as Error).message}。历史答案保留，不猜测缺失条件。
        </p>
        <button onClick={back}>返回数学首页，按题型找原题</button>
      </main>
    );
  }
  let transfer, retry;
  if (restored.kind === "pdf") {
    const v = restored.values;
    if (row.levelId.startsWith("pdf-")) {
      const n = Number(row.levelId.slice(4));
      transfer = buildLesson(n, v, !row.transfer);
      retry = buildRetryLesson(n, v);
    } else if (row.levelId.startsWith("book-")) {
      const [, b, n] = row.levelId.split("-");
      transfer = notebookVariant(b as "a" | "b", Number(n), v, [
        row.lessonSnapshot || restored.lesson,
      ]);
      retry = notebookVariant(b as "a" | "b", Number(n), v, [
        row.lessonSnapshot || restored.lesson,
        transfer,
      ]);
    } else {
      const d = catalog.find((d) => d.id === row.levelId)!;
      transfer = workbookVariant(d, v, [row.lessonSnapshot || restored.lesson]);
      retry = workbookVariant(d, v, [
        row.lessonSnapshot || restored.lesson,
        transfer,
      ]);
    }
  }
  return (
    <>
      <section className="page-width original-question">
        <h1>重做这道错题</h1>
        <p>
          使用保存时的题目与条件，建立新的练习记录。先前的首次错答不会覆盖。完成后可返回错题本标记“已复习”。
        </p>
        <a href="../mistakes.html?subject=math">← 返回我的错题本</a>
      </section>
      {restored.kind === "base" ? (
        <LevelSession level={restored.level} onExit={back} />
      ) : (
        <main className="page-width">
          <PdfSession
            lesson={restored.lesson}
            values={restored.values}
            alternatives={{
              recordId: row.levelId,
              transfer: transfer!,
              retry: retry!,
            }}
            onExit={back}
          />
        </main>
      )}
    </>
  );
}
