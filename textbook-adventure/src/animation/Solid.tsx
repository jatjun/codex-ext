import {
  faces,
  type Labels,
  type Face,
  unfoldFaces,
} from "../math-engine/space";
export function Solid({
  labels,
  angles,
  flat,
  net,
  onFace,
}: {
  labels: Labels;
  angles: [number, number];
  flat: number;
  net: boolean;
  onFace: (f: Face) => void;
}) {
  const face = (f: Face) => (
    <button
      className={`panel face-${f}`}
      data-face={f}
      onClick={() => onFace(f)}
      aria-label={`${f}面 数字${labels[f]}`}
    >
      <span>{labels[f]}</span>
      <small>{f}面</small>
    </button>
  );
  return (
    <div
      className={`viewport ${net ? "net-view" : ""}`}
      role="group"
      aria-label="可操作的三维纸盒"
    >
      <div
        className="solid"
        style={
          {
            transform: `rotateX(${angles[0]}deg) rotateY(${angles[1]}deg)`,
            "--fold": `${unfoldFaces(flat).top}deg`,
          } as React.CSSProperties
        }
      >
        {net ? (
          <>
            <div className="base">{face("前")}</div>
            <div className="hinge left">{face("左")}</div>
            <div className="hinge right">{face("右")}</div>
            <div className="hinge top">
              {face("上")}
              <div className="hinge far">{face("后")}</div>
            </div>
            <div className="hinge bottom">{face("下")}</div>
          </>
        ) : (
          faces.map((f) => (
            <div className={`fixed fixed-${f}`} key={f}>
              {face(f)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
