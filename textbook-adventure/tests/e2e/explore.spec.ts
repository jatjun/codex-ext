import { test, expect } from "@playwright/test";
test("mixed ticket plan verifies all conditions and optimal price", async ({
  page,
}) => {
  await page.goto("/?unit=explore");
  await page.getByRole("button", { name: /购票方案实验/ }).click();
  await page.locator(".ticket-people button").nth(0).click();
  await expect(
    page.getByRole("button", { name: "这是我找到的最省方案" }),
  ).toBeDisabled();
  for (let i = 1; i < 6; i++)
    await page.locator(".ticket-people button").nth(i).click();
  await expect(page.locator("main")).toContainText("63 元");
  await page.getByRole("button", { name: "这是我找到的最省方案" }).click();
  await expect(page.locator(".feedback")).toContainText("验证通过");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("inequality explicitly includes zero and rejects equality", async ({
  page,
}) => {
  await page.goto("/?unit=explore");
  await page.getByRole("button", { name: /不等式填数/ }).click();
  await expect(page.locator("main")).toContainText("0～9");
  for (const n of ["0", "1", "2", "3"])
    await page.getByRole("button", { name: n, exact: true }).click();
  await page.getByRole("button", { name: "检查所有可能" }).click();
  await expect(page.locator(".feedback")).not.toContainText("验证通过");
  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "检查所有可能" }).click();
  await expect(page.locator(".feedback")).toContainText("验证通过");
});
test("comparison, correction, condition choice and subtraction relationships", async ({
  page,
}) => {
  await page.goto("/?unit=explore");
  await page.getByRole("button", { name: /两边算式比较/ }).click();
  await page.getByRole("spinbutton", { name: "左边结果" }).fill("20");
  await page.getByRole("spinbutton", { name: "右边结果" }).fill("19");
  await page.getByRole("button", { name: ">", exact: true }).click();
  await page.getByRole("button", { name: "检查比较" }).click();
  await expect(page.locator(".feedback")).toContainText("验证通过");
  await page.getByRole("button", { name: "探索目录" }).click();
  await page.getByRole("button", { name: /找错与纠正/ }).click();
  await page.getByRole("spinbutton", { name: "订正结果" }).fill("30");
  await page.getByRole("button", { name: "检查订正" }).click();
  await expect(page.locator(".feedback")).toContainText("验证通过");
  await page.getByRole("button", { name: "探索目录" }).click();
  await page.getByRole("button", { name: /选条件搭问题/ }).click();
  for (const i of [0, 1, 3, 4]) await page.locator(".reason").nth(i).click();
  await page.getByRole("button", { name: "检查条件链" }).click();
  await expect(page.locator(".feedback")).toContainText("验证通过");
  await page.getByRole("button", { name: "探索目录" }).click();
  await page.getByRole("button", { name: /减法数量关系/ }).click();
  await page
    .getByRole("spinbutton", { name: "被减数", exact: true })
    .fill("27");
  await page.getByRole("spinbutton", { name: "减数", exact: true }).fill("18");
  await page.getByRole("spinbutton", { name: "差", exact: true }).fill("9");
  await page.getByRole("button", { name: "检查三个条件" }).click();
  await expect(page.locator(".feedback")).toContainText("验证通过");
});
test("open story is self-check work, not automatically graded", async ({
  page,
}) => {
  await page.goto("/?unit=explore");
  await page.getByRole("button", { name: /用算式讲故事/ }).click();
  await page
    .getByRole("textbox", { name: "我的数学故事" })
    .fill("六组小朋友，每组5个男生和4个女生，一共多少人？");
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "保存我的自查作品" }).click();
  const rows = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("textbook-adventure.explore.v1")!),
  );
  expect(rows[0].firstCorrect).toBeNull();
  await page.getByRole("button", { name: "探索记录" }).click();
  await expect(page.locator("main")).toContainText("自查作品");
});
