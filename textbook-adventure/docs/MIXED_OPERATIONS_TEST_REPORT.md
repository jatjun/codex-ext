# 混合运算 V1 验证与交付

日期：2026-10-24。范围：教材第6～19页及原有观察物体课程回归。

## 实际执行结果

- `npm test`：20/20通过（空间11、混合运算9）。
- `npm run build`：TypeScript检查及Vite生产构建通过。
- `npm run test:e2e -- --workers=2`：72/72通过，耗时4.1分钟。桌面Chromium、iPhone尺寸Chromium与WebKit各24项。
- `node --test scripts/mistakes.test.mjs scripts/visibility.test.mjs`：两个测试文件通过。
- `git diff --check`：通过。
- 手工浏览器复核：390px酸奶课程无横向溢出；三组六盒展示18个有效物体；练习库显示102个入口。

浏览器覆盖：六课从运算选择到独立练习、迁移的完整流程；错误后首次记录保留；暂停数量稳定；非法条件拦截；题目隐藏恢复；不安全算式拦截；困难后降低数字；购票最优方案；不等式边界；纠错、比较、条件选择、减法关系；开放故事不伪造自动评分；原有空间课程全部回归。

首次浏览器运行因沙箱无法启动本地服务器而未执行；启用本地网络权限后完整重跑通过。测试使用已安装的真实Chromium和WebKit，跳过主机依赖预检，没有跳过测试。不代表已在真实Windows电脑或iPhone硬件验收。

## 内容和文件

六种实物动画，窗花/串珠第二方法；102个分步练习入口；七种方法探索；独立练习和规则式补练；本地记录与JSON导出。新增内容位于 `src/mixed/`，原三科教学源文件不变。

修改：`learning-home/index.html`、`textbook-adventure/src/main.tsx`、`textbook-adventure/README.md`。

新增（均在 textbook-adventure）：
- `src/mixed/Alternative.tsx`, `Arithmetic.tsx`, `Explore.tsx`, `Mixed.tsx`, `Scene.tsx`
- `src/mixed/arithmetic.ts`, `model.ts`, `problems.ts`, `teacher.ts`, `mixed.css`
- `tests/mixed.test.ts`, `tests/e2e/mixed.spec.ts`, `tests/e2e/explore.spec.ts`
- `docs/MIXED_OPERATIONS_ANALYSIS.md`, `docs/MIXED_OPERATIONS_TEST_REPORT.md`

## 限制与发布

不是102套独立实物动画；七种探索的条件暂固定；自由语言仅自查；不含真实AI接口、语音识别或云端账户。短CSS过渡可能在暂停后完成，但自动进度和数量停止。学习记录按模块保存，不与其他设备同步。

提交分支 `codex/textbook-mixed-operations-v1`，发布沿用 `codex/math-adventure-v1`，不合并main。旧版本备份 `backup/before-mixed-operations-2026-10-24` 指向42d4cee。本文记录本地验证；GitHub Actions与在线部署必须另行核验，不能从本地通过推断已上线。
