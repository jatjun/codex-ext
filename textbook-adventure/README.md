# 教材动画 · 空间探索与混合运算

面向三年级，依据用户本次“观察物体”目录与正文第1～5页截图，先做两个可操作原创3D课程：多方向观察六面纸盒、纸盒展开与折回。不是完整教材，也不公开教材截图。

## 本地运行（Windows同样适用）

安装Node.js 22 LTS和Git，下载仓库的功能分支，在PowerShell或终端中：

```sh
git clone --branch codex/textbook-mixed-operations-v1 https://github.com/jatjun/codex-ext.git
cd codex-ext/textbook-adventure
npm ci
npm run dev
```

浏览器打开终端给出的localhost地址。`npm run build`包含TypeScript检查；`npm run preview`查看生产构建。无需专用Windows客户端。首次安装需要网络；教学不调用外部图片或AI服务。

## iPhone

发布后从共同首页选择“教材 · 空间探索站”。本地同Wi-Fi测试可用电脑局域网IP加Vite端口，需电脑防火墙允许本次Node服务。不要在手机输入电脑的localhost。大按钮、点击和触摸滑块可完成全部主要教学。默认静音，点击开启才尝试中文语音；语音缺失时看文字。

## 操作

选择课程 → 开始探索 → 关键步骤自动暂停 → 点击数字或输入 → 检查想法。答错逐级提示；正确后独立练习，再换数字迁移。可暂停/继续、重播、前后步骤、调速、重听。方向按钮模拟换观察位置，纸盒滑块控制展开程度。独立题若操作模型寻求验证，会记录为辅助完成。

## 学习记录

本浏览器localStorage的`textbook-adventure.records.v1`，独立于原三科。记录时间、知识点/题型、首次答案、首次正确性、尝试历史、提示/重播、最终结果、辅助/独立、讲解与用时。记录页JSON导出。无账号、无后台、无跨设备同步；隐私浏览和清理浏览器可能删除记录。存储失败显示提示，当前会话仍可导出。原始首次答案不会被后来答对覆盖。

## 文件结构

`src/math-engine`数学规则，`src/lessons`课程，`src/animation`3D面板，`src/teacher`教学逻辑与预留适配器，`src/progress`本地记录，`tests`规则及浏览器测试，`docs`教材分析/设计/规格/架构/测试/后续。

## 测试

```sh
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e -- --workers=2
```

Linux可能需要浏览器依赖，CI使用仓库现有锁定Playwright镜像，避免擅自装系统软件。具体实际执行结果见[测试报告](docs/TEST_REPORT.md)。

## Pages

共同首页源文件`../learning-home/index.html`；现有`../.github/workflows/math-adventure.yml`增加教材构建，部署至`/codex-ext/textbook-adventure/`。保留`base: './'`。沿用Settings → Pages → GitHub Actions和已有`MATH_ADVENTURE_PAGES_ENABLED=true`，不需要重复设置。只有工作流部署成功且网址验证后才称上线。无需合并main，沿用原发布分支。

## 扩展与限制

新增课程必须先核对截图，在math-engine定义可测试空间/数学约束，在lessons定义观察、问题、提示和独立迁移，再接渲染。不能让AI改条件或答案。当前只做两个六面模型，不含全部教材题、全部展开图、任意剪切、语音识别或在线AI。开放解释让孩子口述，不自动评分。

[教材分析](docs/CURRICULUM_ANALYSIS.md) · [教学设计](docs/TEACHING_DESIGN.md) · [动画规格](docs/ANIMATION_SPEC.md) · [架构](docs/ARCHITECTURE.md) · [后续计划](docs/NEXT_STEPS.md)


## 混合运算（教材第6～19页）

共同首页进入教材部分后，选择“第二单元 · 混合运算”。直接入口：`?unit=mixed`（六工坊）、`?unit=arithmetic`（分步练习）、`?unit=explore`（方法探索）。原有空间课程入口不变。

- 六工坊：公交上下车、酸奶分组、桃子装盒、窗花两种算法、花朵数量关系、串珠比较。SVG物体移动、分组和数量变化由数学模型计算。
- 先选择运算，操作并计算中间量，再计算最终量、选择理由。答错先给小提示，再提供图示和演示；需要帮助时自动选较小数字练习，之后做新情境迁移。
- 开始前可修改条件；非法数量、不整除或超过画面容量会被拦截。支持暂停、重播、调速、实物/数量条视图。
- 分步练习支持搜索、分页、自定义算式、隐藏及恢复已会题目。方法探索提供七种活动；编故事只保存自查，不声称自动理解孩子的语言。
- 浏览器语音可选；核心功能不依赖语音或在线AI。

新增本地存储键：`textbook-adventure.mixed.v1`、`textbook-adventure.expression.v1`、`textbook-adventure.explore.v1`。各模块提供记录和JSON导出，保留首次作答与后续尝试。隐藏题目沿用共同首页可见性模型，以 `textbook:` 隔离题目ID。记录不会上传服务器，也不会自动同步到其他设备。

### 添加新题

在 `src/mixed/problems.ts` 添加应用题，在 `arithmetic.ts` 添加计算题，使用稳定ID和已核对的页码、条件、提示。新动画题型还需要在 `model.ts` 添加可靠计算/校验，在 `Scene.tsx` 实现数量可视化，并补充规则及浏览器测试。不要通过页面元素数量反推答案。

### 当前限制

自适应采用明确规则，未连接大模型；探索活动条件暂时固定。并非题库中每题都有专属实物动画。使用手机浏览器仿真验证，不能替代真实iPhone和Windows设备验收。暂停会停止自动进度，已开始的短CSS过渡可能继续完成。题目记录目前按模块查看，没有跨设备账号或统一云端错题本。

[混合运算教材分析](docs/MIXED_OPERATIONS_ANALYSIS.md) · [混合运算测试与交付](docs/MIXED_OPERATIONS_TEST_REPORT.md)
