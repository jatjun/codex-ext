import { useEffect, useState } from "react";
import {
  readVisibility,
  saveVisibility,
} from "../../../learning-home/visibility-model.js";
export function useVisibility(subject: string) {
  const [hidden, setHidden] = useState(() => readVisibility()),
    [showAll, setShowAll] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setHidden(readVisibility());
    window.addEventListener("storage", sync);
    window.addEventListener("learning-visibility-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("learning-visibility-change", sync);
    };
  }, []);
  const isHidden = (id: string) => !!hidden[subject + ":" + id];
  const change = (ids: string[], visible: boolean) => {
    const next = saveVisibility(
      readVisibility(),
      ids.map((id) => subject + ":" + id),
      visible,
    );
    if (next) {
      setHidden(next);
      setError("");
      window.dispatchEvent(new Event("learning-visibility-change"));
    } else setError("浏览器未能保存显示设置，原题和学习记录都未改变。");
  };
  return {
    isHidden,
    showAll,
    setShowAll,
    change,
    error,
    hiddenCount: Object.keys(hidden).filter((k) => k.startsWith(subject + ":"))
      .length,
  };
}
export function VisibilityTools({
  v,
  ids,
}: {
  v: ReturnType<typeof useVisibility>;
  ids: string[];
}) {
  return (
    <section className="visibility-tools" aria-label="题目显示设置">
      <p>
        勾选要显示的题目，已会的可取消勾选。隐藏不删除题目或作答记录。已隐藏{" "}
        {v.hiddenCount} 题。
      </p>
      <div>
        <button
          aria-pressed={v.showAll}
          onClick={() => v.setShowAll(!v.showAll)}
        >
          {v.showAll ? "只看勾选的题目" : "查看全部（含隐藏）"}
        </button>
        <button disabled={!ids.length} onClick={() => v.change(ids, true)}>
          当前筛选全部显示（{ids.length}）
        </button>
        <button
          disabled={!ids.length}
          onClick={() => {
            v.change(ids, false);
            v.setShowAll(true);
          }}
        >
          当前筛选全部隐藏（{ids.length}）
        </button>
      </div>
      {v.error && <p role="alert">{v.error}</p>}
    </section>
  );
}
export function VisibilityCheck({
  v,
  id,
  title,
}: {
  v: ReturnType<typeof useVisibility>;
  id: string;
  title: string;
}) {
  return (
    <label className="visibility-check">
      <input
        type="checkbox"
        checked={!v.isHidden(id)}
        onChange={(e) => v.change([id], e.target.checked)}
      />
      <span>
        显示这题：{title}
        {v.isHidden(id) ? "（已隐藏）" : ""}
      </span>
    </label>
  );
}
