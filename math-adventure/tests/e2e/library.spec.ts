import { test, expect } from "@playwright/test";
import { buildLesson, defaultValues } from "../../src/pdf/model";
import { newEntry } from "../../src/records/store";
test("跨题本按类型汇总，原题条件和题号清楚可见", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "按题型找原题 →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "按题型找原题", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("260");
  await page.getByRole("button", { name: /^排队与方阵/ }).click();
  await expect(page.locator(".library-grid")).toContainText("排队专题");
  await page.getByRole("textbox").fill("动物过桥");
  await page
    .getByRole("button", { name: "看动画，再做对应练习 →", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "原题与问题" })).toContainText(
    "原题7",
  );
});
test("来源深链接显示完整原题，编辑后仍保留原始条件", async ({ page }) => {
  await page.goto("/?entry=pdf-12");
  await expect(page.getByRole("region", { name: "原题与问题" })).toBeVisible();
  await expect(page.locator(".original-diagram img")).toBeVisible();
  expect(
    await page
      .locator(".original-diagram img")
      .evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0),
  ).toBe(true);
  const original = await page
    .getByRole("region", { name: "原题与问题" })
    .textContent();
  await page.getByText("⚙ 调整本题数字", { exact: true }).click();
  const input = page.locator(".pdf-config input").first();
  await input.fill("5");
  await page
    .getByRole("button", { name: "应用数字，重新开始", exact: true })
    .click();
  expect(
    await page.getByRole("region", { name: "原题与问题" }).textContent(),
  ).toBe(original);
});
test("三科错题汇集、作品分开、标记不修改首次答案、可以导出", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "math-adventure.records.v1",
      JSON.stringify([
        {
          id: "math",
          levelId: "shop",
          questionId: "q",
          questionText: "测试原题：每个多少钱？",
          storyText: "4只玩具，每只3元。另一人花同样的钱买2个。",
          dateTime: "2026-10-22",
          firstAnswer: "12",
          firstCorrect: false,
          attempts: 1,
          events: [],
          errors: [],
          interactionMs: 1,
        },
      ]),
    );
    localStorage.setItem(
      "chinese-adventure.records.v1",
      JSON.stringify([
        {
          id: "cn",
          lesson: "cn-1-1",
          task: 0,
          phase: "main",
          questionText: "语文原题测试",
          firstAnswer: "错拼音",
          firstCorrect: false,
          attempts: 1,
          date: "2026-10-22",
          answerHistory: [],
        },
      ]),
    );
    localStorage.setItem(
      "english-adventure.records.v1",
      JSON.stringify([
        {
          id: "en",
          lesson: "en-1-1",
          task: "queen-gap",
          phase: "main",
          questionText: "英语原题测试",
          firstAnswer: { text: "k" },
          firstCorrect: false,
          attempts: 1,
          date: "2026-10-22",
          history: [],
        },
        {
          id: "work",
          lesson: "en-2-8",
          task: "draw-playground",
          phase: "main",
          firstAnswer: { text: "I like running." },
          firstCorrect: null,
          attempts: 1,
          date: "2026-10-22",
          history: [],
        },
      ]),
    );
  });
  await page.goto("http://127.0.0.1:4198/mistakes.html");
  await expect(page.locator(".card")).toHaveCount(3);
  await expect(page.locator("#groups")).toContainText("测试原题：每个多少钱？");
  await page.getByRole("button", { name: /^数学/ }).click();
  await page
    .getByRole("button", { name: "我复习过了，做个标记", exact: true })
    .click();
  await expect(page.locator(".card")).toHaveCount(0);
  await page.getByLabel("复习状态").selectOption("reviewed");
  await expect(page.locator(".first")).toContainText("12");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("math-adventure.records.v1")!)[0]
          .firstCorrect,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: /^全部/ }).click();
  await page.getByLabel("复习状态").selectOption("works");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".first")).toContainText("作品自查");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出当前筛选 JSON" }).click();
  expect((await download).suggestedFilename()).toContain("三科错题本");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("数学错题保存原条件快照并可真正重做", async ({ page }) => {
  const values = defaultValues(12),
    lesson = buildLesson(12, values),
    task = lesson.tasks[0];
  const row = {
    ...newEntry("history", "pdf-12", "main-" + task.id, false),
    firstAnswer: "错误数量",
    firstCorrect: false,
    attempts: 1,
    questionText: task.prompt,
    storyText: lesson.story,
    parameters: JSON.stringify({ original: values }),
    lessonSnapshot: lesson,
  };
  await page.addInitScript(
    (r) =>
      localStorage.setItem("math-adventure.records.v1", JSON.stringify([r])),
    row,
  );
  await page.goto("http://127.0.0.1:4198/mistakes.html?subject=math");
  await page
    .getByRole("link", { name: "回到这道题重做 →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "重做这道错题" }),
  ).toBeVisible();
  await expect(page.locator(".pdf-intro")).toContainText(lesson.story);
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await page.getByRole("button", { name: "静音", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("math-adventure.records.v1")!)[0]
          .firstAnswer,
    ),
  ).toBe("错误数量");
});
