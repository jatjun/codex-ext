# 小小测量家：验证与交付记录

日期：2026-10-24。教材范围：本次10张截图中的第20～38页。

## 实现

- 9个SVG互动课程、65个配套练习入口，课程条件可编辑并校验。
- 动画播放、暂停/继续、重播、调速、滑块、分段操作、放大与内部滑动。
- 观察后作答、逐级提示、较小数字补练、独立题及迁移题；理由选择作为完成条件。
- 画线题同时检查线段与数值；同船水线模型；精确折绳几何。
- 学习记录保留首次答案和辅助历史；题目隐藏/恢复；本模块错题筛选和JSON导出。
- 浏览器中文朗读可选，每步画面与语音完成屏障；不支持或无响应时改用文字。

## 已执行

- `npm test`：31项通过，包括原空间/混合运算、测量模型、记录不覆盖及折绳几何。
- `npm run build`：TypeScript与Vite生产构建通过。
- 全教材浏览器回归：126项通过（桌面Chromium、触屏Chromium、iPhone尺寸WebKit），4.8分钟。
- 最后仅测量模块增加放大、记录历史保护与动态提示修正；最终模块复测56项通过、1项放大测试时序失败；修正等待布局的断言后，放大测试在三种浏览器中3/3通过。没有把失败运行写成全通过。
- `node --test scripts/mistakes.test.mjs scripts/visibility.test.mjs`：2个测试文件通过。
- 生产构建共用首页导航：320px Chromium、390px WebKit、844×390横屏均能进入课程，无页面横向溢出、无页面脚本错误。两次折叠后的SVG实际跨度为原始440单位的四分之一110。

首轮隐藏测试因取消勾选后元素立刻移出页面而超时，改为检查卡片消失、刷新后隐藏及恢复；不是通过忽略失败得到通过。视觉复核发现旧折叠层级显示跨度不正确，已替换为逐折点几何，并对1～3次折叠的每个采样帧验证绳段长度守恒和最终跨度。

浏览器使用实际安装的Chromium和WebKit，设置浏览器缓存路径并跳过主机依赖预检；没有跳过测试。真实Windows/实体iPhone及每个系统的中文声音未实机验证。

## 文件清单

修改：
- `learning-home/index.html`：共用首页增加测量入口。
- `textbook-adventure/src/main.tsx`：教材入口与查询参数路由。
- `textbook-adventure/README.md`：运行、记录、扩展和限制。

新增（均在 textbook-adventure）：
- `src/measurement/model.ts`：课程、条件、答案和校验。
- `src/measurement/geometry.ts`：长度守恒折叠模型。
- `src/measurement/teaching.ts`：教学状态、记录与导出。
- `src/measurement/useMotion.ts`：可暂停的逐帧控制。
- `src/measurement/Scene.tsx`：原创SVG物体和数量变化。
- `src/measurement/Measurement.tsx`：九课教学交互和报告。
- `src/measurement/practice.ts`、`Practice.tsx`：练习、画线和调查。
- `src/measurement/measurement.css`：响应式样式。
- `tests/measurement.test.ts`、`tests/measurement-geometry.test.ts`、`tests/e2e/measurement.spec.ts`。
- `docs/MEASUREMENT_CURRICULUM.md`、`docs/MEASUREMENT_TEST_REPORT.md`。

不提交教材图片、原始附件、儿童信息、缓存、依赖目录、构建产物或测试截图。没有增加npm依赖，没有修改无关工作流。

## 限制与后续

并非每道练习都配专属动画。原图无法可靠读取的刻度、印刷尺寸标记NEEDS_CONFIRMATION并排除自动判题；采用明确标注的原创示例。部分调查、器材选择、杆秤仍为小讲堂说明，未做独立器材动画。

当前是规则式教学，不含大模型、语音识别、自由语义自动评分或精确流体仿真。开放记录不计入正确率。本模块记录与已有三科错题本分开，未新增跨设备账号或云端同步。浏览器存储异常时支持导出当前记录，关闭页面前需自行保存。

发布分支沿用 `codex/math-adventure-v1`，开发分支 `codex/textbook-measurement-v1`；未经确认不合并main。旧版备份 `backup/before-measurement-2026-10-24` 指向9ac6be3。线上发布状态须以本次Actions运行和实际网页核验为准，不能从本地通过推断已上线。
