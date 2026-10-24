export type Tree = { value: number } | { op: string; left: Tree; right: Tree };
export function parse(expression: string): Tree {
  const tokens =
    expression
      .replace(/×/g, "*")
      .replace(/[÷]/g, "/")
      .replace(/[−]/g, "-")
      .replace(/\s/g, "")
      .match(/\d+|[()+*\/-]/g) || [];
  if (
    tokens.join("") !==
    expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/\s/g, "")
  )
    throw Error("表达式有无法识别的字符");
  let i = 0;
  function atom(): Tree {
    if (tokens[i] === "(") {
      i++;
      const t = sum();
      if (tokens[i++] !== ")") throw Error("括号未配对");
      return t;
    }
    const t = tokens[i++];
    if (!t || !/^\d+$/.test(t)) throw Error("缺少数字");
    return { value: Number(t) };
  }
  function product(): Tree {
    let t = atom();
    while (tokens[i] === "*" || tokens[i] === "/") {
      const op = tokens[i++];
      t = { op, left: t, right: atom() };
    }
    return t;
  }
  function sum(): Tree {
    let t = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      const op = tokens[i++];
      t = { op, left: t, right: product() };
    }
    return t;
  }
  const tree = sum();
  if (i !== tokens.length) throw Error("表达式没有完整读取");
  return tree;
}
export function calculate(t: Tree): number {
  if ("value" in t) return t.value;
  const a = calculate(t.left),
    b = calculate(t.right);
  if (t.op === "/" && b === 0) throw Error("不能除以0");
  return t.op === "+"
    ? a + b
    : t.op === "-"
      ? a - b
      : t.op === "*"
        ? a * b
        : a / b;
}
export function trace(t: Tree): { expression: string; result: number }[] {
  if ("value" in t) return [];
  return [
    ...trace(t.left),
    ...trace(t.right),
    {
      expression: `${calculate(t.left)}${t.op === "*" ? "×" : t.op === "/" ? "÷" : t.op}${calculate(t.right)}`,
      result: calculate(t),
    },
  ];
}
export const exercises = [
  [6, "15÷5×7"],
  [7, "120+40-51"],
  [7, "2×8÷4"],
  [7, "56÷7÷2"],
  [7, "32-18÷2"],
  [7, "81÷9+54"],
  [7, "4×9-5×3"],
  [8, "56÷(2×4)"],
  [8, "(24-16)×9"],
  [8, "388-(27-18)"],
  [8, "4+5×7"],
  [8, "(4+5)×7"],
  [8, "(72-18)÷9"],
  [8, "72-18÷9"],
  [8, "24÷4+2"],
  [8, "24÷(4+2)"],
  [9, "32+47-28"],
  [9, "95-48-15"],
  [9, "87-13+56"],
  [9, "2×2×5"],
  [9, "42÷7÷2"],
  [9, "64÷8×7"],
  [9, "405+4×7"],
  [9, "114-4×6"],
  [9, "63÷9+8×4"],
  [9, "36÷6×5"],
  [9, "72-81÷9"],
  [9, "5×9+6×8"],
  [10, "65-5×6"],
  [10, "21÷(43-36)"],
  [10, "238-(112+23)"],
  [10, "4×(49÷7)"],
  [10, "18÷6×4"],
  [10, "(25+17)÷6"],
  [10, "160+5×9"],
  [10, "(387-323)÷8"],
  [10, "56-33-17"],
  [10, "56-(33+17)"],
  [10, "100-56-24"],
  [10, "100-(56+24)"],
  [10, "6÷3÷2"],
  [10, "6÷(3×2)"],
  [10, "8÷2÷2"],
  [10, "8÷(2×2)"],
  [11, "42+14-35"],
  [11, "7×9-28"],
  [11, "492-(15-3)"],
  [11, "250-36÷6"],
  [11, "(6+6)÷3"],
  [11, "(304-272)÷4"],
  [11, "36÷(16÷4)"],
  [11, "14÷(83-76)"],
  [11, "4×5+4×3"],
  [11, "4×(5+3)"],
  [11, "9×9-9×7"],
  [11, "9×(9-7)"],
  [11, "2×6+5×6"],
  [11, "(2+5)×6"],
  [11, "(54+9)÷7"],
  [11, "48÷(14-6)"],
  [19, "35-23+18"],
  [19, "35-(23-18)"],
  [19, "73-36+24"],
  [19, "73-(36-24)"],
  [19, "24÷8×2"],
  [19, "24÷(8÷2)"],
  [19, "18÷9×3"],
  [19, "18÷(9÷3)"],
].map(([page, expression], i) => ({
  id: `mixed-expression-${i + 1}`,
  page: Number(page),
  expression: String(expression),
}));
exercises.push(
  ...[
    "15-7+14",
    "22-7+14",
    "68-7+14",
    "30-7+14",
    "12÷3×5",
    "15÷3×5",
    "21÷3×5",
    "27÷3×5",
  ].map((expression, i) => ({
    id: `mixed-flow-${i + 1}`,
    page: 9,
    expression,
  })),
);
