import { test, expect } from "@playwright/test";
const cases = [
  ["公交站", "−", "+", "11", "29", "23", "25"],
  ["酸奶工坊", "×", "+", "18", "22", "17", "23"],
  ["桃子装盒", "+", "÷", "40", "5", "5", "6"],
  ["窗花作坊", "−", "−", "82", "67", "20", "30"],
  ["花朵花园", "−", "×", "5", "10", "15", "14"],
  ["串珠工坊", "−", "÷", "16", "2", "2", "2"],
];
for (const [title, op1, op2, first, total, practice, transfer] of cases)
  test(title + " full independent sequence", async ({ page }) => {
    await page.goto("/?unit=mixed");
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: "开始：先想第一步" }).click();
    for (const [op, answer] of [
      [op1, first],
      [op2, total],
    ]) {
      await page.getByRole("button", { name: op, exact: true }).click();
      await page.getByRole("button", { name: "继续动画" }).click();
      await page.getByRole("spinbutton", { name: "我的答案" }).waitFor();
      await page.getByRole("spinbutton", { name: "我的答案" }).fill(answer);
      await page.getByRole("button", { name: "检查我的想法" }).click();
    }
    await page.locator(".reason").first().click();
    await page.getByRole("button", { name: "独立练习", exact: true }).click();
    await expect(page.locator(".mix-scene")).toHaveCount(0);
    await page.getByRole("spinbutton", { name: "我的答案" }).fill(practice);
    await page.getByRole("button", { name: "检查我的想法" }).click();
    await page.locator(".reason").first().click();
    await page.getByRole("button", { name: "换情境再试" }).click();
    await page.getByRole("spinbutton", { name: "我的答案" }).fill(transfer);
    await page.getByRole("button", { name: "检查我的想法" }).click();
    await page.locator(".reason").first().click();
    await expect(
      page.getByRole("button", { name: "完成本课，选择下一课" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("wrong answer preserves first response and pause keeps quantities stable", async ({
  page,
}) => {
  await page.goto("/?unit=mixed");
  await page.getByRole("button", { name: /公交站/ }).click();
  await page.getByRole("button", { name: "开始：先想第一步" }).click();
  await page.getByRole("button", { name: "+", exact: true }).click();
  await expect(page.locator(".feedback")).not.toContainText("＝29");
  await page.getByRole("button", { name: "−", exact: true }).click();
  await page.getByRole("button", { name: "继续动画" }).click();
  await page.waitForTimeout(650);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  const count = await page.locator("[data-active=true]").count();
  await page.waitForTimeout(600);
  await expect(page.locator("[data-active=true]")).toHaveCount(count);
  await page.getByRole("button", { name: "继续动画" }).click();
  await page.getByRole("spinbutton", { name: "我的答案" }).waitFor();
  await expect(page.locator("[data-active=true]")).toHaveCount(11);
  const rows = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("textbook-adventure.mixed.v1")!),
  );
  expect(rows[0].firstAnswer).toBe("+");
  expect(rows[0].firstCorrect).toBe(false);
  await page.getByRole("button", { name: "混合运算首页" }).click();
  await expect(page.getByRole("heading", { name: /让每一步/ })).toBeVisible();
});
test("edited impossible quantities blocked and original source retained", async ({
  page,
}) => {
  await page.goto("/?unit=mixed");
  await page.getByRole("button", { name: /桃子装盒/ }).click();
  await page.getByRole("spinbutton", { name: "条件2" }).fill("14");
  await expect(
    page.getByRole("button", { name: "开始：先想第一步" }),
  ).toBeDisabled();
  await expect(page.locator("main")).toContainText("25个和15个");
  await page.getByRole("spinbutton", { name: "条件2" }).fill("15");
  await expect(
    page.getByRole("button", { name: "开始：先想第一步" }),
  ).toBeEnabled();
});
test("arithmetic step feedback, first answer and hide restoration persist", async ({
  page,
}) => {
  await page.goto("/?unit=arithmetic");
  await page.getByRole("textbox", { name: "搜索练习" }).fill("15÷5×7");
  await page.getByRole("checkbox", { name: /显示这题/ }).click();
  await expect(page.locator(".cards .course")).toHaveCount(0);
  await page.reload();
  await page.getByRole("textbox", { name: "搜索练习" }).fill("15÷5×7");
  await expect(page.locator(".cards .course")).toHaveCount(0);
  await page.getByRole("button", { name: "查看全部（含隐藏）" }).click();
  await page.getByRole("checkbox", { name: /显示这题/ }).check();
  await page.getByRole("button", { name: /15÷5×7/ }).click();
  await page.getByRole("spinbutton", { name: "这一步结果" }).fill("35");
  await page.getByRole("button", { name: "检查这一步" }).click();
  await expect(page.locator(".feedback")).not.toContainText("＝3");
  await page.getByRole("spinbutton", { name: "这一步结果" }).fill("3");
  await page.getByRole("button", { name: "检查这一步" }).click();
  await page.getByRole("button", { name: "把结果带入下一步 →" }).click();
  await page.getByRole("spinbutton", { name: "这一步结果" }).fill("21");
  await page.getByRole("button", { name: "检查这一步" }).click();
  await expect(page.getByRole("button", { name: "选一道新题" })).toBeVisible();
  await page.getByRole("button", { name: "练习记录", exact: true }).click();
  await expect(page.locator("main")).toContainText("首次 35");
});
test("custom expressions reject executable input and single number", async ({
  page,
}) => {
  await page.goto("/?unit=arithmetic");
  for (const value of ["alert(1)", "5", "6÷0", "6÷4×2"]) {
    await page.getByRole("textbox", { name: "自编算式" }).fill(value);
    await page.getByRole("button", { name: "用新数字练习" }).click();
    await expect(page.getByRole("status")).toContainText("请输入");
  }
  await page.getByRole("textbox", { name: "自编算式" }).fill("(12+18)÷6");
  await page.getByRole("button", { name: "用新数字练习" }).click();
  await expect(
    page.getByRole("spinbutton", { name: "这一步结果" }),
  ).toBeVisible();
});

test("support automatically selects a smaller independent exercise", async ({
  page,
}) => {
  await page.goto("/?unit=mixed");
  await page.getByRole("button", { name: /公交站/ }).click();
  await page.getByRole("button", { name: "开始：先想第一步" }).click();
  await page.getByRole("button", { name: "+", exact: true }).click();
  for (const [op, answer] of [
    ["−", "11"],
    ["+", "29"],
  ]) {
    await page.getByRole("button", { name: op, exact: true }).click();
    await page.getByRole("button", { name: "继续动画" }).click();
    await page.getByRole("spinbutton", { name: "我的答案" }).waitFor();
    await page.getByRole("spinbutton", { name: "我的答案" }).fill(answer);
    await page.getByRole("button", { name: "检查我的想法" }).click();
  }
  await page.locator(".reason").first().click();
  await page.getByRole("button", { name: "独立练习", exact: true }).click();
  await expect(page.locator("main")).toContainText("原有10人");
  await expect(page.locator(".feedback")).toContainText("小一些");
  await page.getByRole("spinbutton", { name: "我的答案" }).fill("8");
  await page.getByRole("button", { name: "检查我的想法" }).click();
  await page.locator(".reason").first().click();
  await expect(page.getByRole("button", { name: "换情境再试" })).toBeVisible();
});
