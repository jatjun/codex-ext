import { useMemo, useState } from "react";
import { LevelSession } from "./LevelSession";
import { buildLevel, buildQueueLevel } from "../questions/builders";
import {
  defaults,
  defaultQueue,
  queueCatalog,
  queueFields,
  settingFields,
  validateSettings,
  type Settings,
  type QueueKind,
  type QueueOrder,
} from "../questions/models";
import { validateQueue } from "../questions/queue";
export function QueueMap({
  onChoose,
  onBack,
}: {
  onChoose: (kind: QueueKind) => void;
  onBack: () => void;
}) {
  return (
    <main className="page-width queue-map">
      <button className="back-link" onClick={onBack}>
        ← 回到冒险地图
      </button>
      <div className="eyebrow">QUEUE EXPLORER / 排队动画实验室</div>
      <h1>同一条队伍，八种新发现。</h1>
      <p className="lead">
        选一种题型。每题都能调整数字、观察移动、自己数一遍，再挑战新题。
      </p>
      <div className="queue-card-grid">
        {queueCatalog.map((q, i) => (
          <button
            className="queue-type-card"
            key={q.kind}
            onClick={() => onChoose(q.kind)}
          >
            <span className="queue-type-icon">{q.icon}</span>
            <small>
              {i < 5 ? "你的题型 " + (i + 1) : "补充题型 " + (i - 4)}
            </small>
            <h2>{q.title}</h2>
            <p>{q.description}</p>
            <span>开始探索 →</span>
          </button>
        ))}
      </div>
    </main>
  );
}
export function ConfiguredLesson({
  id,
  queueKind,
  onExit,
}: {
  id: keyof Settings | "queue";
  queueKind?: QueueKind;
  onExit: () => void;
}) {
  const [settings, setSettings] = useState<Settings>(() =>
    structuredClone(defaults),
  );
  const [queue, setQueue] = useState(() => defaultQueue(queueKind ?? "total"));
  const fields = id === "queue" ? queueFields[queue.kind] : settingFields[id];
  const initial = (id === "queue"
    ? queue.numbers
    : settings[id]) as unknown as Record<string, number>;
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, String(initial[f.key])])),
  );
  const [order, setOrder] = useState<QueueOrder>(queue.order);
  const [errors, setErrors] = useState<string[]>([]),
    [version, setVersion] = useState(0),
    [message, setMessage] = useState("");
  const level = useMemo(
    () => (id === "queue" ? buildQueueLevel(queue) : buildLevel(id, settings)),
    [id, settings, queue],
  );
  const apply = () => {
    const numbers = Object.fromEntries(
      fields.map((f) => [
        f.key,
        draft[f.key]?.trim() === "" ? NaN : Number(draft[f.key]),
      ]),
    );
    const nextSettings = structuredClone(settings);
    const nextQueue = {
      ...queue,
      numbers: { ...queue.numbers, ...numbers },
      order,
    };
    if (id !== "queue") Object.assign(nextSettings[id], numbers);
    const problems =
      id === "queue"
        ? validateQueue(nextQueue)
        : validateSettings(id, nextSettings[id]);
    setErrors(problems);
    if (problems.length) return;
    if (id === "queue") setQueue(nextQueue);
    else setSettings(nextSettings);
    setVersion((v) => v + 1);
    setMessage(
      "新数字已应用，动画与答案一起更新，开始新一轮探索。历史首次答案保留。",
    );
  };
  return (
    <>
      <section className="page-width configuration">
        <details>
          <summary>⚙ 调整本题数字</summary>
          <p>
            适合家长或老师备题，孩子作答时可收起。修改后点“应用数字，重新开始”。题干、数量、语音和答案会一起更新；之前的学习记录不会覆盖。
          </p>
          <div className="number-fields">
            {fields.map((f) => (
              <label key={f.key}>
                {f.label}
                <input
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  step={f.step ?? 1}
                  value={draft[f.key] ?? ""}
                  onChange={(e) => {
                    setDraft({ ...draft, [f.key]: e.target.value });
                    setMessage("");
                  }}
                />
              </label>
            ))}
          </div>
          {id === "queue" && queue.kind === "missing" && (
            <label className="order-select">
              题目是否指定先后顺序
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as QueueOrder)}
              >
                <option value="unspecified">未说明：检查所有可能</option>
                <option value="red-first">小红在前，小明在后</option>
                <option value="ming-first">小明在前，小红在后</option>
              </select>
            </label>
          )}
          {errors.length > 0 && (
            <div className="configuration-errors" role="alert">
              {errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
          <div className="button-row">
            <button className="primary" onClick={apply}>
              应用数字，重新开始
            </button>
            <button
              onClick={() => {
                const d =
                  id === "queue"
                    ? defaultQueue(queue.kind).numbers
                    : defaults[id];
                setDraft(
                  Object.fromEntries(
                    fields.map((f) => [
                      f.key,
                      String((d as unknown as Record<string, number>)[f.key]),
                    ]),
                  ),
                );
                setOrder("unspecified");
                setErrors([]);
                setMessage("已恢复默认输入，请点应用使其生效。");
              }}
            >
              恢复默认输入
            </button>
          </div>
          <p className="configuration-status" role="status">
            {message}
          </p>
        </details>
      </section>
      <LevelSession key={version} level={level} onExit={onExit} />
    </>
  );
}
