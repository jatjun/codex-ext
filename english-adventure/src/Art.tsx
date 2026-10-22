import type { Art as Name } from "./types";
export function Person({
  x = 0,
  y = 0,
  colour = "#e7a466",
  wave = 0,
  touch = false,
}: {
  x?: number;
  y?: number;
  colour?: string;
  wave?: number;
  touch?: boolean;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="78" cy="145" rx="39" ry="9" fill="#38536c" opacity=".1" />
      <path
        d="M58 110l-7 30m45-30l9 30"
        stroke="#375f7a"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path d="M52 77Q77 60 103 77l-2 40H54Z" fill={colour} />
      <path
        d="M54 80L32 105"
        stroke="#eec5a2"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <g transform={`rotate(${touch ? -100 : wave},103,80)`}>
        <path
          d="M102 80L126 56"
          stroke="#eec5a2"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="128" cy="51" r="9" fill="#f2cbaa" />
        <path
          d="M123 46l-3-8m8 6v-9m5 10l4-6"
          stroke="#f2cbaa"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <path d="M47 46Q46 11 78 11Q115 14 109 51" fill="#57463f" />
      <circle cx="78" cy="46" r="29" fill="#f2cbaa" />
      <path
        d="M50 38Q62 3 91 22L109 39Q85 31 77 23Q67 39 50 38"
        fill="#57463f"
      />
      <circle cx="68" cy="46" r="3" fill="#3c454d" />
      <circle cx="90" cy="46" r="3" fill="#3c454d" />
      <path
        d="M70 58q8 7 16 0"
        fill="none"
        stroke="#b67369"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="59" cy="54" r="5" fill="#e8ad95" />
      <circle cx="99" cy="54" r="5" fill="#e8ad95" />
    </g>
  );
}
export function Drawing({
  name,
  p = 0,
  colour = "#75af80",
}: {
  name: Name;
  p?: number;
  colour?: string;
}) {
  if (["running", "football", "tennis", "rope"].includes(name))
    return (
      <>
        <Person
          colour={name === "running" ? "#e3a577" : "#8eb6c4"}
          wave={Math.sin(p * 9) * 15}
        />
        {name === "football" && (
          <circle
            cx={124 + Math.sin(p * 8) * 10}
            cy="133"
            r="16"
            fill="#fff5df"
            stroke="#7699a1"
            strokeWidth="4"
          />
        )}
        {name === "tennis" && (
          <>
            <ellipse
              cx="127"
              cy="65"
              rx="16"
              ry="23"
              fill="#e7edd7"
              stroke="#94a883"
              strokeWidth="4"
            />
            <path d="M120 87l-8 23" stroke="#b2a07b" strokeWidth="7" />
          </>
        )}
        {name === "rope" && (
          <path
            d={`M30 75Q80 ${-30 + Math.sin(p * 10) * 15} 134 76Q80 175 30 75`}
            stroke="#bc9fcd"
            strokeWidth="4"
            fill="none"
          />
        )}
      </>
    );
  const eyes = (
    <>
      <circle cx="65" cy="77" r="4" fill="#31475d" />
      <circle cx="96" cy="77" r="4" fill="#31475d" />
      <circle cx="64" cy="76" r="1.4" fill="white" />
      <circle cx="95" cy="76" r="1.4" fill="white" />
    </>
  );
  if (["hello", "bye", "self", "head", "nose", "cry", "play"].includes(name))
    return (
      <>
        <Person
          wave={name === "hello" || name === "bye" ? Math.sin(p * 8) * 18 : 0}
          touch={name === "head"}
        />
        {name === "nose" && (
          <circle
            cx="80"
            cy="48"
            r="9"
            fill="none"
            stroke="#e9a75f"
            strokeWidth="3"
          />
        )}
        {name === "head" && (
          <path
            d="M113 30Q92 0 57 18"
            fill="none"
            stroke="#e9a75f"
            strokeWidth="4"
            strokeDasharray="5 5"
          />
        )}
        {name === "cry" && (
          <path d="M67 53q-12 24 0 24q12 0 0-24" fill="#87c5e1" />
        )}
      </>
    );
  if (name === "queen")
    return (
      <>
        <Person colour="#af9add" wave={Math.sin(p * 6) * 8} />
        <path
          d={`M48 ${18 - 12 * (1 - p)}l-4-24 20 13 15-19 16 19 20-13-5 24Z`}
          fill="#e7b850"
          stroke="#d29d3c"
          strokeWidth="3"
        />
        <circle cx="79" cy="8" r="4" fill="#9e83cf" />
        <path
          d="M38 95l-12 38m10-32l-14 0"
          stroke="#ddbc63"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  if (["puppy", "dog", "kitten", "piglet", "bear"].includes(name)) {
    const pig = name === "piglet",
      cat = name === "kitten",
      bear = name === "bear";
    const c = pig ? "#edb6b7" : cat ? "#a5b7c1" : bear ? "#b89473" : "#dca574";
    return (
      <>
        <ellipse cx="83" cy="143" rx="47" ry="8" fill="#355066" opacity=".1" />
        <path
          d="M112 112q38-26 10-40"
          transform={`rotate(${Math.sin(p * 9) * 12},110,114)`}
          fill="none"
          stroke={c}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <ellipse cx="81" cy="112" rx="40" ry="29" fill={c} />
        <path
          d="M55 125v17m49-17v17"
          stroke={c}
          strokeWidth="15"
          strokeLinecap="round"
        />
        {cat ? (
          <path
            d="M45 66V25l28 23m19 0l23-23v44"
            fill={c}
            stroke={c}
            strokeWidth="8"
          />
        ) : bear ? (
          <>
            <circle cx="48" cy="43" r="19" fill={c} />
            <circle cx="111" cy="43" r="19" fill={c} />
          </>
        ) : (
          <>
            <ellipse
              cx="43"
              cy="65"
              rx="15"
              ry="28"
              fill={pig ? "#da949c" : "#b7835c"}
              transform="rotate(19 43 65)"
            />
            <ellipse
              cx="116"
              cy="65"
              rx="15"
              ry="28"
              fill={pig ? "#da949c" : "#b7835c"}
              transform="rotate(-19 116 65)"
            />
          </>
        )}
        <ellipse cx="80" cy="72" rx="39" ry="35" fill={c} />
        {eyes}
        <ellipse
          cx="81"
          cy="91"
          rx={pig ? 17 : 19}
          ry="13"
          fill={pig ? "#d98e9a" : "#f4e4cb"}
        />
        {pig ? (
          <>
            <circle cx="74" cy="92" r="3" fill="#a96a78" />
            <circle cx="87" cy="92" r="3" fill="#a96a78" />
          </>
        ) : (
          <>
            <path d="M74 85h14l-7 8Z" fill="#4f4f4d" />
            <path
              d="M72 97q9 8 18 0"
              fill="none"
              stroke="#725f56"
              strokeWidth="2.5"
            />
          </>
        )}
        {cat && (
          <path
            d="M60 91l-23-3m23 9l-22 5m64-11l22-3m-22 9l22 5"
            stroke="#70838d"
            strokeWidth="2"
          />
        )}
      </>
    );
  }
  if (name === "bee" || name === "ant")
    return (
      <>
        <g
          transform={`translate(${Math.sin(p * 7) * 5},${Math.sin(p * 8) * 4})`}
        >
          {name === "bee" && (
            <>
              <ellipse
                cx="64"
                cy="48"
                rx="22"
                ry={19 + Math.sin(p * 19) * 5}
                fill="#d6edf4"
                transform="rotate(-28 64 48)"
              />
              <ellipse
                cx="98"
                cy="48"
                rx="22"
                ry={19 + Math.sin(p * 19) * 5}
                fill="#e8f6fa"
                transform="rotate(28 98 48)"
              />
            </>
          )}
          <ellipse
            cx="82"
            cy="87"
            rx="42"
            ry="31"
            fill={name === "bee" ? "#edc465" : "#a77964"}
          />
          {name === "bee" && (
            <path
              d="M65 61v53m19-57v59m19-53v48"
              stroke="#526069"
              strokeWidth="9"
            />
          )}
          <circle
            cx="48"
            cy="78"
            r="24"
            fill={name === "bee" ? "#efcf7c" : "#af8d70"}
          />
          <circle cx="39" cy="75" r="3" fill="#3b505e" />
          <path
            d="M36 86q7 6 13 0m-9-28l-5-14m17 13l4-14"
            fill="none"
            stroke="#51606a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {name === "ant" && (
            <path
              d="M58 105l-12 20m30-15v19m20-20l14 17"
              stroke="#866354"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
        </g>
      </>
    );
  if (name === "apple")
    return (
      <>
        <path
          d="M77 44Q44 22 28 56Q9 99 51 136Q66 146 81 137Q98 146 117 124Q154 74 126 45Q108 27 84 44"
          fill="#df7f75"
        />
        <path
          d="M80 48l3-26"
          stroke="#967958"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M87 28q22-24 40-7q-12 23-40 7" fill="#7fae86" />
        <path
          d="M43 63q-9 18-2 35"
          stroke="#f3b7a6"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  if (name === "elephant")
    return (
      <>
        <ellipse cx="83" cy="95" rx="51" ry="39" fill="#a2b8ca" />
        <path
          d="M48 110v28m57-28v28"
          stroke="#91a9bd"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <ellipse cx="67" cy="73" rx="29" ry="35" fill="#bfd0dc" />
        <circle cx="116" cy="75" r="30" fill="#a2b8ca" />
        <path
          d={`M132 83q${16 + Math.sin(p * 7) * 9} 56-9 51`}
          stroke="#a2b8ca"
          strokeWidth="19"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="124" cy="68" r="4" fill="#3e566b" />
        <path
          d="M139 88l-10 8"
          stroke="#fff5d8"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  if (name === "ink" || name === "jam")
    return (
      <>
        <rect
          x="35"
          y="60"
          width="92"
          height="83"
          rx="18"
          fill={name === "ink" ? "#536d85" : "#e6a27c"}
          stroke={name === "ink" ? "#405e78" : "#ce8868"}
          strokeWidth="4"
        />
        <rect
          x="42"
          y="40"
          width="78"
          height="25"
          rx="8"
          fill={name === "ink" ? "#344c63" : "#e5c88b"}
        />
        <rect x="48" y="80" width="66" height="42" rx="7" fill="#fff6dc" />
        {name === "ink" ? (
          <path d={`M81 ${85 + p * 8}q-24 25 0 26q24-1 0-26`} fill="#5c84ad" />
        ) : (
          <>
            <circle cx="70" cy="103" r="12" fill="#da7a76" />
            <circle cx="88" cy="103" r="12" fill="#da7a76" />
            <path d="M79 88l4-11" stroke="#77966b" strokeWidth="4" />
          </>
        )}
      </>
    );
  if (name === "igloo")
    return (
      <>
        <path
          d="M18 134Q16 40 79 34Q145 40 145 134Z"
          fill="#e3f0f4"
          stroke="#9dbbc9"
          strokeWidth="4"
        />
        <path
          d="M29 83h104M20 107h120M39 59h79M54 59v24m46-24v24m-72 0v24m50-24v24m46-24v24m-74 0v25"
          stroke="#a9c7d1"
          strokeWidth="3"
        />
        <path
          d="M63 137v-30q18-25 37 0v30"
          fill="#6e93ab"
          stroke="#bdd9e3"
          strokeWidth="8"
        />
        <path
          d="M12 140h140"
          stroke="#c8dee8"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </>
    );
  if (name === "eye")
    return (
      <>
        <path
          d="M15 81Q78 12 146 81Q78 145 15 81"
          fill="#fffef5"
          stroke="#799fb7"
          strokeWidth="6"
        />
        <ellipse
          cx="81"
          cy="81"
          rx="25"
          ry={25 * (1 - Math.max(0, Math.sin(p * 12)) * 0.3)}
          fill="#76b2b9"
        />
        <circle cx="81" cy="81" r="13" fill="#34586b" />
        <circle cx="88" cy="72" r="6" fill="white" />
        <path
          d="M29 51l-9-13m40-4l-3-16m41 16l5-16m27 33l12-14"
          stroke="#6c92ab"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  if (name === "owl")
    return (
      <>
        <path
          d="M30 47l3-24 25 18q24-12 49 0l22-18 2 34q16 82-51 86Q16 136 30 47"
          fill="#ad9bc7"
        />
        <circle cx="58" cy="77" r="23" fill="#f8edcf" />
        <circle cx="104" cy="77" r="23" fill="#f8edcf" />
        <circle cx="58" cy="77" r="10" fill="#3f566b" />
        <circle cx="104" cy="77" r="10" fill="#3f566b" />
        <path d="M73 91h17l-8 13Z" fill="#e8b45f" />
        <path
          d="M48 114l11 8m45-8l-11 8"
          stroke="#d5c4e1"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </>
    );
  if (name === "fish")
    return (
      <g transform={`translate(${Math.sin(p * 7) * 8},0)`}>
        <path d="M111 76l38-29v63l-38-22" fill={colour} />
        <ellipse cx="73" cy="81" rx="47" ry="31" fill={colour} />
        <path d="M65 54l15-17 19 26M66 107l14 14 16-19" fill={colour} />
        <circle cx="45" cy="75" r="5" fill="#fff" />
        <circle cx="44" cy="75" r="3" fill="#36556c" />
        <path
          d="M35 88q9 8 14 0m21-23q-11 15 0 30"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          opacity=".7"
        />
      </g>
    );
  if (name === "arrow")
    return (
      <g transform={`translate(${p * 12 - 6},0)`}>
        <path
          d="M20 58h73V34l47 46-47 46v-25H20Z"
          fill="#d6ad67"
          stroke="#bc9455"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </g>
    );
  if (name === "alligator")
    return (
      <>
        <path d="M18 106Q30 64 72 78l57 0q28 7 9 33H59l-24 18" fill="#87af83" />
        <path d="M23 102L7 81l35 12" fill="#87af83" />
        <circle cx="100" cy="76" r="13" fill="#9ebd8d" />
        <circle cx="102" cy="75" r="4" fill="#3e5661" />
        <path d="M91 103h45" stroke="#52795d" strokeWidth="3" />
        <path d="M108 102l4-9 6 9 5-9 5 9" fill="#f8f1d5" />
        <path
          d="M62 108l-6 19m48-19l-4 19"
          stroke="#6c986e"
          strokeWidth="13"
          strokeLinecap="round"
        />
      </>
    );
  if (name === "pencil" || name === "ruler")
    return (
      <g transform="rotate(-35 80 80)">
        {name === "pencil" ? (
          <>
            <path d="M65 25h30v99l-15 23-15-23Z" fill="#eac572" />
            <path d="M65 124h30l-15 23Z" fill="#ecd6b5" />
            <path d="M75 140h10l-5 8Z" fill="#536175" />
            <rect x="65" y="14" width="30" height="18" rx="4" fill="#eaa59e" />
            <path d="M75 33v84m10-84v84" stroke="#d4a54f" strokeWidth="3" />
          </>
        ) : (
          <>
            <rect
              x="57"
              y="15"
              width="47"
              height="132"
              rx="7"
              fill="#efce83"
              stroke="#d6b45e"
              strokeWidth="3"
            />
            {Array.from({ length: 10 }, (_, i) => (
              <path
                key={i}
                d={`M59 ${29 + i * 11}h${i % 2 ? 13 : 23}`}
                stroke="#9f8654"
                strokeWidth="2.5"
              />
            ))}
          </>
        )}
      </g>
    );
  if (name === "case" || name === "book")
    return name === "case" ? (
      <>
        <rect
          x="18"
          y="53"
          width="126"
          height="70"
          rx="24"
          fill="#91bbce"
          stroke="#6b99b5"
          strokeWidth="4"
        />
        <path
          d="M25 76h111"
          stroke="#d5eaf1"
          strokeWidth="5"
          strokeDasharray="5 4"
        />
        <rect x="113" y="72" width="14" height="19" rx="4" fill="#eac46d" />
        <path
          d="M48 101h28"
          stroke="#c0dbe5"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <path
          d="M28 28h94q12 0 12 13v100H35q-15 0-15-15V39q0-11 8-11"
          fill="#9db3cf"
        />
        <path d="M38 28v113" stroke="#7c96b5" strokeWidth="8" />
        <rect x="55" y="50" width="59" height="49" rx="5" fill="#fff5d9" />
        <path d="M68 68h33m-33 13h24" stroke="#d2b777" strokeWidth="4" />
        <path d="M40 130h87" stroke="#edf0e9" strokeWidth="10" />
      </>
    );
  if (name === "school" || name === "stadium")
    return name === "school" ? (
      <>
        <rect x="25" y="61" width="111" height="83" rx="9" fill="#e6bf80" />
        <path d="M15 64l65-48 66 48Z" fill="#9baeca" />
        <rect x="67" y="103" width="28" height="42" rx="5" fill="#88b5ba" />
        {[42, 110].map((x) => (
          <g key={x}>
            <rect
              x={x - 9}
              y="83"
              width="19"
              height="23"
              rx="3"
              fill="#fff8df"
            />
            <path d={`M${x} 84v21`} stroke="#d2ac73" strokeWidth="2" />
          </g>
        ))}
        <circle cx="80" cy="55" r="14" fill="#fff9e8" />
        <path d="M80 47v9h7" stroke="#6b8f9c" strokeWidth="3" />
        <path
          d="M123 24V5l20 7-20 6"
          fill="#df8d80"
          stroke="#df8d80"
          strokeWidth="3"
        />
      </>
    ) : (
      <>
        <ellipse cx="80" cy="100" rx="65" ry="37" fill="#b3c1c9" />
        <ellipse cx="80" cy="77" rx="57" ry="19" fill="#dae4e6" />
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M${20 + i * 18} 82l${31 - i * 4} 48M${23 + i * 18} 127l${28 - i * 3} -47`}
            stroke="#7e9aa9"
            strokeWidth="4"
            opacity=".85"
          />
        ))}
        <path
          d="M20 104q60 33 121-4"
          fill="none"
          stroke="#d0dce1"
          strokeWidth="6"
        />
      </>
    );
  if (name === "bed")
    return (
      <>
        <rect x="26" y="76" width="116" height="55" rx="10" fill="#9fafd1" />
        <rect x="26" y="82" width="43" height="27" rx="9" fill="#fff5df" />
        <path
          d="M22 61v83m121-47v47"
          stroke="#ad9279"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M76 84h62v39H76Z" fill="#bac9df" />
        <text x="77" y={50 - p * 10} fontSize="27" fill="#9bafd2">
          Z z
        </text>
      </>
    );
  if (name === "breakfast")
    return (
      <>
        <ellipse cx="81" cy="101" rx="68" ry="37" fill="#d3e4e4" />
        <ellipse cx="81" cy="96" rx="55" ry="29" fill="#fffdf2" />
        <path
          d="M38 72q-3-31 26-25q26-6 27 25v44H38Z"
          fill="#d9ac79"
          stroke="#b68e63"
          strokeWidth="5"
        />
        <ellipse cx="110" cy="94" rx="25" ry="19" fill="#fff6db" />
        <circle cx="111" cy="94" r="12" fill="#ecc46a" />
      </>
    );
  if (name === "kangaroo")
    return (
      <>
        <ellipse cx="80" cy="103" rx="30" ry="39" fill="#cda778" />
        <path
          d="M99 113q44 40 43 9"
          fill="none"
          stroke="#cda778"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <ellipse cx="68" cy="53" rx="22" ry="25" fill="#cda778" />
        <path
          d="M56 36l-6-26m20 22l9-24m-17 107l-20 25m46-22l6 22"
          stroke="#cda778"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="61" cy="50" r="4" fill="#44576a" />
        <path d="M63 90h34l-8 26H72Z" fill="#ead0a4" />
      </>
    );
  return null;
}
export default function Art({
  name,
  p = 0,
  colour,
}: {
  name: Name;
  p?: number;
  colour?: string;
}) {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className="art-svg">
      <Drawing name={name} p={p} colour={colour} />
    </svg>
  );
}
