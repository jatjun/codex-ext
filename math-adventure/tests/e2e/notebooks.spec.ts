import { test, expect, type Page } from "@playwright/test";
import {
  allAddresses,
  build,
  valuesFor,
  variant,
} from "../../src/notebooks/model";
import type { Book } from "../../src/notebooks/types";
import type { Lesson, Task } from "../../src/pdf/model";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class U {
      text: string;
      lang = "";
      rate = 1;
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(t: string) {
        this.text = t;
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
async function open(page: Page, book: Book, n: number) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "进入两份新错题本 →", exact: true })
    .click();
  await expect(page.locator(".notebook-card")).toHaveCount(50);
  await page
    .locator(".notebook-card")
    .nth((book === "a" ? 0 : 25) + n - 1)
    .click();
}
async function start(page: Page) {
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible();
}
async function solve(page: Page, t: Task) {
  if (t.pick) {
    for (const id of t.pick) {
      if (id.startsWith("option-"))
        await page
          .locator(".nb-scene button[aria-pressed]")
          .nth(Number(id.split("-")[1]))
          .click();
      else await page.locator(`[data-object="${id}"]`).click();
    }
  } else {
    const input = page.getByLabel("我的答案", { exact: true });
    if (t.options) await input.selectOption(t.answer);
    else await input.fill(t.answer);
  }
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
  await page.getByRole("button", { name: "下一步 →", exact: true }).click();
}
for (const address of allAddresses)
  test(`notebook ${address.book}${address.number}: original, independent transfer, records and mobile layout`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page, address.book, address.number);
    await start(page);
    const v = valuesFor(address.book, address.number),
      l = build(address.book, address.number, v),
      t = variant(address.book, address.number, v);
    for (const q of l.tasks) await solve(page, q);
    await expect(page.locator(".pdf-state")).toContainText("独立迁移");
    for (const q of t.tasks) await solve(page, q);
    await expect(
      page.getByRole("heading", { name: "✓ 这次发现，记住了吗？" }),
    ).toBeVisible();
    const rows = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("math-adventure.records.v1") || "[]"),
    );
    expect(rows).toHaveLength(l.tasks.length + t.tasks.length);
    expect(
      rows.every(
        (r: { levelId: string; completed: boolean; firstCorrect: boolean }) =>
          r.levelId === address.id && r.completed && r.firstCorrect,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("folding uses six actual 3D faces, manual angle changes normals, pause freezes motion and replay does not duplicate", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "b", 16);
  await page.getByRole("button", { name: "开始探索", exact: true }).click();
  await page.waitForTimeout(2200);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  await page.waitForTimeout(100);
  const poly = page.locator("[data-fold-face] polygon").first(),
    frozen = await poly.getAttribute("points");
  await page.waitForTimeout(650);
  expect(await poly.getAttribute("points")).toBe(frozen);
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator("[data-fold-face]")).toHaveCount(6);
  await page.getByRole("button", { name: "查看图B", exact: true }).click();
  const slider = page.getByLabel("折叠角度", { exact: true });
  await slider.fill("0");
  const flat = await poly.getAttribute("points");
  await slider.fill("45");
  expect(await poly.getAttribute("points")).not.toBe(flat);
  await slider.fill("90");
  const normals = await page
    .locator("[data-fold-face]")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-face-normal")));
  expect(new Set(normals).size).toBe(6);
  await page.getByRole("button", { name: "重播动画", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "提交答案", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator("[data-fold-face]")).toHaveCount(6);
});
test("first wrong is retained through graduated help, distinct retry and successful original answer", async ({
  page,
}) => {
  await open(page, "a", 3);
  await start(page);
  await page.getByLabel("我的答案", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-state")).toContainText("轻提示");
  await expect(page.locator(".pdf-hint")).not.toContainText("750");
  await expect(
    page.getByRole("button", { name: "下一步 →", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await page
    .getByRole("button", { name: "我不会，需要帮助", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "用一道相似题重新试试", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "用一道相似题重新试试", exact: true })
    .click();
  const v = valuesFor("a", 3),
    t = variant("a", 3, v),
    r = variant("a", 3, v, [t]);
  const input = page.getByLabel("我的答案", { exact: true });
  if (r.tasks[0].options) await input.selectOption(r.tasks[0].answer);
  else await input.fill(r.tasks[0].answer);
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-state")).toContainText("自己试一试");
  await input.fill("750");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
  const first = await page.evaluate(
    () => JSON.parse(localStorage.getItem("math-adventure.records.v1")!)[0],
  );
  expect(first.firstAnswer).toBe("1000");
  expect(first.firstCorrect).toBe(false);
  expect(first.correct).toBe(true);
  expect(first.hints).toBe(3);
  expect(first.watchedExplanation).toBe(true);
});
test("editable numbers update cups, bags, groups and geometric options; impossible settings leave the old model intact", async ({
  page,
}) => {
  await open(page, "a", 3);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("空瓶质量（克）", { exact: true }).fill("200");
  await page
    .getByRole("button", { name: "应用设置，重新开始", exact: true })
    .click();
  await start(page);
  await page.getByLabel("我的答案", { exact: true }).fill("800");
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
  await open(page, "b", 5);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("两人起点距离（米）", { exact: true }).fill("50");
  await page
    .getByRole("button", { name: "应用设置，重新开始", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("相遇前");
  await start(page);
  await expect(page.locator(".nb-scene")).toContainText("起点相距100米");
  await open(page, "b", 16);
  await page.locator(".pdf-config summary").click();
  await page.getByLabel("图形排列方案", { exact: true }).fill("1");
  await page
    .getByRole("button", { name: "应用设置，重新开始", exact: true })
    .click();
  await start(page);
  await page.locator(".nb-scene button[aria-pressed]").nth(2).click();
  await page.getByRole("button", { name: "提交答案", exact: true }).click();
  await expect(page.locator(".pdf-success")).toBeVisible();
});
test("actual rice bags, bead arrays, solid parts, projections and mirror folds match structured quantities", async ({
  page,
}) => {
  await open(page, "a", 9);
  await start(page);
  await expect(page.locator("[data-rice-bag]")).toHaveCount(20);
  await open(page, "a", 17);
  await start(page);
  await expect(page.locator('[data-batch-object="0"]')).toHaveCount(35);
  await expect(page.locator('[data-batch-object="1"]')).toHaveCount(20);
  await open(page, "b", 14);
  await start(page);
  await expect(page.locator('[data-solid-piece="长方体"]')).toHaveCount(5);
  await expect(page.locator('[data-solid-piece="球"]')).toHaveCount(4);
  await open(page, "b", 19);
  await start(page);
  await expect(page.locator("[data-projection-cell]")).toHaveCount(4);
  await open(page, "b", 21);
  await start(page);
  const fold = page.locator("[data-symmetry-fold]").first();
  await page.getByRole("button", { name: "沿虚线对折", exact: true }).click();
  await expect(fold).toHaveAttribute("transform", /scale\(-1 1\)/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("manual operation tree selection remains safe while switching comparison questions", async ({
  page,
}) => {
  await open(page, "b", 9);
  await start(page);
  await page.getByRole("button", { name: "观察比较3右", exact: true }).click();
  await solve(page, build("b", 9).tasks[0]);
  await page.getByRole("button", { name: "观察比较1左", exact: true }).click();
  await solve(page, build("b", 9).tasks[1]);
  await solve(page, build("b", 9).tasks[2]);
  await expect(page.locator(".pdf-state")).toContainText("独立迁移");
});

test("manual ruler preserves length, projection animates and motion reset does not run backwards", async ({
  page,
}) => {
  await open(page, "a", 1);
  await start(page);
  const stick = page.locator("[data-ruler-stick]"),
    width = await stick.getAttribute("width");
  await page
    .getByRole("button", { name: "重新对齐零刻度", exact: true })
    .click();
  await expect(stick).toHaveAttribute("x", "50");
  expect(await stick.getAttribute("width")).toBe(width);
  await open(page, "b", 19);
  await start(page);
  const face = page.locator('[data-voxel-face="0-0"]'),
    before = await face.getAttribute("points");
  await page
    .getByRole("button", { name: "改变视角观察投影", exact: true })
    .click();
  await expect.poll(() => face.getAttribute("points")).not.toBe(before);
  await open(page, "b", 25);
  await start(page);
  await page
    .getByRole("button", { name: "再看物体怎样运动", exact: true })
    .click();
  const rotor = page.locator('[data-motion-transform="rotor"]').first();
  await expect(rotor).toHaveAttribute("transform", "rotate(180)");
  await page.getByRole("button", { name: "恢复原摆法", exact: true }).click();
  await expect(rotor).toHaveAttribute("transform", "rotate(0)");
});
