import { allAddresses } from "../notebooks/model";
import { catalog } from "../pdf/model";
import { levels } from "../questions/data";
import { readRecords, report, exportRecords } from "../records/store";
export function Report({ onBack }: { onBack: () => void }) {
  const records = readRecords(),
    rates = report(records);
  const rate = (r: { correct: number; total: number }) =>
    r.total
      ? Math.round((r.correct / r.total) * 100) +
        "%（" +
        r.correct +
        "/" +
        r.total +
        "）"
      : "暂无作答";
  const errors = records
    .flatMap((r) => r.errors)
    .reduce<
      Record<string, number>
    >((acc, e) => ({ ...acc, [e]: (acc[e] || 0) + 1 }), {});
  return (
    <main className="report page-width">
      <button className="back-link" onClick={onBack}>
        ← 回到冒险地图
      </button>
      <div className="eyebrow">PARENT NOTEBOOK / 家长手记</div>
      <h1>每一次尝试，都留下线索。</h1>
      <p className="lead">
        只记录学习过程，不给孩子贴标签。记录保存在当前浏览器，不上传服务器。
      </p>
      <div className="stats-grid">
        {[
          ["首次正确率", rate(rates.first), "主线题的第一次独立答案"],
          [
            "提示后正确率",
            rate(rates.helped),
            "使用提示且作答的题目，最终答对比例",
          ],
          [
            "独立迁移正确率",
            rate(rates.transfer),
            "迁移题的第一次答案；帮助前未作答不算独立",
          ],
        ].map(([title, value, note]) => (
          <section className="stat-card" key={title}>
            <h2>{title}</h2>
            <strong>{value}</strong>
            <p>{note}</p>
          </section>
        ))}
      </div>
      <section className="paper">
        <h2>各关与排队专题探索记录</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>关卡</th>
                <th>已完成题目</th>
                <th>完整通关次数</th>
                <th>实际交互用时</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...levels,
                ...allAddresses.map((a) => ({
                  id: a.id,
                  title:
                    (a.book === "a" ? "A" : "B") +
                    "册" +
                    a.number +
                    " · " +
                    a.title,
                  icon: "✦",
                  questions: [],
                  transfer: [],
                })),
                ...catalog.map(([title], i) => ({
                  id: "pdf-" + (i + 1),
                  title: "错题" + (i + 1) + " · " + title,
                  icon: "✦",
                  questions: [],
                  transfer: [],
                })),
                {
                  id: "queue",
                  title: "排队动画专题",
                  icon: "⚑",
                  questions: [],
                  transfer: [],
                },
              ].map((l) => {
                const rows = records.filter((r) => r.levelId === l.id),
                  sessions = [...new Set(rows.map((r) => r.session))];
                const complete = sessions.filter((s) =>
                  (
                    rows.find((r) => r.session === s)?.requiredQuestionIds ??
                    [...l.questions, ...l.transfer].map((q) => q.id)
                  ).every((id) =>
                    rows.some(
                      (r) =>
                        r.session === s && r.questionId === id && r.completed,
                    ),
                  ),
                ).length;
                return (
                  <tr key={l.id}>
                    <th>
                      {l.icon} {l.title}
                    </th>
                    <td>{rows.filter((r) => r.completed).length}</td>
                    <td>{complete}</td>
                    <td>
                      {Math.round(
                        rows.reduce((n, r) => n + r.interactionMs, 0) / 1000,
                      )}{" "}
                      秒
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="paper">
        <h2>值得一起练习的地方</h2>
        {Object.entries(errors).length ? (
          <ul>
            {Object.entries(errors)
              .sort((a, b) => b[1] - a[1])
              .map(([e, n]) => (
                <li key={e}>
                  {e} <span className="pill">{n} 次</span>
                </li>
              ))}
          </ul>
        ) : (
          <p>还没有记录到需要提醒的地方。开始一次探索吧。</p>
        )}
      </section>
      <section className="paper">
        <h2>原始作答记录</h2>
        <p>
          “需要帮助”会保留为首次独立状态；后续正确答案不会覆盖它。刷新页面会开始新一轮探索，历史记录保留。
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>时间 / 题目</th>
                <th>首次答案</th>
                <th>尝试 / 提示</th>
                <th>完整讲解</th>
                <th>当前结果</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Date(r.dateTime).toLocaleString("zh-CN")}
                    <small>
                      {r.levelId} / {r.questionId}
                    </small>
                    {r.questionText && <small>{r.questionText}</small>}
                  </td>
                  <td>
                    {r.firstAnswer ?? "尚未独立作答"}
                    <small>
                      {r.firstCorrect === true
                        ? "首次正确"
                        : r.firstCorrect === false
                          ? "首次未答对"
                          : "待观察"}
                    </small>
                  </td>
                  <td>
                    {r.attempts} / {r.hints}
                  </td>
                  <td>{r.watchedExplanation ? "看完" : "未看完"}</td>
                  <td>
                    {r.completed ? "已完成" : r.correct ? "已答对" : "探索中"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="button-row">
        <button onClick={() => exportRecords(records, "json")}>
          导出 JSON
        </button>
        <button onClick={() => exportRecords(records, "csv")}>导出 CSV</button>
      </div>
      <p className="footnote">
        用时仅累计页面可见、未暂停、最近60秒有操作的时间。浏览器清理数据或隐私模式可能导致记录丢失；建议定期导出。单次表现不用于医学、心理或发展性诊断。
      </p>
    </main>
  );
}
