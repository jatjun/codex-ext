import { test, expect } from "@playwright/test";
import { lessons } from "../../src/catalog";
test("错题深链接保留听力小问与首次错答，重做另存记录", async ({ page }) => {
  const l = lessons.find((l) => l.id === "en-2-1")!,
    t = l.tasks[3];
  await page.addInitScript(
    ({ id, task }) =>
      localStorage.setItem(
        "english-adventure.records.v1",
        JSON.stringify([
          {
            id: "old",
            lesson: id,
            task,
            phase: "main",
            date: "2026-10-22",
            firstAnswer: { text: "blue" },
            firstCorrect: false,
            attempts: 1,
            history: [],
          },
        ]),
      ),
    { id: l.id, task: t.id },
  );
  await page.goto("/?review=old");
  await expect(page.getByRole("link", { name: "我的错题本" })).toBeVisible();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.locator(".task-panel .primary").click();
  await expect(
    page.getByRole("heading", { name: t.prompt, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "听不清／无法播放，改用文字学习" })
    .click();
  await page.getByRole("button", { name: "绿色的鱼", exact: true }).click();
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  const r = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("english-adventure.records.v1")!),
  );
  expect(r[0].firstAnswer.text).toBe("blue");
  expect(r.length).toBe(2);
  expect(r[1].firstAssisted).toBe(true);
});
