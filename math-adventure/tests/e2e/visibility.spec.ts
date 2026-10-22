import { test, expect } from "@playwright/test";
test("数学勾选隐藏与恢复、刷新保留、旧题本入口同步", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "按题型找原题 →", exact: true })
    .click();
  await page.getByRole("textbox").fill("动物过桥");
  const check = page.getByRole("checkbox", {
    name: "显示这题：动物过桥",
    exact: true,
  });
  await check.click();
  await expect(check).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "进入错题本动画 →", exact: true })
    .click();
  await expect(
    page.locator(".pdf-card").filter({ hasText: "动物过桥" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "查看全部（含隐藏）", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "显示这题：动物过桥（已隐藏）",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "只看勾选的题目", exact: true })
    .click();
  await expect(
    page.locator(".pdf-card").filter({ hasText: "动物过桥" }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("错题本可以独立隐藏并恢复，原始错答不变", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "math-adventure.records.v1",
      JSON.stringify([
        {
          id: "m",
          levelId: "shop",
          questionId: "q",
          questionText: "测试错题",
          lessonTitle: "玩具商店",
          attempts: 1,
          firstCorrect: false,
          firstAnswer: "12",
          events: [],
          errors: [],
          interactionMs: 1,
          dateTime: "2026-10-22",
        },
      ]),
    ),
  );
  await page.goto("http://127.0.0.1:4198/mistakes.html?subject=math");
  await page.getByRole("checkbox", { name: "显示这道错题：玩具商店" }).click();
  await expect(page.locator(".card")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".card")).toHaveCount(0);
  await page.getByRole("button", { name: "查看全部（含隐藏错题）" }).click();
  await page.getByRole("checkbox", { name: "显示这道错题：玩具商店" }).check();
  await page.getByRole("button", { name: "只看勾选的错题" }).click();
  await expect(page.locator(".first")).toContainText("12");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("math-adventure.records.v1")!)[0]
          .firstCorrect,
    ),
  ).toBe(false);
});
