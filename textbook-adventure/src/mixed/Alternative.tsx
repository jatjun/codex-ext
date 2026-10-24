import { useEffect, useState } from "react";
import { Scene } from "./Scene";
import type { Numbers, Kind } from "./model";
export function Alternative({ kind, n }: { kind: Kind; n: Numbers }) {
  const [step, setStep] = useState(0),
    [p, setP] = useState(0),
    [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setP((v) => Math.min(1, v + 0.04)), 100);
    return () => clearInterval(t);
  }, [play]);
  useEffect(() => {
    if (p === 1) setPlay(false);
  }, [p]);
  const last = kind === "paper" ? 1 : 2;
  return (
    <div className="paper">
      <h3>换一种方法，再验证一次</h3>
      {kind === "paper" ? (
        step === 0 ? (
          <>
            <p>
              先合计两天完成的数量：{n.b}张与{n.c}张合成一组。
            </p>
            <svg
              viewBox={`0 0 600 ${Math.max(180, Math.ceil(Math.max(n.b, n.c) / 7) * 32 + 50)}`}
              role="img"
              aria-label="两天完成的窗花合并"
            >
              {Array.from({ length: n.b + n.c }, (_, i) => {
                const targetX = 20 + (i % 15) * 36,
                  targetY = 25 + Math.floor(i / 15) * 32;
                const startX =
                    i < n.b ? 20 + (i % 7) * 36 : 325 + ((i - n.b) % 7) * 36,
                  startY = 25 + Math.floor((i < n.b ? i : i - n.b) / 7) * 32;
                return (
                  <rect
                    key={i}
                    x={startX + (targetX - startX) * p}
                    y={startY + (targetY - startY) * p}
                    width="21"
                    height="21"
                    rx="3"
                    fill={i < n.b ? "#4b9480" : "#d69b49"}
                  />
                );
              })}
            </svg>
            {p === 1 && (
              <p>
                {n.b}＋{n.c}＝{n.b + n.c}张已完成
              </p>
            )}
          </>
        ) : (
          <>
            <p>再从总数中一次移走两天完成的数量。</p>
            <Scene
              kind="paper"
              n={{ a: n.a, b: n.b + n.c, c: 1 }}
              step={0}
              progress={p}
              bars={false}
            />
            {p === 1 && (
              <p>
                {n.a}−({n.b}＋{n.c})＝{n.a - n.b - n.c}张
              </p>
            )}
          </>
        )
      ) : (
        <>
          {step < 2 ? (
            <>
              <p>
                先分别数{step === 0 ? "红" : "黄"}珠能串几条：每{n.c}颗一条。
              </p>
              <Scene
                kind="beads"
                n={{ a: step === 0 ? n.a : n.b, b: 0, c: n.c }}
                step={1}
                progress={p}
                bars={false}
              />
            </>
          ) : (
            <>
              <p>现在每个圆点代表1条手链，比较两种手链的条数。</p>
              <Scene
                kind="beads"
                n={{ a: n.a / n.c, b: n.b / n.c, c: 1 }}
                step={0}
                progress={p}
                bars={false}
                displayUnit="条"
              />
              {p === 1 && (
                <p>
                  {n.a}÷{n.c}−{n.b}÷{n.c}＝{(n.a - n.b) / n.c}条
                </p>
              )}
            </>
          )}
        </>
      )}
      <div className="actions">
        <button onClick={() => setPlay(!play)}>
          {play ? "暂停对照动画" : "播放对照动画"}
        </button>
        <button
          onClick={() => {
            setP(0);
            setPlay(false);
          }}
        >
          重看这一段
        </button>
        {p === 1 && step < last && (
          <button
            onClick={() => {
              setStep(step + 1);
              setP(0);
              setPlay(false);
            }}
          >
            对照下一步
          </button>
        )}
      </div>
    </div>
  );
}
