import { test, expect, type Page } from "@playwright/test";
import { catalog, defaults, build } from "../../src/workbooks/model";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class U {
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
async function open(page: Page, b: number, n: number) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "进入八份错题本动画 →", exact: true })
    .click();
  await expect(page.locator(".workbook-card")).toHaveCount(177);
  const i = catalog.findIndex((d) => d.book === b && d.n === n);
  await page.locator(".workbook-card").nth(i).click();
}
async function start(page: Page) {
  await page.getByRole("button", { name: "静音", exact: true }).click();
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout: 15000 });
}
async function submit(page: Page) {
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
}
async function answer(page: Page, b: number, n: number) {
  const d = catalog.find((d) => d.book === b && d.n === n)!;
  const t = build(d, defaults(d)).tasks[0];
  if (t.pick) {
    if (t.pick[0].startsWith("wb-sort:")) {
      for (const wanted of t.pick) {
        const [, i, bin] = wanted.split(":");
        await page.locator(".wb-card-buttons button").nth(Number(i)).click();
        await page
          .getByRole("button", { name: /^放入：/ })
          .nth(Number(bin))
          .click();
      }
    } else {
      const mins = Number(t.pick[0].split("-").at(-1));
      await page
        .getByLabel("拨动小时", { exact: true })
        .selectOption(String(Math.floor(mins / 60) || 12));
      await page
        .getByLabel("拨动分钟", { exact: true })
        .fill(String(mins % 60));
      await page
        .getByRole("button", { name: "确认这个时刻", exact: true })
        .click();
    }
  } else if (t.options)
    await page.getByLabel("我的答案", { exact: true }).selectOption(t.answer);
  else await page.getByLabel("我的答案", { exact: true }).fill(t.answer);
  await submit(page);
}
for (const [b, n, kind] of [
  [2, 3, "clock"],
  [2, 6, "clock"],
  [2, 1, "divide"],
  [7, 5, "objects"],
  [1, 16, "line"],
  [4, 3, "direction"],
  [1, 23, "sort"],
  [1, 7, "segments"],
  [1, 1, "ribbon"],
  [2, 18, "measure"],
  [6, 2, "pattern"],
  [4, 15, "seat"],
  [7, 8, "border"],
  [3, 21, "transfer"],
  [7, 12, "stack"],
  [8, 2, "cards"],
] as const)
  test(`${b}-${n} real ${kind} scene, child answer and phone layout`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page, b, n);
    await start(page);
    await expect(page.locator(`[data-workbook-kind="${kind}"]`)).toBeVisible();
    await answer(page, b, n);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("editable quotient, remainder and object count update together; first wrong survives correction", async ({
  page,
}) => {
  await open(page, 2, 1);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("物体总数", { exact: true }).fill("19");
  await page
    .getByRole("button", { name: "应用条件，重新开始", exact: true })
    .click();
  await start(page);
  await expect(page.locator("[data-division-item]")).toHaveCount(19);
  await expect(page.locator('[data-place="remainder"]')).toHaveCount(3);
  await page.getByLabel("我的答案", { exact: true }).fill("19");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-hint")).toBeVisible();
  await expect(page.locator(".pdf-hint")).not.toContainText("商是4");
  await page.getByLabel("我的答案", { exact: true }).fill("4");
  await submit(page);
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("math-adventure.records.v1") ?? "[]"),
  );
  const first = records.find(
    (r: { levelId: string }) => r.levelId === "morning-2-1",
  );
  expect(first.firstAnswer).toBe("19");
  expect(first.firstCorrect).toBe(false);
});
test("clock drawing moves hour hand fractionally and allows changing a confirmed time", async ({
  page,
}) => {
  await open(page, 2, 6);
  await start(page);
  await page.getByLabel("拨动小时", { exact: true }).selectOption("3");
  await page.getByLabel("拨动分钟", { exact: true }).fill("30");
  await expect(page.locator('[data-clock-hand="hour"]')).toHaveAttribute(
    "transform",
    "rotate(105)",
  );
  await page.getByRole("button", { name: "确认这个时刻", exact: true }).click();
  await page.getByLabel("拨动分钟", { exact: true }).fill("5");
  await page.getByRole("button", { name: "确认这个时刻", exact: true }).click();
  await submit(page);
});
test("manual animation freezes on pause; replay preserves exact object identities", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, 3, 21);
  await start(page);
  await page
    .getByRole("button", { name: "再演示一次物体变化", exact: true })
    .click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  await page.waitForTimeout(100);
  const before = await page
    .locator("[data-transfer-carrot]")
    .evaluateAll((els) =>
      els.map((e) => [e.getAttribute("x"), e.getAttribute("y")]),
    );
  await page.waitForTimeout(400);
  expect(
    await page
      .locator("[data-transfer-carrot]")
      .evaluateAll((els) =>
        els.map((e) => [e.getAttribute("x"), e.getAttribute("y")]),
      ),
  ).toEqual(before);
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await expect(page.locator("[data-transfer-carrot]")).toHaveCount(24);
  await page.getByRole("button", { name: "重播动画", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator("[data-transfer-carrot]")).toHaveCount(24);
});
test("invalid related conditions are rejected; the previous fifty lessons have a linked-condition example", async ({
  page,
}) => {
  await open(page, 3, 12);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("余数", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "应用条件，重新开始", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "回到冒险地图", exact: true }).click();
  await page
    .getByRole("button", { name: "进入两份新错题本 →", exact: true })
    .click();
  await page.locator(".notebook-card").nth(30).click();
  await page.locator(".pdf-config summary").click();
  await page
    .getByRole("button", { name: "填入示例：30枝、18枝、6束", exact: true })
    .click();
  await expect(page.getByLabel("花束数量", { exact: true })).toHaveValue("6");
  await page
    .getByRole("button", { name: "应用设置，重新开始", exact: true })
    .click();
  await start(page);
  await expect(
    page.getByRole("heading", { name: /平均扎成6束/ }),
  ).toBeVisible();
  await expect(page.locator('[data-batch-object="0"]')).toHaveCount(30);
  await expect(page.locator('[data-batch-object="1"]')).toHaveCount(18);
});
test("missing question instructions are explicit and do not fabricate grading", async ({
  page,
}) => {
  await open(page, 7, 14);
  await expect(
    page.getByRole("heading", { name: "这道题先留待核对" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "开始探索", exact: true }),
  ).toHaveCount(0);
});
test("four-operator problem has a touch keypad and accepts a valid full solution", async ({
  page,
}) => {
  await open(page, 7, 23);
  await start(page);
  for (const s of ["÷", "+", "×", "-"])
    await page.getByRole("button", { name: "输入 " + s, exact: true }).click();
  await expect(page.getByLabel("我的答案", { exact: true })).toHaveValue(
    "÷+×-",
  );
  await submit(page);
});
test("new division lesson requires an independent changed-number transfer before completion", async ({
  page,
}) => {
  await open(page, 2, 1);
  await start(page);
  const d = catalog.find((d) => d.book === 2 && d.n === 1)!,
    v = defaults(d),
    main = build(d, v);
  for (const t of main.tasks) {
    await page.getByLabel("我的答案", { exact: true }).fill(t.answer);
    await submit(page);
    await page.getByRole("button", { name: "下一步 →", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: /最后还剩/ })).toBeVisible();
  await expect(page.locator("[data-division-item]")).toHaveCount(15);
  await page.getByLabel("我的答案", { exact: true }).fill("3");
  await submit(page);
  await page.getByRole("button", { name: "下一步 →", exact: true }).click();
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("math-adventure.records.v1") ?? "[]"),
  );
  expect(
    records.filter(
      (r: { levelId: string; transfer: boolean; completed: boolean }) =>
        r.levelId === "morning-2-1" && r.transfer && r.completed,
    ).length,
  ).toBeGreaterThan(0);
});
test("classification trees retain both criteria and exactly twenty-one distinct cards", async ({
  page,
}) => {
  await open(page, 7, 16);
  await start(page);
  const d = catalog.find((d) => d.book === 7 && d.n === 16)!,
    l = build(d, defaults(d));
  for (const t of l.tasks) {
    for (const item of t.pick!) {
      const [, i, b] = item.split(":");
      await page.locator(".wb-card-buttons button").nth(Number(i)).click();
      await page
        .getByRole("button", { name: /^放入：/ })
        .nth(Number(b))
        .click();
    }
    await expect(page.locator("[data-class-card]")).toHaveCount(21);
    await submit(page);
    await page.getByRole("button", { name: "下一步 →", exact: true }).click();
  }
  await expect(page.locator("[data-class-card]")).toHaveCount(42);
});
