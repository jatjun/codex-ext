import { build } from "../math-adventure/node_modules/esbuild/lib/main.js";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import vm from "node:vm";
mkdirSync(".git/review-notebooks", { recursive: true });
await build({
  stdin: {
    contents: `import {mathLibrary} from './math-adventure/src/library/catalog';import {lessons as cn} from './chinese-adventure/src/catalog';import {lessons as en} from './english-adventure/src/catalog';console.log(JSON.stringify({math:mathLibrary,chinese:cn.map(l=>({id:l.id,title:l.title,topic:l.kind,source:'语文'+l.book+'册 · 原题'+l.number,prompts:l.tasks.map(t=>t.prompt)})),english:en.map(l=>({id:l.id,title:l.title,topic:l.kind,source:'英语'+l.book+'册 · 原题'+l.number,prompts:l.tasks.map(t=>({id:t.id,prompt:t.prompt}))}))}));`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: ".git/review-notebooks/catalog.cjs",
});
let data = "";
vm.runInNewContext(readFileSync(".git/review-notebooks/catalog.cjs", "utf8"), {
  structuredClone,
  console: { log: (s) => (data = s + "\n") },
});
const parsed = JSON.parse(data);
if (process.argv.includes("--check")) {
  if (
    readFileSync("learning-home/learning-catalog.json", "utf8") !==
    data.toString()
  )
    throw Error("请重新生成学习目录：node scripts/build-learning-catalog.mjs");
} else writeFileSync("learning-home/learning-catalog.json", data);
console.log(
  Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, v.length])),
);
