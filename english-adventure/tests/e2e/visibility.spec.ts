import { test, expect } from "@playwright/test";
test("勾选显示范围、批量隐藏后可恢复、刷新保留", async ({ page }) => {
  await page.goto("/");
  const count = await page.locator(".lesson-card").count(),
    label = await page
      .locator(".visibility-check input")
      .first()
      .getAttribute("type");
  expect(label).toBe("checkbox");
  const first = await page.locator(".lesson-card strong").first().textContent();
  await page.locator(".visibility-check input").first().click();
  await expect(page.locator(".lesson-card")).toHaveCount(count - 1);
  await page.reload();
  await expect(page.locator(".lesson-card")).toHaveCount(count - 1);
  await page
    .getByRole("button", { name: "查看全部（含隐藏）", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "显示这题：" + first + "（已隐藏）",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "只看勾选的题目", exact: true })
    .click();
  await expect(page.locator(".lesson-card")).toHaveCount(count);
  await page
    .getByRole("button", { name: new RegExp("当前筛选全部隐藏") })
    .click();
  await expect(page.locator(".lesson-card")).toHaveCount(count);
  expect(await page.locator(".visibility-check input:checked").count()).toBe(0);
  await page
    .getByRole("button", { name: new RegExp("当前筛选全部显示") })
    .click();
  await page
    .getByRole("button", { name: "只看勾选的题目", exact: true })
    .click();
  await expect(page.locator(".lesson-card")).toHaveCount(count);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
