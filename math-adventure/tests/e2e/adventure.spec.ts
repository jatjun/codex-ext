import { test, expect, type Page } from "@playwright/test";
import { animals, patterns } from "../../src/questions/data";
const key = "math-adventure.records.v1";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Browser voice availability differs by OS; exercise the barrier with deterministic voice events.
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
async function start(page: Page, name: string) {
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: name }).click();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /检查我的想法|检查分类/ }).first(),
  ).toBeVisible({ timeout: 25000 });
}
async function answer(page: Page, value: string) {
  await page.getByLabel(/我的答案/).fill(value);
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(
    page.getByText("发现了！你能说说每个数代表什么吗？"),
  ).toBeVisible();
}
async function next(page: Page) {
  await page.locator(".success-next button").click();
}
async function place(page: Page, id: string, group: string) {
  await page.locator('[data-object-id="' + id + '"]').click();
  await page.getByRole("button", { name: "放入" + group, exact: true }).click();
}
test("shop: complete genuine two-step interaction and preserve first wrong answer", async ({
  page,
}) => {
  await start(page, "玩具商店");
  await answer(page, "12");
  await next(page);
  await page.getByLabel("12元是两只玩具的总价", { exact: true }).check();
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await next(page);
  for (let i = 0; i < 6; i++) {
    await page
      .getByRole("button", { name: "给左边玩具 1 枚", exact: true })
      .click();
    await page
      .getByRole("button", { name: "给右边玩具 1 枚", exact: true })
      .click();
  }
  await expect(
    page.getByText("左边 6 枚 · 右边 6 枚 · 还剩 0 枚"),
  ).toBeVisible();
  await page.getByLabel(/我的答案/).fill("12");
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(page.getByText("找一个线索", { exact: true })).toBeVisible();
  await expect(page.locator(".earned-equation")).toHaveCount(0);
  await answer(page, "6");
  await next(page);
  await expect(page.getByRole("heading", { name: /新任务/ })).toBeVisible();
  await answer(page, "6");
  await page.getByRole("button", { name: "完成本关 ✓" }).click();
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
  const records = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || "[]"),
    key,
  );
  const share = records.find(
    (r: { questionId: string }) => r.questionId === "share",
  );
  expect(share.firstCorrect).toBe(false);
  expect(share.firstAnswer).toMatch(/^12/);
  expect(share.correct).toBe(true);
  expect(share.attempts).toBe(2);
  expect(records.every((r: { completed: boolean }) => r.completed)).toBe(true);
});
test("shapes: first wrong sum hints, visual merge, multiplication, independent transfer", async ({
  page,
}) => {
  await start(page, "图形密码");
  await answer(page, "6");
  await next(page);
  await answer(page, "4");
  await next(page);
  await page.getByLabel(/我的答案/).fill("12");
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(page.getByText("找一个线索", { exact: true })).toBeVisible();
  await expect(page.locator(".math-svg .equation").last()).toContainText("？");
  await page.getByRole("button", { name: "合并能量，逐个数一数" }).click();
  await expect(page.locator(".energy-dot")).toHaveCount(10);
  await answer(page, "10");
  await next(page);
  await answer(page, "24");
  await next(page);
  await answer(page, "11");
  await next(page);
  await answer(page, "28");
  await page.getByRole("button", { name: "完成本关 ✓" }).click();
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
});
test("detective: same objects classify by species/habitat and transfer by color/form", async ({
  page,
}) => {
  await start(page, "分类小侦探");
  await expect(page.locator("[data-object-id]")).toHaveCount(20);
  await page.getByRole("button", { name: "检查分类", exact: true }).click();
  await expect(page.getByText("找一个线索", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "检查分类", exact: true }).click();
  await expect(page.locator(".unplaced-highlight")).toHaveCount(20);
  for (const a of animals) await place(page, a.id, a.kind);
  await page.getByRole("button", { name: "检查分类", exact: true }).click();
  await next(page);
  for (const a of animals) await place(page, a.id, a.habitat);
  await page.getByRole("button", { name: "检查分类", exact: true }).click();
  await expect(
    page.getByText("14＋6＝20，分类标准变了，总数不变！"),
  ).toBeVisible();
  await next(page);
  for (const p of patterns) await place(page, p.id, p.color);
  await page.getByRole("button", { name: "检查分类", exact: true }).click();
  await next(page);
  for (const p of patterns) await place(page, p.id, p.form);
  await page.getByRole("button", { name: "检查分类", exact: true }).click();
  await page.getByRole("button", { name: "完成本关 ✓" }).click();
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
});
test("square: solid 25 positions, center-count reasoning and 3x3 transfer", async ({
  page,
}) => {
  await start(page, "操场排队");
  await expect(page.locator("[data-position]")).toHaveCount(25);
  await answer(page, "5");
  await next(page);
  await answer(page, "25");
  await next(page);
  await expect(page.locator("[data-position]")).toHaveCount(9);
  await page.getByLabel(/我的答案/).fill("8");
  await page.getByRole("button", { name: "检查我的想法", exact: true }).click();
  await expect(
    page.getByText("先数一行有几人，再数一共有几行。"),
  ).toBeVisible();
  await expect(page.locator(".earned-equation")).toHaveCount(0);
  await answer(page, "9");
  await page.getByRole("button", { name: "完成本关 ✓" }).click();
  await expect(
    page.getByRole("heading", { name: "你找到方法啦！" }),
  ).toBeVisible();
});
test("pause freezes animation, replay replaces objects, route cleanup and refresh are safe", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: "玩具商店" }).click();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  const before = await page.locator(".math-svg").innerHTML();
  await page.waitForTimeout(700);
  expect(await page.locator(".math-svg").innerHTML()).toBe(before);
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "检查我的想法", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await page
    .getByRole("button", { name: "↻ 重播当前动画", exact: true })
    .click();
  await page
    .getByRole("button", { name: "↻ 重播当前动画", exact: true })
    .click();
  await expect(page.locator(".math-svg")).toHaveCount(1);
  await page.getByRole("button", { name: "← 冒险地图", exact: true }).click();
  await expect(page.locator(".math-svg")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /今天，想探索哪一个秘密/ }),
  ).toBeVisible();
});
test("third hint requires complete demonstration and similar retry before original question", async ({
  page,
}) => {
  await start(page, "玩具商店");
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "✧ 我不会，需要帮助", exact: true })
      .click();
  await expect(page.getByRole("heading", { name: "一起慢慢看" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "我来试一道相似题", exact: true }),
  ).toBeEnabled({ timeout: 20000 });
  await page
    .getByRole("button", { name: "我来试一道相似题", exact: true })
    .click();
  await page.getByLabel("我的答案", { exact: true }).fill("6");
  await page.getByRole("button", { name: "检查小练习", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "阳阳一共花了多少钱？" }),
  ).toBeVisible();
  const records = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || "[]"),
    key,
  );
  expect(records[0].firstAnswer).toBe("需要帮助");
  expect(records[0].watchedExplanation).toBe(true);
});
test("parent report exports, corrupt storage recovery, small-screen and landscape overflow", async ({
  page,
}) => {
  await page.goto("/");
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(size);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "家长手记 ↗" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.json$/);
  await page.evaluate((k) => localStorage.setItem(k, "broken json"), key);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /今天，想探索哪一个秘密/ }),
  ).toBeVisible();
});
test("every lesson fits a 320px screen and landscape, with no horizontal page overflow", async ({
  page,
}) => {
  for (const name of ["玩具商店", "图形密码", "分类小侦探", "操场排队"]) {
    await page.setViewportSize({ width: 320, height: 700 });
    await start(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 844, height: 390 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("narration barrier holds the picture until speech ends and pause calls native voice pause", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const gate = window as unknown as {
      voiceEnd?: () => void;
      voicePauses: number;
      voiceCancels: number;
    };
    gate.voicePauses = 0;
    gate.voiceCancels = 0;
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: (u: { onend?: () => void }) => {
          gate.voiceEnd = () => u.onend?.();
        },
        cancel: () => {
          gate.voiceCancels++;
        },
        pause: () => {
          gate.voicePauses++;
        },
        resume: () => {},
        getVoices: () => [],
      },
      configurable: true,
    });
  });
  await page.goto("/");
  await page.locator(".level-card").filter({ hasText: "玩具商店" }).click();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await expect(page.locator(".narration")).toContainText("欢迎来到玩具商店");
  await page.waitForTimeout(650);
  await expect(page.locator(".narration")).toContainText("欢迎来到玩具商店");
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { voicePauses: number }).voicePauses,
    ),
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as { voiceEnd?: () => void }).voiceEnd?.(),
  );
  await expect(page.locator(".narration")).toContainText("第一只玩具进篮子");
  await page.getByRole("button", { name: "← 冒险地图", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { voiceCancels: number }).voiceCancels,
    ),
  ).toBeGreaterThan(0);
});
