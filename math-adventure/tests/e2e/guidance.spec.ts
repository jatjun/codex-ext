import { test, expect } from "@playwright/test";
test("measurement task remains beside the answer and the active step follows progression", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class U {
      onend: (() => void) | null = null;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: U,
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: (u: U) => setTimeout(() => u.onend?.(), 5),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
      },
      configurable: true,
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "进入两份新错题本 →", exact: true })
    .click();
  await page.locator(".notebook-card").first().click();
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await expect(
    page.locator(".learning-steps [aria-current=step]"),
  ).toContainText("这句话对吗");
  await expect(page.locator(".pdf-answer .current-task h2")).toContainText(
    "量较短的物体或需要更精确时，可以用毫米作单位。这句话对吗",
  );
  await expect(
    page
      .locator(".pdf-answer")
      .getByRole("button", { name: "下一步 →", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("我的答案", { exact: true }).selectOption("正确");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await page
    .locator(".pdf-answer")
    .getByRole("button", { name: "下一步 →", exact: true })
    .click();
  await expect(
    page.locator(".learning-steps [aria-current=step]"),
  ).toContainText("这根小棒长多少毫米");
  await expect(page.locator(".pdf-answer .current-task h2")).toContainText(
    "这根小棒长多少毫米",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
