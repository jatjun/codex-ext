import { test, expect, type Page } from "@playwright/test";
import {
  buildLesson,
  buildRetryLesson,
  defaultValues,
  type Lesson,
  type Task,
} from "../../src/pdf/model";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class U {
      text: string;
      lang = "";
      rate = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(s: string) {
        this.text = s;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: U,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (u: U) => setTimeout(() => u.onend?.(), 5),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
      },
    });
  });
});
async function open(page: Page, id: number) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "进入错题本动画 →", exact: true })
    .click();
  await expect(page.locator(".pdf-card")).toHaveCount(21);
  await page
    .locator(".pdf-card")
    .nth(id - 1)
    .click();
}
async function start(page: Page, timeout = 5000) {
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout });
}
async function fillTask(page: Page, l: Lesson, t: Task) {
  if (t.pick) {
    for (const id of t.pick)
      await page.locator(`[data-object="${id}"]`).click();
  }
  let value = t.answer;
  if (t.basket && l.scene.type === "shop") {
    let counts = t.counts ?? l.scene.items.map(() => 0);
    if (t.basket === "offer") {
      const highest = l.scene.items
        .map((it, i) => [it.price!, i])
        .sort((a, b) => b[0] - a[0])[0];
      counts = l.scene.items.map((_, i) => (i === highest[1] ? 2 : 0));
      value = String(2 * highest[0] - l.scene.discount!);
    }
    if (t.basket === "min" || t.basket === "max") {
      const order = l.scene.items
        .map((it, i) => [it.price!, i])
        .sort((a, b) => (t.basket === "min" ? a[0] - b[0] : b[0] - a[0]));
      counts = l.scene.items.map(() => 0);
      counts[order[0][1]]++;
      counts[l.scene.repeat ? order[0][1] : order[1][1]]++;
    }
    for (let i = 0; i < counts.length; i++)
      for (let n = 0; n < counts[i]; n++)
        await page
          .getByRole("button", {
            name: "选择" + l.scene.items[i].name,
            exact: true,
          })
          .click();
  }
  if (!t.pick) {
    const input = page.getByLabel("我的答案", { exact: true });
    if (t.options) await input.selectOption(value);
    else await input.fill(value);
  }
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
  await page.getByRole("button", { name: "下一步 →", exact: true }).click();
}
for (let id = 1; id <= 21; id++)
  test(`PDF ${id}: solve every original and transfer task, preserving records`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page, id);
    await start(page);
    const l = buildLesson(id),
      transfer = buildLesson(id, defaultValues(id), true);
    for (const t of l.tasks) await fillTask(page, l, t);
    await expect(page.locator(".pdf-state")).toContainText("独立迁移");
    for (const t of transfer.tasks) await fillTask(page, transfer, t);
    await expect(
      page.getByRole("heading", { name: "✓ 这次发现，记住了吗？" }),
    ).toBeVisible();
    const records = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("math-adventure.records.v1") || "[]"),
    );
    expect(records.length).toBe(l.tasks.length + transfer.tasks.length);
    expect(
      records.every(
        (r: { completed: boolean; firstCorrect: boolean }) =>
          r.completed && r.firstCorrect,
      ),
    ).toBeTruthy();
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  });
test("PDF hints escalate, explanation requires retry, first incorrect remains immutable", async ({
  page,
}) => {
  await open(page, 13);
  await start(page);
  await page.getByLabel("我的答案", { exact: true }).fill("5");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-state")).toContainText("轻提示");
  await expect(page.locator(".pdf-hint")).not.toContainText("17");
  await expect(
    page.getByRole("button", { name: "下一步 →", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(page.locator(".pdf-state")).toContainText("图形提示");
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "用一道相似题重新试试", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "用一道相似题重新试试", exact: true })
    .click();
  await page
    .getByLabel("我的答案", { exact: true })
    .fill(buildRetryLesson(13, defaultValues(13)).tasks[0].answer);
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-state")).toContainText("自己试一试");
  await page.getByLabel("我的答案", { exact: true }).fill("17");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
  const first = await page.evaluate(
    () => JSON.parse(localStorage.getItem("math-adventure.records.v1")!)[0],
  );
  expect(first.firstAnswer).toBe("5");
  expect(first.firstCorrect).toBe(false);
  expect(first.correct).toBe(true);
  expect(first.watchedExplanation).toBe(true);
  expect(first.hints).toBe(3);
});
test("PDF pause freezes actual positions; replay has no duplicate pieces; edits stay isolated", async ({
  page,
}) => {
  // A full 4-second replay needs rendering margin on shared WebKit CI runners.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, 1);
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await page.waitForTimeout(2100);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  await page.waitForTimeout(100);
  const a = await page
    .locator("[data-piece]")
    .first()
    .getAttribute("transform");
  await page.waitForTimeout(650);
  expect(
    await page.locator("[data-piece]").first().getAttribute("transform"),
  ).toBe(a);
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator("[data-piece]")).toHaveCount(20);
  await page.getByRole("button", { name: "重播动画", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator("[data-piece]")).toHaveCount(20);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("正方形数量", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "应用数字，重新开始", exact: true })
    .click();
  await start(page, 15000);
  await expect(page.locator('[data-piece="正方形"]')).toHaveCount(5);
  await expect(page.locator("[data-piece]")).toHaveCount(18);
});
test("PDF rejects invalid edits without changing the active scene", async ({
  page,
}) => {
  await open(page, 14);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("要来的总人数", { exact: true }).fill("4");
  await page
    .getByRole("button", { name: "应用数字，重新开始", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("已有部分应小于总数");
  await start(page);
  await expect(page.locator("[data-quantity]")).toHaveCount(17);
});

test("shopping hints compare prices and full explanation moves a valid basket into view", async ({
  page,
}) => {
  await open(page, 21);
  await start(page);
  await page.getByLabel("我的答案", { exact: true }).fill("22");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-hint")).not.toContainText("44");
  await expect(page.locator(".pdf-demo-total")).toHaveCount(0);
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(page.getByLabel("单价比较", { exact: true })).toBeVisible();
  await expect(page.locator(".pdf-basket span")).toHaveCount(0);
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "用一道相似题重新试试", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".pdf-basket span")).toHaveCount(2);
  await expect(page.locator(".pdf-demo-total")).toContainText("44元");
});
test("notebook scene scrolling stays internal at 320px and landscape", async ({
  page,
}) => {
  for (const width of [320, 667]) {
    await page.setViewportSize({ width, height: width === 320 ? 760 : 375 });
    for (const id of [1, 3, 6, 8, 11, 14, 16, 18]) {
      await open(page, id);
      await start(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
});
