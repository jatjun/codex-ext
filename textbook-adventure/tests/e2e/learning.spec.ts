import { test, expect, type Page } from "@playwright/test";
async function start(p: Page, kind = "换个位置看一看") {
  await p.goto("/");
  await p.getByRole("button", { name: new RegExp(kind) }).click();
  await p.getByRole("button", { name: "开始探索", exact: true }).click();
  await expect(p.getByRole("heading", { name: "第 3 步 / 5" })).toBeVisible({
    timeout: 18000,
  });
}
async function answer(p: Page, n: string) {
  await p.getByRole("spinbutton", { name: "我的答案" }).fill(n);
  await p.getByRole("button", { name: "检查我的想法" }).click();
}
test("guided gate, hints, retry, transfer and immutable first answer", async ({
  page,
}) => {
  await start(page);
  await expect(
    page.getByRole("button", { name: "下一步", exact: true }),
  ).toBeDisabled();
  await answer(page, "5");
  await expect(page.locator(".feedback")).toContainText("先找观察者");
  await answer(page, "4");
  await expect(page.locator(".feedback")).toContainText("点击方向按钮");
  await answer(page, "1");
  await page.getByRole("button", { name: "做一道独立练习" }).click();
  await answer(page, "6");
  await page.getByRole("button", { name: "换数字再试一次" }).click();
  await answer(page, "6");
  await page.getByRole("button", { name: "完成本课", exact: true }).click();
  await expect(page.getByRole("heading", { name: "今天的发现" })).toBeVisible();
  await page.getByRole("button", { name: "学习记录", exact: true }).click();
  await expect(page.locator(".record")).toHaveCount(3);
  await expect(page.locator(".record").first()).toContainText("首次答案 5");
  const r = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("textbook-adventure.records.v1")!),
  );
  expect(r[0].firstCorrect).toBe(false);
  expect(r[0].attempts).toBe(3);
  expect(r[0].hints).toBe(2);
  expect(r[0].independent).toBe(false);
  expect(r[1].independent).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "学习记录", exact: true }).click();
  await expect(page.locator(".record")).toHaveCount(3);
});
test("six faces persist through net unfolding, transfer and touch slider", async ({
  page,
}) => {
  await start(page, "纸盒的六面旅行");
  await expect(page.locator(".panel")).toHaveCount(6);
  const slider = page.getByRole("slider", { name: "展开程度" });
  await slider.fill("35");
  await expect(slider).toHaveValue("35");
  await expect(page.locator(".panel")).toHaveCount(6);
  await slider.fill("100");
  await answer(page, "3");
  await expect(page.locator(".feedback")).toContainText("相对");
  await answer(page, "6");
  await page.getByRole("button", { name: "做一道独立练习" }).click();
  await answer(page, "2");
  await page.getByRole("button", { name: "换数字再试一次" }).click();
  await answer(page, "6");
  await page.getByRole("button", { name: "完成本课", exact: true }).click();
  await expect(page.getByRole("heading", { name: "今天的发现" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("pause stops advancement, replay resets without duplicating faces", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /换个位置看一看/ }).click();
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  await page.waitForTimeout(2600);
  await expect(
    page.getByRole("heading", { name: "第 1 步 / 5" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await expect(page.getByRole("heading", { name: "第 3 步 / 5" })).toBeVisible({
    timeout: 18000,
  });
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "重播动画", exact: true }).click();
  await expect(page.locator(".panel")).toHaveCount(6);
  await page.getByRole("button", { name: "课程首页", exact: true }).click();
  await expect(page.getByRole("heading", { name: /换个角度/ })).toBeVisible();
});
test("three mistakes give full explanation then a separate new attempt", async ({
  page,
}) => {
  await start(page, "纸盒的六面旅行");
  for (let i = 0; i < 3; i++) await answer(page, "2");
  await expect(page.locator(".feedback")).toContainText("验证：后面是6");
  await page.getByRole("button", { name: "换一道相似题重新尝试" }).click();
  await answer(page, "6");
  const r = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("textbook-adventure.records.v1")!),
  );
  expect(r).toHaveLength(2);
  expect(r[0].firstAnswer).toBe("2");
  expect(r[0].finalCorrect).toBe(false);
  expect(r[1].phase).toBe("transfer");
});
test("storage unavailable and malformed records do not crash learning", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("textbook-adventure.records.v1", "invalid"),
  );
  await start(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await answer(page, "1");
  await expect(page.getByRole("alert")).toContainText("未能保存");
  await page.getByRole("button", { name: "学习记录", exact: true }).click();
  await expect(page.locator(".record")).toHaveCount(1);
});
test("real CSS transition freezes on pause and resumes, directions match the camera", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: /换个位置看一看/ }).click();
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await page.getByRole("button", { name: "到后面看", exact: true }).click();
  await page.waitForTimeout(180);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  const before = await page
    .locator(".solid")
    .evaluate((e) => getComputedStyle(e).transform);
  await page.waitForTimeout(450);
  expect(
    await page.locator(".solid").evaluate((e) => getComputedStyle(e).transform),
  ).toBe(before);
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await page.waitForTimeout(1300);
  const after = await page
    .locator(".solid")
    .evaluate((e) => getComputedStyle(e).transform);
  expect(after).not.toBe(before);
  await page.getByRole("button", { name: "从上面看", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "观察机器人在上面" }),
  ).toBeVisible();
});
test("silent and unavailable speech still allow completion; replay lecture cannot auto advance", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /换个位置看一看/ }).click();
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await page.getByRole("button", { name: "重听当前讲解", exact: true }).click();
  await page.waitForTimeout(2600);
  await expect(
    page.getByRole("heading", { name: "第 1 步 / 5" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await expect(page.getByRole("heading", { name: "第 3 步 / 5" })).toBeVisible({
    timeout: 18000,
  });
  await answer(page, "1");
  await expect(
    page.getByRole("button", { name: "做一道独立练习" }),
  ).toBeVisible();
});

test("folded CSS normals agree with mathematical opposite-face pairs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /纸盒的六面旅行/ }).click();
  const normals = await page.locator(".panel").evaluateAll((elements) =>
    Object.fromEntries(
      elements.map((el) => {
        let m = new DOMMatrix();
        let current: Element | null = el;
        while (current && !current.classList.contains("solid")) {
          const t = getComputedStyle(current).transform;
          if (t !== "none") m = new DOMMatrix(t).multiply(m);
          current = current.parentElement;
        }
        const n = m.transformPoint({ x: 0, y: 0, z: 1, w: 0 });
        return [el.getAttribute("data-face"), [n.x, n.y, n.z]];
      }),
    ),
  );
  for (const [a, b] of [
    ["前", "后"],
    ["左", "右"],
    ["上", "下"],
  ]) {
    expect(
      normals[a].reduce(
        (sum: number, v: number, i: number) => sum + v * normals[b][i],
        0,
      ),
    ).toBeCloseTo(-1, 4);
  }
  await expect(page.locator(".panel")).toHaveCount(6);
});
