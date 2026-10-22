import { test, expect, type Page } from "@playwright/test";
import { lessons } from "../../src/catalog";
const KEY = "english-adventure.records.v1";
async function enter(page: Page, book: number, n: number) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`BOOK 0${book}`) }).click();
  await page
    .locator(".lesson-card")
    .nth(n - 1)
    .click();
  await page.getByRole("button", { name: "开始探索 →" }).click();
  for (let i = 0; i < 3; i++)
    await page.locator(".task-panel .primary").click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "QUESTION",
  );
}
async function submit(page: Page, text: string) {
  await page.getByRole("button", { name: text, exact: true }).click();
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
}
async function audioMock(page: Page) {
  await page.addInitScript(() => {
    let timer: number = 0;
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        onend: (() => void) | null = null;
        onerror: null = null;
        lang = "";
        rate = 1;
        voice = null;
        constructor(public text: string) {}
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak: (u: { onend?: () => void }) => {
          timer = window.setTimeout(() => u.onend?.(), 120);
        },
        cancel: () => clearTimeout(timer),
        pause: () => clearTimeout(timer),
        resume: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}
test("30个入口和全部原题内容均可打开", async ({ page }) => {
  test.setTimeout(240000);
  for (const l of lessons) {
    await enter(page, l.book, l.number);
    await expect(
      page.getByRole("heading", { name: l.tasks[0].prompt, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("首次错误保留、帮助逐级增加、必须重试后回原题并迁移", async ({ page }) => {
  await enter(page, 1, 1);
  await submit(page, "k");
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_1",
  );
  await expect(page.locator(".reference")).toHaveCount(0);
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_2",
  );
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "EXPLAIN",
  );
  await page.getByRole("button", { name: "先练一道相似题 →" }).click();
  await submit(page, "puppy");
  await page.getByRole("button", { name: "继续挑战 →" }).click();
  await submit(page, "q");
  await page.getByRole("button", { name: "继续挑战 →" }).click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "TRANSFER",
  );
  await submit(page, "bear");
  await page.getByRole("button", { name: "完成探索 →" }).click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "COMPLETE",
  );
  const rows = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    KEY,
  );
  const r = rows.find((r: any) => r.phase === "main");
  expect(r.firstAnswer.text).toBe("k");
  expect(r.firstCorrect).toBe(false);
  expect(r.latestCorrect).toBe(true);
  expect(r.attempts).toBe(2);
});
test("字母计数必须点对小写b且数量匹配", async ({ page }) => {
  await enter(page, 1, 11);
  await page
    .getByRole("button", { name: /字母 b$/ })
    .all()
    .then(async (buttons) => {
      for (const b of buttons) await b.click();
    });
  await page.getByRole("textbox", { name: "我的数量" }).fill("4");
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  await expect(page.locator(".success")).toBeVisible();
});
test("听力无提前目标，完整听完才可独立提交", async ({ page }) => {
  await audioMock(page);
  await enter(page, 1, 15);
  await expect(page.locator(".scene svg").first()).not.toContainText("bee");
  await page.getByRole("button", { name: "bee", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "检查我的答案", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "♫ 听题／再听一次", exact: true })
    .click();
  await expect(page.getByText("已听完一遍 ✓")).toBeVisible();
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  const r = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!)[0],
    KEY,
  );
  expect(r.firstCorrect).toBe(true);
  expect(r.firstAssisted).toBe(false);
});
test("听力文字降级诚实标为辅助，Hi大小写不能混淆", async ({ page }) => {
  await enter(page, 2, 5);
  await page
    .getByRole("button", { name: "听不清／无法播放，改用文字学习" })
    .click();
  await expect(page.locator(".transcript")).toContainText("Hi! I'm Sarah.");
  await page.getByRole("textbox", { name: "我的答案" }).fill("hi");
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_1",
  );
  await page.getByRole("textbox", { name: "我的答案" }).fill("Hi");
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  const r = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!)[0],
    KEY,
  );
  expect(r.firstAssisted).toBe(true);
  expect(r.firstAnswer.text).toBe("hi");
  expect(r.transcript).toBe(true);
});
test("词卡火车能放回、重排并得到完整句子", async ({ page }) => {
  await enter(page, 1, 6);
  for (const t of ["Hello!", "I'm", "Li Dong."])
    await page
      .locator(".word-tray")
      .getByRole("button", { name: t, exact: true })
      .click();
  await page.getByRole("button", { name: "检查我的答案", exact: true }).click();
  await expect(page.locator(".success")).toBeVisible();
});
test("暂停冻结动画、禁止推进、重播不累加", async ({ page }) => {
  await page.goto("/");
  await page.locator(".lesson-card").first().click();
  await page.getByRole("button", { name: "开始探索 →" }).click();
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  const before = await page.locator("progress").getAttribute("value");
  await page.waitForTimeout(800);
  expect(await page.locator("progress").getAttribute("value")).toBe(before);
  await expect(
    page.getByRole("button", { name: "看下一步 →", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await page.getByRole("button", { name: "↺ 重播", exact: true }).click();
  expect(
    Number(await page.locator("progress").getAttribute("value")),
  ).toBeLessThan(0.5);
});
test("操场画布真实绘画、首次作品保留、自查不自动评分", async ({ page }) => {
  await enter(page, 2, 8);
  const canvas = page.getByRole("img", { name: "我的英语画布" });
  const b = await canvas.boundingBox();
  await page.mouse.move(b!.x + 30, b!.y + 30);
  await page.mouse.down();
  await page.mouse.move(b!.x + 80, b!.y + 60, { steps: 6 });
  await page.mouse.up();
  await expect(canvas.locator("polyline")).toHaveCount(1);
  await page.getByRole("textbox").fill("I am running.");
  await page.getByRole("button", { name: "作品好了，开始自查" }).click();
  for (const c of await page.locator(".self-review input").all())
    await c.check();
  await page.getByRole("button", { name: "完成自查", exact: true }).click();
  const r = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!)[0],
    KEY,
  );
  expect(r.firstCorrect).toBeNull();
  expect(r.selfChecked).toBe(true);
  expect(r.firstAnswer.strokes.length).toBe(1);
  expect(r.firstAnswer.text).toBe("I am running.");
});
test("课程表必须完成25格并可修改不同学科", async ({ page }) => {
  await enter(page, 2, 9);
  const cells = page
    .getByRole("group", { name: "我的五天课程表" })
    .getByRole("button");
  expect(await cells.count()).toBe(25);
  for (let i = 0; i < 24; i++) await cells.nth(i).click();
  await page.getByRole("textbox").fill("I like English.");
  await expect(
    page.getByRole("button", { name: "作品好了，开始自查" }),
  ).toBeDisabled();
  await cells.nth(24).click();
  await page.getByRole("button", { name: "Maths", exact: true }).click();
  await cells.first().click();
  await expect(cells.first()).toHaveText("Maths");
  await expect(
    page.getByRole("button", { name: "作品好了，开始自查" }),
  ).toBeEnabled();
});
test("书包物品数量对应This和These，暂停不能改动", async ({ page }) => {
  await enter(page, 2, 10);
  const add = page.getByRole("button", { name: "＋ pencil", exact: true });
  await add.click();
  await expect(page.locator(".bag-language")).toContainText(
    "This is my pencil.",
  );
  await add.click();
  await expect(page.locator(".bag-language")).toContainText(
    "These are my pencils.",
  );
  await expect(page.locator(".bag-item")).toHaveCount(2);
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  await expect(add).toBeDisabled();
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await page.locator(".bag-item").first().click();
  await expect(page.locator(".bag-language")).toContainText(
    "This is my pencil.",
  );
});
test("记录刷新保留、报告可导出且不混淆自查", async ({ page }) => {
  await enter(page, 1, 1);
  await submit(page, "q");
  await page.reload();
  await page.getByRole("button", { name: "家长手记", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "英语学习手记" }),
  ).toBeVisible();
  await expect(page.locator(".metrics")).toContainText("100%");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/\.json$/);
  await expect(page.getByRole("link", { name: "学科首页 ↗" })).toHaveAttribute(
    "href",
    "../",
  );
});
test("320像素和横屏没有水平溢出", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await enter(page, 2, 9);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("五段听力逐题切换，上一题听完不会替下一题解锁", async ({ page }) => {
  await enter(page, 2, 1);
  for (const t of lessons.find((l) => l.id === "en-2-1")!.tasks) {
    await expect(
      page.getByRole("heading", { name: t.prompt, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "听不清／无法播放，改用文字学习" })
      .click();
    const o = t.options!.find((o) => o.id === t.answer![0])!;
    await page
      .locator(".options")
      .getByRole("button", {
        name: new RegExp(o.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      .click();
    await page
      .getByRole("button", { name: "检查我的答案", exact: true })
      .click();
    await expect(page.locator(".success")).toBeVisible();
    await page.getByRole("button", { name: "继续挑战 →" }).click();
  }
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "TRANSFER",
  );
  const rows = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    KEY,
  );
  expect(
    rows.filter((r: any) => r.phase === "main" && r.completed),
  ).toHaveLength(5);
});

test("语音结束屏障、暂停、静音及离开取消队列", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      spoken: [] as string[],
      paused: 0,
      resumed: 0,
      cancelled: 0,
      current: null as any,
    };
    (window as any).__speech = data;
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: class {
        onend: any;
        onerror: any;
        lang = "";
        rate = 1;
        constructor(public text: string) {}
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak: (u: any) => {
          data.current = u;
          data.spoken.push(u.text);
        },
        cancel: () => {
          data.current = null;
          data.cancelled++;
        },
        pause: () => data.paused++,
        resume: () => data.resumed++,
      },
    });
  });
  await page.goto("/");
  await page.locator(".lesson-card").nth(3).click();
  await page.getByRole("button", { name: "开始探索 →" }).click();
  await page.getByRole("button", { name: "♫ 听示例英语", exact: true }).click();
  await page.waitForTimeout(900);
  await expect(
    page.getByRole("button", { name: "看下一步 →", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__speech.paused)).toBe(1);
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await page.evaluate(() => (window as any).__speech.current.onend());
  await expect(
    page.getByRole("button", { name: "看下一步 →", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "♫ 听示例英语", exact: true }).click();
  await page.getByRole("button", { name: "静音", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "♫ 听示例英语", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "开启语音", exact: true }).click();
  await page.getByRole("button", { name: "♫ 听示例英语", exact: true }).click();
  await page.getByRole("button", { name: "← 返回探险册", exact: true }).click();
  expect(
    await page.evaluate(() => (window as any).__speech.current),
  ).toBeNull();
});
