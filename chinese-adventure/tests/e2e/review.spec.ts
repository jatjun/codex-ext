import { test, expect } from "@playwright/test";
import { lessons } from "../../src/catalog";
test("错题深链接回到正确的原题小问，保留历史并建立新作答", async ({ page }) => {
  const l = lessons.find(
    (l) => l.tasks.length > 1 && l.tasks[1].mode === "choice",
  )!;
  await page.addInitScript(
    ({ id }) =>
      localStorage.setItem(
        "chinese-adventure.records.v1",
        JSON.stringify([
          {
            id: "old",
            lesson: id,
            task: 1,
            phase: "main",
            date: "2026-10-22",
            firstAnswer: "旧错答",
            firstCorrect: false,
            attempts: 1,
            answerHistory: [],
          },
        ]),
      ),
    { id: l.id },
  );
  await page.goto("/?review=old");
  await expect(page.getByRole("link", { name: "我的错题本" })).toBeVisible();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "看下一步 →", exact: true }).click();
  await page.getByRole("button", { name: "我来试试 →", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: l.tasks[1].prompt, exact: true }),
  ).toBeVisible();
  await page
    .locator(".options")
    .getByRole("button", { name: l.tasks[1].answers[0], exact: true })
    .click();
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  const r = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("chinese-adventure.records.v1")!),
  );
  expect(r[0].firstAnswer).toBe("旧错答");
  expect(r.length).toBe(2);
});
