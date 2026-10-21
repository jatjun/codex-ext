# Math Adventure｜数学错题动画实验室 V1.1

面向8～10岁孩子的中文数学动画原型：**看得见 → 动手操作 → 说出道理 → 独立再做**。本项目独立保存在 `math-adventure/`，不调用 KidsLearningHub、KidsSharedCore、AgentOrchestrator、其他 Worker 或任何大模型 API。

## 四个实验室

V1.1新增独立的**排队动画实验室**，包含八类题型；原四关均加入数字调整。主页点击“进入排队动画实验室”，或者进入原四关后展开顶部“调整本题数字”。点击“应用数字，重新开始”后，题目、数量、动画、提示和答案一起更新。设置刷新后恢复默认，历史记录保留。

排队题包含：两头求总人数、求反向名次、不同方向的两人间隔、已知间隔求人数、四方向实心长方形队列，以及同方向间隔、加入/离开、交换位置三个补充题型。详细数学规则与操作见 [QUEUE_DESIGN.md](docs/QUEUE_DESIGN.md)。

| 关卡       | 动态模型                                                                  | 操作与迁移                                                                                |
| ---------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 玩具商店   | 4只玩具逐只入篮，每只3枚金币；收银台数量3、6、9、12；12枚金币移动到分配区 | 点金币、点分配按钮，每次分1枚；必须分完且两份各6枚。先判断总价意义，再求单价。迁移：3×4÷2 |
| 图形密码   | 18点平均移到3颗星；16点平均移到4个三角形                                  | 分别验证图形的值；合并6和4，逐点数到10；观察6组4个；迁移圆与方块                          |
| 分类小侦探 | 明确数组生成8只蝴蝶、6只蜻蜓、6条鱼，轻微运动                             | 拖放或先点物体再点分类框；按种类、按生活环境分类；12个固定图案再按颜色与形状分类          |
| 操场排队   | 25个小朋友分5行依次入场；四方向1、2、3标记；逐行高亮                      | 实心5×5方阵；点击高亮一行；迁移3×3方阵，避免把边框当总人数                                |

每关都有故事、观察、作答、逐级提示、相似题重试、独立迁移和小结。下一步必须先答对；不会时可以主动请求帮助。首次错误只给轻提示，第二次显示图形线索，第三次完整演示并要求完成相似练习，再回到原题。

## 技术架构

- React 19、TypeScript、Vite；运行时仅React与React DOM。
- SVG、CSS和 `requestAnimationFrame` 时钟；物体数量来自数学模型，不使用随机数量。
- 独立教学状态机与纯动画时钟，浏览器原生中文语音合成。
- 同一小段的动画与语音都结束后才进入下一段；**不声称毫秒级同步**。异常语音事件使用有限等待，并先取消语音再继续文字教学。
- 暂停会暂停动画、语音、CSS动态和学习计时；页面隐藏自动暂停；切换关卡取消上一关语音与时钟。
- 支持系统“减少动态效果”：去掉装饰运动，缩短物体移动，但保留教学步骤与数量。
- 无远程字体、图片、CDN运行依赖，无网络分析或学习数据上传。

## 文件结构

```text
math-adventure/
  src/
    App.tsx                 # 地图与题型路由
    animation/              # 时钟、观察脚本、语音完成屏障
    audio/                  # 原生中文语音封装
    components/             # 数字配置、共用教学会话、家长报告
    questions/              # 默认题目、参数、生成器、排队数学与校验
    records/store.ts        # 首次答案保留、本地存储与统计
    scenes/                 # 原四关及八类排队场景
    teaching/machine.ts     # 教学状态机
    styles/main.css
  tests/                    # 数学、状态机、时钟与浏览器测试
  docs/
    TEACHING_DESIGN.md
    QUEUE_DESIGN.md
    VALIDATION.md
  public/
  index.html
  package.json
  package-lock.json
  playwright.config.ts
  tsconfig.json
  vite.config.ts
.github/workflows/math-adventure.yml
```

## 本地运行

需要Node.js 22.12+（也可使用24 LTS）和npm：

```bash
cd math-adventure
npm ci
npm run dev
```

打开终端提供的地址，通常是 `http://localhost:5173/`。第一次点击“开始探索”后才启动语音。没有中文语音或不支持语音时，阅读小向导文字即可。

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

生产文件输出到 `dist/`，不要通过双击HTML或 `file://` 打开生产包；使用预览服务器或Pages。

### Windows

安装Node.js LTS；在PowerShell或Windows Terminal中进入项目目录，执行上面的命令。使用Chrome或Edge打开本地地址。若PowerShell阻止npm脚本，可以使用 `npm.cmd ci` 和 `npm.cmd run dev`。

### iPhone

部署后在Safari打开Pages地址。也可让Windows与iPhone连接同一可信Wi-Fi，在iPhone访问Vite显示的电脑局域网地址与端口（必要时在Windows防火墙允许该开发端口）。`localhost`在iPhone上指手机本身，不是电脑。

先点击“开始探索”以满足浏览器音频交互要求。所有分类提供“点物体→点分类框”替代拖动；横屏和竖屏都可以。页面进入后台自动暂停，回来后点击“继续”。

## 浏览器测试

```bash
npx playwright install chromium webkit
npm run test:e2e
```

Linux机器可能还需要管理员安装浏览器系统库：`npx playwright install-deps chromium webkit`。项目自身不自动修改操作系统。本开发环境的WebKit缺少系统库，不能把它报告为通过；实际执行记录见 [VALIDATION.md](docs/VALIDATION.md)。Playwright使用确定性语音事件验证完成屏障；并不验证操作系统实际发声。

## GitHub Pages

现有仓库是私有仓库。私有仓库的Pages通常需要GitHub Pro、Team或Enterprise等支持的套餐；具体可用性以该仓库的 **Settings → Pages** 为准。普通Pages站点可能公开可访问：不要把孩子资料写入代码或部署包。仓库可见性不会被本项目改变。

当前连接无法读取Pages管理端点，开发时**未能确认当前Pages配置、套餐资格或成功发布**。保留根目录现有文件，仅新增独立工作流，发布开关默认关闭：

1. 打开 `https://github.com/jatjun/codex-ext/settings/pages`。如果已有站点，先确认可以用本项目替换该站点；一个仓库的项目Pages只有一个站点位置。
2. 若页面提示套餐限制，先由仓库所有者处理套餐；不必把私有仓库改成公开。
3. 在 **Build and deployment → Source** 选择 **GitHub Actions**。
4. 在 **Settings → Secrets and variables → Actions → Variables → New repository variable** 添加 `MATH_ADVENTURE_PAGES_ENABLED`，值为 `true`。这是普通发布开关，不是密码。
5. 在 **Settings → Environments → github-pages → Deployment branches and tags** 确认允许 `codex/math-adventure-v1`；如果未来经你确认合并到main，也允许main。不要为部署擅自合并。
6. 打开 **Actions → Math Adventure · checks and Pages**，选择本功能分支的push运行并重新运行全部jobs。若工作流已经存在于默认分支，也可使用 **Run workflow** 并选择功能分支。工作流仅在全部检查通过且发布开关开启时部署。
7. 查看 `deploy` job和 `github-pages` environment给出的真实URL；打开页面并走一遍教学流程后，才确认发布成功。

工作流从 `math-adventure/` 安装、测试和构建，只上传 `math-adventure/dist`，发布到Pages站点根目录。Vite的 `base: './'` 使用相对资源路径，支持 `/codex-ext/` 子路径与本地预览；不需要手工把源码目录追加到Pages URL。

通常候选地址是 `https://jatjun.github.io/codex-ext/`，但这只是候选地址，**不是已验证的访问地址**。实际以部署输出为准。发布开关关闭时仍运行检查并上传构建artifact。

## 学习记录与隐私

- 存储位置：当前站点来源下的 `localStorage['math-adventure.records.v1']`。
- 保存日期、会话、关卡/题目ID、首次答案/正确性、尝试/提示次数、完整讲解是否看完、迁移首次结果、最终正确性、完成状态、实际交互用时、错误类型和逐次事件。
- V1.1同时保存题干与数字参数快照，改数字会创建新会话，不覆盖旧数字对应的首次答案；家长报告包含排队专题。
- 首次答案只写一次；先请求帮助也会保留“需要帮助”状态，之后答对不会算成独立首次正确。相似练习独立记录为retry事件，不覆盖原题答案。
- 每5秒及题目操作后保存，离开关卡或页面隐藏/退出时补保存。突然终止浏览器可能丢失最近几秒用时。
- 用时仅计入页面可见、未暂停、最近60秒有操作的时间；不是墙上时钟时间，也不是能力测量。
- 刷新会回到地图，新开始的关卡创建新会话，历史原始记录保留，不尝试从中途动画恢复。
- 家长手记显示分母与统计口径，支持JSON和CSV导出。清除浏览器数据、换设备或不同站点来源不会自动同步；建议定期导出JSON。
- localStorage禁用或空间不足时显示提醒，教学可以继续。数据不加密，请使用可信设备。
- 不收集真实姓名、照片；不联网辅导、不上传记录，不对单次成绩做医学、心理或发展诊断。

## 添加新的错题

1. 在 `src/questions/data.ts` 相应关卡的 `questions` 或 `transfer` 数组添加唯一 `id`、题干、标准答案、三层提示、相似练习及讲解。不要在迁移题题干或首次错误提示中写出答案。
2. 如果数学模型变化，在同文件添加明确对象数组/模型，在 `src/scenes/Scenes.tsx` 编写对应物体场景；必要时扩展关卡ID。
3. 在 `src/animation/storyboards.ts` 添加逐步讲解，每段语音对应当前画面。新场景必须接入暂停、重播和数量守恒规则。
4. 在教学状态机中保留作答门槛；在records中沿用首次结果保留规则。
5. 增加数学模型与交互测试，运行类型检查、单元测试、构建及浏览器测试；更新教学设计。只增加题目配置不能自动生成新的动画场景。

## 已知限制与后续方向

- 原生语音质量、中文音色、暂停/恢复行为依赖系统，iPhone仍需真机复核；无语音识别与大模型API。
- 本地仅验证Chromium；WebKit在本环境缺少系统库。Windows Chrome/Edge与iPhone Safari真机验收尚待完成。
- 这是固定数学题型内可调整数字的教学原型；不自动识别上传错题，也不建立跨设备账号。超出范围或不成立的条件会明确拒绝，不会猜测答案。
- “上一步”用于回看该关观察，不回滚历史作答；“重播”重置当前演示，不重复创建物体。“重新尝试”清空当前操作，但保留首次记录。
- 完整讲解后必须做相似练习，再重新完成原题；相似练习目前提供文字题干，不另建专属动画。
- 未来可增加本地学习档案导入、更多错题模型、离线缓存、自定义分步录音、家长可控的AI辅导。任何云端功能都需单独设计明确的数据与权限边界。
