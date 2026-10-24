import { test, expect, type Page } from "@playwright/test";
const cases: [string, (string | number)[], number, number][] = [
  ["尺子侦探", [10, 60, 50], 35, 28],
  ["单位变换车间", [10, 30, 3], 6, 4],
  ["折绳实验室", [40, 20, 10], 20, 50],
  ["木板拼接站", [160, 15, 145], 100, 70],
  ["跑道与游泳池", [50, 100, 1000], 200, 2000],
  ["准时到校挑战", [45, 4500, "能到达"], 0, 1],
  ["路线规划师", [2000, 2000, 1820], 1400, 1500],
  ["水果称重铺", [200, 150, 50], 150, 200],
  ["曹冲的水线实验", ["下沉", 5, 1000], 1200, 800],
];
async function open(page: Page, title: string) {
  await page.goto("/?unit=measurement");
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
}
async function submit(page: Page, value: string | number) {
  if (typeof value === "string") {
    await page.getByRole("button", { name: value, exact: true }).click();
  } else {
    await page
      .getByRole("spinbutton", { name: "我的答案", exact: true })
      .fill(String(value));
    await page.getByRole("button", { name: "检查想法", exact: true }).click();
  }
}
for (const [title, answers, practice, transfer] of cases)
  test(`${title}: guided, independent and transfer`, async ({ page }) => {
    await open(page, title);
    for (let i = 0; i < 3; i++) {
      await expect(
        page.getByRole("button", { name: "下一步", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "播放 / 继续", exact: true })
        .click();
      await submit(page, answers[i]);
      if (i < 2)
        await page.getByRole("button", { name: "下一步", exact: true }).click();
    }
    await expect(
      page.getByRole("button", { name: "进入独立练习" }),
    ).toBeDisabled();
    await page.locator(".reason-box button").first().click();
    await page.getByRole("button", { name: "进入独立练习" }).click();
    await expect(page.locator(".measure-scene")).toHaveCount(0);
    await submit(page, practice);
    await page.locator(".reason-box button").first().click();
    await page.getByRole("button", { name: "换情境再试" }).click();
    await submit(page, transfer);
    await page.locator(".reason-box button").first().click();
    await page.getByRole("button", { name: "完成课程", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /小小测量家/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const rows = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem("textbook-adventure.measurement.records.v1") ||
          "[]",
      ),
    );
    expect(
      rows.filter((r: any) => r.phase === "transfer" && r.complete),
    ).toHaveLength(2);
  });
test("actual motion freezes, replay resets, rapid operations do not duplicate and navigation cleans up", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "木板拼接站");
  await page.getByRole("button", { name: "播放 / 继续", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  const p = await page.locator(".measure-scene").getAttribute("data-progress");
  await page.waitForTimeout(450);
  expect(
    await page.locator(".measure-scene").getAttribute("data-progress"),
  ).toBe(p);
  await page.getByRole("button", { name: "重播", exact: true }).click();
  await expect(page.locator(".measure-scene")).toHaveAttribute(
    "data-progress",
    "0.00000",
  );
  for (let i = 0; i < 8; i++)
    await page.getByRole("button", { name: "亲手推进一段" }).click();
  await expect(page.locator(".measure-scene")).toHaveAttribute(
    "data-progress",
    "1.00000",
  );
  await page.getByRole("button", { name: "测量课程首页", exact: true }).click();
  await page.waitForTimeout(100);
  await expect(page.locator(".measure-scene")).toHaveCount(0);
});
test("first mistake is retained, hints escalate and help selects smaller independent values", async ({
  page,
}) => {
  await open(page, "尺子侦探");
  await page.getByRole("button", { name: "播放 / 继续" }).click();
  await submit(page, 99);
  await expect(page.locator(".feedback")).not.toContainText("＝");
  await submit(page, 99);
  await submit(page, 99);
  await expect(page.locator(".feedback")).toContainText("10毫米");
  await page.getByRole("button", { name: "我来重新尝试" }).click();
  await submit(page, 10);
  for (const answer of [60, 50]) {
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await page.getByRole("button", { name: "播放 / 继续" }).click();
    await submit(page, answer);
  }
  await page.locator(".reason-box button").first().click();
  await page.getByRole("button", { name: "进入独立练习" }).click();
  await expect(
    page.getByRole("heading", { name: /左端对着10毫米，右端对着30毫米/ }),
  ).toBeVisible();
  const rows = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("textbook-adventure.measurement.records.v1")!,
    ),
  );
  expect(rows[0].firstAnswer).toBe("99");
  expect(rows[0].firstCorrect).toBe(false);
  expect(rows[0].explained).toBe(true);
  expect(rows[0].attempts).toHaveLength(4);
});
test("invalid editable conditions blocked, hide settings survive refresh and source remains explicit", async ({
  page,
}) => {
  await page.goto("/?unit=measurement");
  await page.getByRole("checkbox", { name: "显示课程：折绳实验室" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: /折绳实验室/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "查看全部（含隐藏）", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "显示课程：折绳实验室" }).check();
  await page.getByRole("button", { name: /折绳实验室/ }).click();
  await page.getByRole("spinbutton", { name: "绳子总长（厘米）" }).fill("23");
  await expect(
    page.getByRole("button", { name: "开始探索", exact: true }),
  ).toBeDisabled();
  await page.getByRole("spinbutton", { name: "绳子总长（厘米）" }).fill("80");
  await expect(
    page.getByRole("button", { name: "开始探索", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".source")).toContainText("4分米");
});
test("practice, editable line, old/new units and first answers persist", async ({
  page,
}) => {
  await page.goto("/?unit=measurement");
  await page.getByRole("button", { name: "配套练习", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索测量练习" }).fill("旧制半斤");
  await page.locator(".lesson-card").click();
  await page.getByRole("spinbutton", { name: "练习答案" }).fill("5");
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("旧制");
  await page.getByRole("spinbutton", { name: "练习答案" }).fill("8");
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  await page.getByRole("button", { name: "返回练习列表" }).click();
  await page.getByRole("textbox", { name: "搜索测量练习" }).fill("5厘米8毫米");
  await page.locator(".lesson-card").click();
  await page.getByRole("slider", { name: "画线长度" }).fill("58");
  await expect(page.getByRole("img", { name: "已画58毫米" })).toBeVisible();
  await page.getByRole("spinbutton", { name: "练习答案" }).fill("58");
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  const rows = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("textbook-adventure.measurement.records.v1")!,
    ),
  );
  expect(rows[0].firstAnswer).toBe("5");
  expect(rows[0].firstCorrect).toBe(false);
});
test("speech and animation completion barrier plus cancellation ignores old callbacks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let utterance: any;
    let paused = 0;
    let resumed = 0;
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: (u: any) => {
          utterance = u;
        },
        cancel: () => {},
        pause: () => paused++,
        resume: () => resumed++,
      },
      configurable: true,
    });
    (window as any).voice = {
      finish: () => utterance?.onend?.(),
      paused: () => paused,
      resumed: () => resumed,
    };
  });
  await open(page, "尺子侦探");
  await page.getByRole("button", { name: "开启语音", exact: true }).click();
  await page.getByRole("button", { name: "播放 / 继续", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "我的答案", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  expect(await page.evaluate(() => (window as any).voice.paused())).toBe(1);
  await page.getByRole("button", { name: "播放 / 继续", exact: true }).click();
  expect(await page.evaluate(() => (window as any).voice.resumed())).toBe(1);
  await page.evaluate(() => (window as any).voice.finish());
  await expect(
    page.getByRole("spinbutton", { name: "我的答案", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "测量课程首页", exact: true }).click();
  await page.evaluate(() => (window as any).voice.finish());
  await expect(page.getByRole("heading", { name: /小小测量家/ })).toBeVisible();
});

test("folded geometry has the correct visible span, not just the correct answer", async ({
  page,
}) => {
  await open(page, "折绳实验室");
  for (const value of [40, 20]) {
    await page.getByRole("button", { name: "播放 / 继续" }).click();
    await submit(page, value);
    await page.getByRole("button", { name: "下一步", exact: true }).click();
  }
  await page.getByRole("button", { name: "播放 / 继续" }).click();
  const width = await page
    .getByTestId("folded-rope")
    .evaluate((e) => (e as SVGGraphicsElement).getBBox().width);
  expect(width).toBeCloseTo(110, 5);
});
test("boat reaches exactly the marked waterline and transfer assistance uses grams", async ({
  page,
}) => {
  await open(page, "曹冲的水线实验");
  await page.getByRole("button", { name: "播放 / 继续" }).click();
  await submit(page, "下沉");
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByRole("slider", { name: "动作进度" }).fill("50");
  expect(
    Number(await page.getByTestId("boat-hull").getAttribute("data-mark")),
  ).toBeLessThan(225);
  await page.getByRole("slider", { name: "动作进度" }).fill("100");
  await expect(page.getByTestId("boat-hull")).toHaveAttribute(
    "data-mark",
    "225",
  );
  await submit(page, 5);
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByRole("button", { name: "播放 / 继续" }).click();
  await submit(page, 1000);
  await page.locator(".reason-box button").first().click();
  await page.getByRole("button", { name: "进入独立练习" }).click();
  await page.getByRole("button", { name: "我还不会，换个方法" }).click();
  await page.getByRole("button", { name: "我还不会，换个方法" }).click();
  await expect(page.locator(".measure-scene")).toContainText("200克");
  await expect(page.locator(".measure-scene")).not.toContainText("千克");
});
test("line drawing must match the numeric answer and original error is retained", async ({
  page,
}) => {
  await page.goto("/?unit=measurement");
  await page.getByRole("button", { name: "配套练习", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索测量练习" }).fill("5厘米8毫米");
  await page.locator(".lesson-card").click();
  await page.getByRole("spinbutton", { name: "练习答案" }).fill("58");
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("线段端点");
  await expect(page.getByRole("button", { name: "下一道练习" })).toHaveCount(0);
  await page.getByRole("slider", { name: "画线长度" }).fill("58");
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  await expect(page.getByRole("button", { name: "下一道练习" })).toBeVisible();
  await page.getByRole("button", { name: "查看学习记录", exact: true }).click();
  await page.getByRole("button", { name: "只看首次答错的题" }).click();
  await expect(page.locator(".record")).toContainText("画线10毫米");
});
test("blocked local storage offers export without losing the in-memory answer", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "QuotaExceededError");
    };
  });
  await open(page, "尺子侦探");
  await page.getByRole("button", { name: "播放 / 继续" }).click();
  await submit(page, 10);
  await expect(page.getByRole("alert")).toContainText("无法保存");
  await page.getByRole("button", { name: "学习记录", exact: true }).click();
  await expect(page.locator(".record")).toContainText("首次：10");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出JSON", exact: true }).click();
  expect((await event).suggestedFilename()).toBe("测量与称重学习记录.json");
});

test("enlarged ruler scrolls inside its panel without overflowing the phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await open(page, "尺子侦探");
  await page.getByRole("button", { name: "放大刻度图" }).click();
  const sizes = await page
    .locator(".measure-pan")
    .evaluate((e) => ({ width: e.clientWidth, scroll: e.scrollWidth }));
  await expect.poll(()=>page.locator(".measure-pan").evaluate(e=>e.scrollWidth/e.clientWidth)).toBeGreaterThan(1.5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "恢复图示大小" }).click();
  await expect
    .poll(() =>
      page
        .locator(".measure-pan")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
    )
    .toBe(true);
});
