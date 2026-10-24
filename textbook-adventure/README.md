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

## 长度与质量：小小测量家（第20～38页）

从共同首页“教材新课：长度与质量”进入，或打开教材目录的 `?unit=measurement`。代码集中在 `src/measurement/`，不改变原三科数据与教学页面。

九个可操作SVG课程：尺子侦探、单位变换、折绳、木板拼接、跑道与泳池、准时到校、路线规划、称水果、曹冲水线实验。开始前可调整条件；动画支持播放/暂停/继续、重播、速度与触摸滑块，关键问题必须作答才能前进。解释原因后进入独立题，再做迁移题。出现困难时先给逐级提示并降低补练数字；这属于受控规则，不是在线AI。

配套65个练习入口，可搜索、隐藏、恢复；包含换算、选单位、比较、画线、来回、铁环、盐袋估计和古今单位。开放调查与小讲堂作品自行记录，不伪造语义评分。不是每道练习都有独立动画。无法可靠读出的原图刻度和实际印刷长度列在[教材分析](docs/MEASUREMENT_CURRICULUM.md)，不会根据截图像素猜答案。

记录使用本浏览器 `textbook-adventure.measurement.records.v1`；开放作品使用 `textbook-adventure.measurement.reflection.v1`。记录包含首次答案、尝试历史、提示、重播、讲解、阶段、活动用时及是否辅助完成，可导出JSON。隐藏状态复用首页可见性模型，以 `textbook:measure:` 前缀隔离。刷新后从课程入口重新开始，旧答案保留；没有跨设备自动同步或在线儿童账号。

语音默认静音，点击开启后使用浏览器中文SpeechSynthesis。每步动画和朗读都完成后才开放问题；暂停同时暂停两者，切换页面取消旧语音。遇到浏览器不响应可点“改用文字”。减少动态效果模式用终点与滑块分段观察，保留相同数学关系。

新增题目：在 `practice.ts` 添加稳定ID、页码、明确条件和验证过的答案。新增动画题型：在 `model.ts` 定义课程和数据校验，在 `Scene.tsx` 实现数量可视化；动画进度由 `useMotion.ts` 控制，教学状态由 `teaching.ts` 控制。补充单元与浏览器测试后构建发布。

本地运行命令不变。获取本次分支：`git switch codex/textbook-measurement-v1`（需先fetch）。Windows安装Node.js后在本目录 `npm ci`、`npm run dev`。iPhone使用发布网址；本地测试则使用同一Wi-Fi下电脑IP，不能使用电脑的localhost。实际设备与浏览器系统语音仍需实机验收。

本批具体执行结果、文件清单与未完成项见[测量课程测试报告](docs/MEASUREMENT_TEST_REPORT.md)。
