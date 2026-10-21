import type { Frame } from "./timeline";
import { defaults, type LessonModel } from "../questions/models";
import { queueFrames } from "../questions/queue";
const f = (text: string, duration = 1400): Frame => ({ text, duration });
export function makeStoryboards(model: LessonModel = defaults) {
  const s = model.shop,
    sh = model.shapes,
    d = model.detective,
    rank = model.square.rank,
    side = rank * 2 - 1;
  return {
    shop: [
      f(`欢迎来到玩具商店。每只玩具需要${s.price}元。`),
      ...Array.from({ length: s.count }, (_, i) =>
        f(
          `第${i + 1}只玩具进篮子，付${s.price}枚金币，现在共${(i + 1) * s.price}枚。`,
        ),
      ),
      f(
        `乐乐也花了这${s.count * s.price}元。金币来到分配区，等你平均分给${s.groups}只玩具。`,
        1800,
      ),
    ],
    shapes: [
      f(`${sh.stars}颗星星，对应${sh.stars * sh.starValue}枚能量点。`),
      f(`把能量点平均分入${sh.stars}个同大格子。`, 2800),
      f(`每颗星星有${sh.starValue}点能量。`),
      f(
        `${sh.triangles}个三角形，对应${sh.triangles * sh.triangleValue}枚能量点。`,
      ),
      f(`把能量点平均分入${sh.triangles}个格子。`, 2800),
      f(`每个三角形有${sh.triangleValue}点能量。请解开计算台的密码。`),
    ],
    detective: [
      f(
        `${d.butterflies + d.dragonflies + d.fish}位动物朋友来到了这里，看看它们的样子。`,
      ),
      f("先按种类分类。可以拖动，或先点朋友，再点分类框顶部按钮。"),
      f("每位朋友只放进一个框，分完后检查总数。"),
    ],
    square: [
      ...Array.from({ length: side }, (_, r) =>
        f(`第${r + 1}行，每行${side}位小朋友依次入场。`, 1300),
      ),
      ...["从前往后", "从后往前", "从左往右", "从右往左"].flatMap((dir) =>
        Array.from({ length: rank }, (_, k) =>
          f(
            `${dir}数：${k + 1}。${k + 1 === rank ? "找到同一个中间小朋友。" : ""}`,
            850,
          ),
        ),
      ),
      ...Array.from({ length: side }, (_, r) =>
        f(`高亮第${r + 1}行，每行${side}人。`, 850),
      ),
      f("这是实心队伍，里面也有人。请你算一算总人数。"),
    ],
    queue: model.queue
      ? queueFrames(model.queue)
      : [f("选择一种排队题，开始探索。")],
  };
}
export const storyboards = makeStoryboards();
