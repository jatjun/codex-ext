import { test, expect, Page } from "@playwright/test";
async function open(p: Page, b: number, n: number) {
  await p.goto("/");
  await p.getByRole("button", { name: new RegExp(`0${b}`) }).click();
  await p
    .locator(".lesson-card")
    .nth(n - 1)
    .click();
}
async function observe(p: Page) {
  await p.getByRole("button", { name: "开始探索 →", exact: true }).click();
  for (let i = 0; i < 2; i++)
    await p.getByRole("button", { name: "看下一步 →", exact: true }).click();
  await p.getByRole("button", { name: "我来试试 →", exact: true }).click();
}
async function pick(p: Page, text: string) {
  await p
    .locator(".options")
    .getByRole("button", { name: text, exact: true })
    .click();
  await p.getByRole("button", { name: "检查我的答案", exact: true }).click();
}
async function next(p: Page) {
  await p
    .locator(".success")
    .getByRole("button", { name: "下一步 →", exact: true })
    .click();
}
async function rows(p: Page) {
  return p.evaluate(() =>
    JSON.parse(localStorage.getItem("chinese-adventure.records.v1") || "[]"),
  );
}
test("125入口和学科链接，无水平溢出", async ({ page }) => {
  await page.goto("/");
  for (let b = 1; b <= 5; b++) {
    await page.getByRole("button", { name: new RegExp(`0${b}`) }).click();
    await expect(page.locator(".lesson-card")).toHaveCount(25);
  }
  await expect(page.getByRole("link", { name: "学科首页 ↗" })).toHaveAttribute(
    "href",
    "../",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("暂停冻结、重播不增加物体、观察不能跳过", async ({ page }) => {
  await open(page, 1, 1);
  await expect(
    page.getByRole("button", { name: "下一步 →", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  const before = await page.getByTestId("scene").getAttribute("data-progress");
  await page.waitForTimeout(300);
  expect(await page.getByTestId("scene").getAttribute("data-progress")).toBe(
    before,
  );
  await expect(
    page.getByRole("button", { name: "看下一步 →", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await page
    .getByRole("button", { name: "↺ 重播当前讲解", exact: true })
    .click();
  await expect(page.locator('[data-object="character"]')).toHaveCount(3);
  await page.getByRole("button", { name: "看下一步 →", exact: true }).click();
  await expect(page.locator('[data-object="character"]')).toHaveCount(3);
});
test("首次错误保留、三级提示、相似题和迁移", async ({ page }) => {
  await open(page, 1, 1);
  await observe(page);
  const wrong = "八达岭遂道长一千一百多米。";
  await pick(page, wrong);
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_1",
  );
  await expect(page.locator(".feedback")).not.toContainText("隧道");
  await expect(
    page.getByRole("button", { name: "下一步 →", exact: true }),
  ).toBeDisabled();
  await pick(page, wrong);
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_2",
  );
  await pick(page, wrong);
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "EXPLAIN",
  );
  await expect(page.locator(".explain")).toContainText("隧道");
  await page.getByRole("button", { name: "练一道相似题 →" }).click();
  await pick(page, "清水");
  await next(page);
  await pick(page, "这幅图描绘了北国草原壮丽富饶的风光。");
  await next(page);
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "TRANSFER",
  );
  await pick(page, "晴天");
  await page.getByRole("button", { name: "完成探索 →", exact: true }).click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "COMPLETE",
  );
  const r = (await rows(page)).find((r: any) => r.phase === "main");
  expect(r.firstAnswer).toBe(wrong);
  expect(r.firstCorrect).toBe(false);
  expect(r.latestCorrect).toBe(true);
  expect(r.attempts).toBe(4);
  expect(r.explanation).toBe(true);
});
test("开放题自查不计自动正确", async ({ page }) => {
  await open(page, 1, 9);
  await observe(page);
  await page.getByRole("textbox").fill("我想在这儿看一会儿书。");
  await page.getByRole("button", { name: "写好了，开始自查" }).click();
  await expect(
    page.getByRole("button", { name: "完成自查，保留我的表达" }),
  ).toBeDisabled();
  for (const c of await page.locator(".self-review input").all())
    await c.check();
  await page.getByRole("button", { name: "完成自查，保留我的表达" }).click();
  await expect(page.locator(".success")).toContainText("表达已保存");
  const r = (await rows(page))[0];
  expect(r.firstCorrect).toBeNull();
  expect(r.selfChecked).toBe(true);
  await next(page);
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "TRANSFER",
  );
});
test("排序卡片真实组句，逆序不通过", async ({ page }) => {
  await open(page, 5, 24);
  await observe(page);
  const parts = [
    "秋天到了，农场丰收了。",
    "两只小猫来到农场。",
    "它们在草堆和玉米筐间捉迷藏。",
    "玩累了，它们在阳光下睡着了。",
  ];
  for (const v of [...parts].reverse())
    await page
      .locator(".word-tray")
      .getByRole("button", { name: v, exact: true })
      .click();
  await page.getByRole("button", { name: "检查我的答案" }).click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_1",
  );
  await page.getByRole("button", { name: "清空答案，重新尝试" }).click();
  for (const v of parts)
    await page
      .locator(".word-tray")
      .getByRole("button", { name: v, exact: true })
      .click();
  await page.getByRole("button", { name: "检查我的答案" }).click();
  await expect(page.locator(".success")).toBeVisible();
});
test("点击分类卡片移动，不遗漏", async ({ page }) => {
  await open(page, 1, 17);
  await observe(page);
  const bins = [1, 0, 1, 1, 0, 1, 0, 1];
  for (let i = 0; i < 8; i++) {
    await page.locator(`[data-card-index="${i}"]`).click();
    await page.locator(".bin>button").nth(bins[i]).click();
  }
  await expect(page.locator(".sort-area>.word-tray button")).toHaveCount(0);
  await expect(page.locator(".bin-cards button")).toHaveCount(8);
  await page.getByRole("button", { name: "检查我的答案" }).click();
  await expect(page.locator(".success")).toBeVisible();
});
test("暂停时禁止答题操作", async ({ page }) => {
  await open(page, 1, 17);
  await observe(page);
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  await expect(page.locator('[data-card-index="0"]')).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "我不会，需要帮助" }),
  ).toBeDisabled();
});
test("拼音声调保持区别", async ({ page }) => {
  await open(page, 5, 17);
  await observe(page);
  await page.getByRole("textbox").fill("yé xǔ");
  await page.getByRole("button", { name: "检查我的答案" }).click();
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "HINT_1",
  );
  await page.getByRole("textbox").fill("yě xǔ");
  await page.getByRole("button", { name: "检查我的答案" }).click();
  await expect(page.locator(".success")).toBeVisible();
});
test("查字典部首和余画正确", async ({ page }) => {
  await open(page, 5, 12);
  await observe(page);
  for (const a of ["心", "9"]) {
    await page.getByRole("textbox").fill(a);
    await page.getByRole("button", { name: "检查我的答案" }).click();
    await next(page);
  }
  await pick(page, "怀念惦记");
  await expect(page.locator(".success")).toBeVisible();
});
test("迁移求助后仍回迁移题", async ({ page }) => {
  await open(page, 1, 24);
  await observe(page);
  for (const a of ["开", "后", "西"]) {
    await page.getByRole("textbox").fill(a);
    await page.getByRole("button", { name: "检查我的答案" }).click();
    await next(page);
  }
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "我不会，需要帮助" }).click();
  await page.getByRole("button", { name: "练一道相似题 →" }).click();
  await pick(page, "低");
  await next(page);
  await expect(page.locator(".session")).toHaveAttribute(
    "data-stage",
    "TRANSFER",
  );
  await expect(page.locator(".task-panel h2")).toContainText("快");
  await pick(page, "慢");
  expect(
    (await rows(page)).filter((r: any) => r.phase === "main"),
  ).toHaveLength(3);
});
test("语音失败回退文字", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      configurable: true,
    });
  });
  await open(page, 1, 1);
  await page.getByRole("button", { name: "🔈 开启语音" }).click();
  await expect(page.locator(".narration")).toContainText("语音");
});
test("家长记录、刷新和JSON导出", async ({ page }) => {
  await open(page, 1, 1);
  await observe(page);
  await pick(page, "八达岭遂道长一千一百多米。");
  await page.getByRole("button", { name: "家长手记", exact: true }).click();
  await expect(page.locator(".metrics")).toContainText("0%");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON" }).click();
  expect((await dl).suggestedFilename()).toMatch(/\.json$/);
  await page.reload();
  await page.getByRole("button", { name: "家长手记", exact: true }).click();
  await expect(page.locator(".record-list")).toContainText("八达岭遂道");
});
for (const b of [1, 2, 3, 4, 5])
  test(`第${b}本25入口无脚本错误`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    for (let n = 1; n <= 25; n++) {
      await page.getByRole("button", { name: new RegExp(`0${b}`) }).click();
      await page
        .locator(".lesson-card")
        .nth(n - 1)
        .click();
      await expect(page.locator(".task-panel")).toContainText("先看懂");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "← 错题本", exact: true }).click();
    }
    expect(errors).toEqual([]);
  });

test("语音和动画完成屏障、暂停与静音取消", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__voice = { last: null, canceled: 0, paused: 0 };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        speak: (u: any) => {
          (window as any).__voice.last = u;
        },
        cancel: () => {
          (window as any).__voice.canceled++;
        },
        pause: () => {
          (window as any).__voice.paused++;
        },
        resume: () => {},
      },
    });
  });
  await open(page, 1, 1);
  await page.getByRole("button", { name: "🔈 开启语音" }).click();
  await page.getByRole("button", { name: "开始探索 →", exact: true }).click();
  await expect
    .poll(async () =>
      Number(await page.getByTestId("scene").getAttribute("data-progress")),
    )
    .toBe(1);
  await expect(
    page.getByRole("button", { name: "看下一步 →", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Ⅱ 暂停", exact: true }).click();
  expect(
    await page.evaluate(() => (window as any).__voice.paused),
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "▶ 继续", exact: true }).click();
  await page.evaluate(() => (window as any).__voice.last.onend());
  await expect(
    page.getByRole("button", { name: "看下一步 →", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "🔊 静音" }).click();
  expect(
    await page.evaluate(() => (window as any).__voice.canceled),
  ).toBeGreaterThan(0);
});

test("开放初稿在自查前保存，参考后修改不能覆盖", async ({ page }) => {
  await open(page, 3, 2);
  await observe(page);
  await page.getByRole("textbox").fill("那么海水到底是咸还是淡呢？");
  await page.getByRole("button", { name: "写好了，开始自查" }).click();
  expect((await rows(page))[0].firstAnswer).toBe("那么海水到底是咸还是淡呢？");
  await page.locator(".self-review summary").click();
  await page.getByRole("textbox").fill("那么明天到底是晴天还是雨天呢？");
  for (const c of await page.locator(".self-review input").all())
    await c.check();
  await page.getByRole("button", { name: "完成自查，保留我的表达" }).click();
  const r = (await rows(page))[0];
  expect(r.firstAnswer).toBe("那么海水到底是咸还是淡呢？");
  expect(r.answerHistory).toHaveLength(2);
  expect(r.firstCorrect).toBeNull();
});

test('分类搬移动画暂停后继续剩余部分', async ({page})=>{
 await open(page,1,17);await observe(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('[data-card-index="0"]').click();await page.locator('.bin>button').nth(1).click();
 await page.evaluate(()=>{const a=document.querySelector('[data-card-index="0"]')!.getAnimations()[0];if(!a)throw Error('missing moving card');a.playbackRate=.05;(window as any).__movingCard=a});
 await page.getByRole('button',{name:'Ⅱ 暂停',exact:true}).click();expect(await page.evaluate(()=>(window as any).__movingCard.playState)).toBe('paused');const before=await page.evaluate(()=>(window as any).__movingCard.currentTime);await page.waitForTimeout(160);expect(await page.evaluate(()=>(window as any).__movingCard.currentTime)).toBe(before);await page.getByRole('button',{name:'▶ 继续',exact:true}).click();expect(await page.evaluate(()=>(window as any).__movingCard.playState)).toBe('running');await expect(page.locator('.bin-cards button')).toHaveCount(1);
});
