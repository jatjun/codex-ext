import { test, expect, type Page } from "@playwright/test";
import {
  defaultQueue,
  defaults,
  queueCatalog,
  type QueueKind,
} from "../../src/questions/models";
import {
  buildLevel,
  buildQueueLevel,
  makeAnimals,
  makePatterns,
} from "../../src/questions/builders";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class Utterance {
      text: string;
      lang = "";
      rate = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: Utterance,
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: (u: Utterance) => setTimeout(() => u.onend?.(), 5),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
      },
      configurable: true,
    });
  });
});
async function queue(page: Page, kind: QueueKind) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "进入排队动画实验室 →", exact: true })
    .click();
  await page
    .locator(".queue-type-card")
    .filter({ hasText: queueCatalog.find((q) => q.kind === kind)!.title })
    .click();
}
async function start(page: Page) {
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /检查我的想法|检查分类/ }).first(),
  ).toBeVisible({ timeout: 30000 });
}
async function answer(page: Page, value: string) {
  await page.getByLabel(/我的答案/).fill(value);
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(page.locator(".feedback.success")).toBeVisible();
}
async function next(page: Page) {
  await page.locator(".success-next button").click();
}
async function edit(page: Page, values: Record<string, string>) {
  const details = page.locator(".configuration details");
  if (!(await details.evaluate((e) => e.hasAttribute("open"))))
    await details.locator("summary").click();
  for (const [label, value] of Object.entries(values))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "应用数字，重新开始", exact: true })
    .click();
}
for (const topic of queueCatalog)
  test(
    "queue " + topic.kind + ": animate, solve, transfer and retain parameters",
    async ({ page }) => {
      await queue(page, topic.kind);
      await start(page);
      const config = defaultQueue(topic.kind),
        level = buildQueueLevel(config);
      if (topic.kind === "rectangle")
        await expect(page.locator("[data-queue-position]")).toHaveCount(80);
      if (topic.kind === "change")
        await expect(page.locator("[data-queue-person]")).toHaveCount(16);
      if (topic.kind === "swap") {
        await expect(page.locator(".queue-person.ming")).toHaveAttribute(
          "data-rank",
          "11",
        );
        await expect(page.locator(".queue-person.hong")).toHaveAttribute(
          "data-rank",
          "5",
        );
      }
      for (const q of level.questions) {
        await answer(page, q.answer);
        await next(page);
      }
      for (const q of level.transfer) {
        await answer(page, q.answer);
        await next(page);
      }
      await expect(
        page.getByRole("heading", { name: "你找到方法啦！" }),
      ).toBeVisible();
      const records = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("math-adventure.records.v1") || "[]"),
      );
      expect(
        records.every(
          (r: {
            parameters?: string;
            questionText?: string;
            completed: boolean;
          }) =>
            r.parameters?.includes(topic.kind) && r.questionText && r.completed,
        ),
      ).toBe(true);
    },
  );
test("unknown order: both legal lengths must be given; invalid ordering is rejected", async ({
  page,
}) => {
  await queue(page, "missing");
  await edit(page, { 小明从后排第几: "8" });
  await start(page);
  await page
    .getByRole("button", { name: "小明在前，小红在后", exact: true })
    .click();
  await expect(page.locator("[data-queue-person]")).toHaveCount(11);
  await page
    .getByRole("button", { name: "小红在前，小明在后", exact: true })
    .click();
  await expect(page.locator("[data-queue-person]")).toHaveCount(19);
  await page.getByLabel(/我的答案/).fill("19");
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(page.getByText("找一个线索", { exact: true })).toBeVisible();
  await answer(page, "19、11");
  await edit(page, { 小明从后排第几: "3" });
  await page.getByLabel("题目是否指定先后顺序").selectOption("ming-first");
  await page
    .getByRole("button", { name: "应用数字，重新开始", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("不能同时成立");
});
test("shop supports 24 coins, 3 toys, and immutable records across number edits", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: "玩具商店" }).click();
  await edit(page, { 每只玩具几元: "6", 乐乐买几只玩具: "3" });
  await start(page);
  await page.getByLabel(/我的答案/).fill("12");
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await answer(page, "24");
  await next(page);
  await page.getByLabel("24元是3只玩具的总价", { exact: true }).check();
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await next(page);
  for (let i = 0; i < 24; i++)
    await page
      .getByRole("button", { name: "给第1只玩具 1 枚", exact: true })
      .click();
  await expect(page.locator("[data-coin]")).toHaveCount(24);
  expect(
    await page.locator(".shop-scene svg.math-svg").evaluate((svg) => {
      const box = svg.getBoundingClientRect();
      return [...svg.querySelectorAll("[data-coin]")].every((c) => {
        const r = c.getBoundingClientRect();
        return (
          r.top >= box.top - 1 &&
          r.bottom <= box.bottom + 1 &&
          r.left >= box.left - 1 &&
          r.right <= box.right + 1
        );
      });
    }),
  ).toBe(true);
  await page.getByLabel(/我的答案/).fill("8");
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(page.getByText("找一个线索", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "重新分配", exact: true }).click();
  for (let i = 0; i < 8; i++)
    for (let g = 1; g <= 3; g++)
      await page
        .getByRole("button", { name: "给第" + g + "只玩具 1 枚", exact: true })
        .click();
  await answer(page, "8");
  await edit(page, {
    阳阳买几只玩具: "3",
    每只玩具几元: "4",
    乐乐买几只玩具: "2",
  });
  await start(page);
  await answer(page, "12");
  const rows = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("math-adventure.records.v1") || "[]"),
  );
  const totals = rows.filter(
    (r: { questionId: string }) => r.questionId === "total",
  );
  expect(totals).toHaveLength(2);
  expect(totals[0].firstCorrect).toBe(false);
  expect(totals[1].firstCorrect).toBe(true);
  expect(totals[0].parameters).toContain('"price":6');
  expect(totals[1].parameters).toContain('"price":4');
});
test("changed shape values update points, sum and product", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: "图形密码" }).click();
  await edit(page, { 每颗星星的能量: "7", 每个三角形的能量: "5" });
  await start(page);
  for (const value of ["7", "5", "12", "35"]) {
    await answer(page, value);
    await next(page);
  }
  const settings = structuredClone(defaults);
  settings.shapes.starValue = 7;
  settings.shapes.triangleValue = 5;
  for (const q of buildLevel("shapes", settings).transfer) {
    await answer(page, q.answer);
    await next(page);
  }
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
});
test("changed animal and pattern quantities conserve totals under both classifications", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: "分类小侦探" }).click();
  await edit(page, {
    蝴蝶的数量: "5",
    蜻蜓的数量: "4",
    鱼的数量: "3",
    迁移图案总数: "9",
  });
  await start(page);
  const animals = makeAnimals({
    butterflies: 5,
    dragonflies: 4,
    fish: 3,
    patternCount: 9,
  });
  await expect(page.locator("[data-object-id]")).toHaveCount(12);
  for (const key of ["kind", "habitat"] as const) {
    for (const a of animals) {
      await page.locator('[data-object-id="' + a.id + '"]').click();
      await page
        .getByRole("button", { name: "放入" + a[key], exact: true })
        .click();
    }
    await page.getByRole("button", { name: "检查分类", exact: true }).click();
    await next(page);
  }
  const patterns = makePatterns(9);
  await expect(page.locator("[data-object-id]")).toHaveCount(9);
  for (const key of ["color", "form"] as const) {
    for (const p of patterns) {
      await page.locator('[data-object-id="' + p.id + '"]').click();
      await page
        .getByRole("button", { name: "放入" + p[key], exact: true })
        .click();
    }
    await page.getByRole("button", { name: "检查分类", exact: true }).click();
    await next(page);
  }
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
});
test("square rank change yields solid 7x7 and independent 5x5", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: "操场排队" }).click();
  await edit(page, { 中间的人从每个方向排第几: "4" });
  await start(page);
  await expect(page.locator("[data-position]")).toHaveCount(49);
  await answer(page, "7");
  await next(page);
  await answer(page, "49");
  await next(page);
  await expect(page.locator("[data-position]")).toHaveCount(25);
  await answer(page, "25");
  await next(page);
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
});
test("invalid numbers do not mutate the active problem; queue pauses and mobile scroll stays inside scene", async ({
  page,
}) => {
  await queue(page, "reverse");
  await start(page);
  await edit(page, { 小明从前排第几: "16" });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("[data-queue-person]")).toHaveCount(15);
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  const before = await page.locator(".queue-strip").innerHTML();
  await page.waitForTimeout(400);
  expect(await page.locator(".queue-strip").innerHTML()).toBe(before);
  await expect(
    page.getByRole("button", { name: "从前数一步", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "从前数一步", exact: true }).click();
  await expect(page.locator(".queue-scene .scene-math-readout")).toContainText(
    "从前数：1",
  );
});
test("queue moving objects freeze during observation and replay never duplicates people", async ({
  page,
}) => {
  await queue(page, "swap");
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await expect(page.locator("[data-queue-person]")).toHaveCount(15);
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  const snapshot = await page.locator(".queue-strip").innerHTML();
  await page.waitForTimeout(500);
  expect(await page.locator(".queue-strip").innerHTML()).toBe(snapshot);
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "检查我的想法", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await expect(page.locator(".queue-person.ming")).toHaveAttribute(
    "data-rank",
    "11",
  );
  await page
    .getByRole("button", { name: "↻ 重播当前动画", exact: true })
    .click();
  await page
    .getByRole("button", { name: "↻ 重播当前动画", exact: true })
    .click();
  await expect(page.locator("[data-queue-person]")).toHaveCount(15);
  await page.getByRole("button", { name: "← 冒险地图", exact: true }).click();
  await expect(page.locator("[data-queue-person]")).toHaveCount(0);
});
