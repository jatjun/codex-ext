# 实际测试报告

日期：2026-10-23（香港时间）。以下为实际执行结果，不是兼容性推测。

| 检查 | 实际结果 |
| --- | --- |
| 新项目 TypeScript / Vite 生产构建 | PASS |
| 新项目 Vitest 数学/教学规则 | 11 / 11 PASS |
| 新项目 Playwright | 24 / 24 PASS；8个案例 × 桌面Chromium、iPhone尺寸Chromium触屏、iPhone尺寸WebKit |
| 实际CSS过渡暂停/恢复 | PASS；非减少动态效果配置，暂停矩阵不变，继续后发生变化 |
| 折叠几何 | PASS；读取真实DOMMatrix，前后、左右、上下面法向分别相反；全过程六面 |
| 关键题门控、两级提示、完整解释/新题重试 | PASS |
| 首次答案保留、独立练习/迁移、刷新持久化 | PASS |
| 快速重播、换课、静音/不支持语音、存储失败 | PASS |
| 生产构建经共同首页子路径访问 | Chromium / WebKit PASS；首页4入口，新教材资源无HTTP错误/页面错误 |
| 320px竖屏与844×390横屏 | Chromium / WebKit无水平溢出；另人工查看桌面、320px截图 |
| 原数学规则 / 类型 / 构建 | 312 PASS / PASS / PASS |
| 原语文规则 / 类型 / 构建 | 135 PASS / PASS / PASS |
| 原英语规则 / 类型 / 构建 | 18 PASS / PASS / PASS |
| 原共享目录一致性与错题/隐藏脚本检查 | PASS；目录260/125/30条，不改变三科数据 |
| git diff --check | PASS |

## 复现

```sh
cd textbook-adventure
npm ci
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e -- --workers=2
```

本地使用仓库已有锁定依赖和浏览器缓存；WebKit宿主校验跳过，但实际启动WebKit并执行全部断言，没有用Chromium冒充。CI沿用官方Playwright 1.64.1镜像。没有安装系统软件或修改全局Git配置。

## 限制与过程说明

- 一轮开发中的测试曾受源码热更新影响（页面重置），不能算通过；停止修改源码后重新完整执行，最终24项全部通过。
- 未在真实Windows机器或真实iPhone硬件运行；上述是Linux桌面/触屏/WebKit自动化。真实设备语音质量、不同中文声音是否可用，需要人工检查。
- 未声称语音毫秒级同步；使用步骤完成屏障、暂停/取消与文字回退。
- 原有三科的完整浏览器回归由发布工作流执行，不能把此前版本的528项结果冒充本次已跑结果；本报告本地只列本次真正执行的检查。
- Pages线上发布状态由最终交付说明与GitHub Actions实际结果确认，不在本地测试前写为成功。
