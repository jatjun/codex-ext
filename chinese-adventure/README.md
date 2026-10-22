# Chinese Adventure｜语文动画小花园 V1

适合小学阶段孩子的简体中文语文教学原型。根据本次5份语文错题PDF，按上传顺序保留5册各25题，共125个题目入口。通过11类共享SVG示例模型、移动分类卡、词句排序、分级提示和独立迁移帮助理解；不是125段独立复刻原题的动画。长阅读题有教学缩编，详见[教学设计](docs/TEACHING_DESIGN.md)与[逐题清单](docs/CATALOG.md)。

## 怎么使用

共同首页选“语文动画小花园”→选错题本→原题号→“开始探索”→每段动画看完点下一步→作答。第一次错误轻提示，第二次可回看图形，第三次展开讲解后先练相似题。原题完成后还要独立再试。

分类：点卡片，再点分类框；已归类卡片可以重新选。排序：按顺序点词卡，点已选卡片可放回。拼音可展开声调小键盘。表达题先提交自己的想法，再自查；参考表达不作为唯一答案。

暂停、继续、重播、上一步和静音按钮有效。默认文字教学，点“开启语音”后使用浏览器中文语音。示例每段动画和语音都结束后才开放下一段；没有精确口型同步。语音失败或等候过长会取消该次语音并保留文字，不越步播放。iPhone需用户点按钮启动，声音与拼音准确度受系统中文音色影响。

## 文件结构与技术

```text
chinese-adventure/
  src/
    catalog.ts       125题结构化数据与改编注记
    types.ts         题目、教学和学习记录模型
    teaching.ts      纯评分与状态转换
    variants.ts      各类相似练习、独立迁移
    Scene.tsx        11类SVG方法示例
    App.tsx          入口、分步教学与家长手记
    records.ts       本地保存、JSON/CSV导出
    style.css        电脑/手机适配
  tests/             单元测试及Playwright浏览器测试
  docs/              教学设计、题目映射、验证结果
learning-home/       仓库根目录的共同首页源文件
```

React + TypeScript + Vite。运行时只有React与React DOM，动画使用SVG、requestAnimationFrame和Web Animations API。尊重系统减少动态设置。没有CDN、外部图片/字体、后台、账号登录、语音识别或大模型API。不依赖数学源代码或其他项目运行。

## 本地与Windows

安装Node.js 22，在仓库目录打开PowerShell：

```powershell
cd chinese-adventure
npm ci
npm run dev
```

打开终端显示的地址。局域网手机访问需电脑与手机在同一Wi-Fi，输入电脑IP和开发端口，并允许本地防火墙；通常直接用已发布网址更方便。

检查：

```powershell
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e -- --workers=2
```

Windows不能原生运行Playwright的WebKit项目时，可运行`npm run test:e2e -- --project=chromium --project=chromium-touch`，WebKit交给Linux CI。真实iPhone仍需Safari人工试听与触控检查。

## GitHub Pages与iPhone访问

沿用`.github/workflows/math-adventure.yml`，同一个Pages部署包含：

- `/codex-ext/`：共同首页。
- `/codex-ext/math-adventure/`：完整数学项目。
- `/codex-ext/chinese-adventure/`：语文项目。

CI使用与锁定依赖匹配的Playwright v1.64.1-noble官方预装镜像，按SHA256固定。升级`@playwright/test`时同时更新镜像版本和摘要，保留全部浏览器测试。

两个项目均使用Vite相对base，构建产物独立，支持GitHub Pages子路径。旧数学根级资源也保留在发布包中；共同首页替代网站根入口。仓库原始根目录测试页`index.html`没有覆盖。

Pages Source保持GitHub Actions，保留变量`MATH_ADVENTURE_PAGES_ENABLED=true`即可，普通更新不必重新设置。发布分支仍为`codex/math-adventure-v1`；功能分支用于开发，不合并main。工作流先检查数学，再检查语文，成功后组装共同首页并一次性发布。仓库公开时通常可免费使用Pages，具体额度/收费以GitHub当前套餐为准。本项目没有支付功能。

用iPhone Safari打开共同网址，选语文；可“添加到主屏幕”。无需下载Git或安装npm。代码备份和本地运行是开发操作，孩子访问网站不需要。

## 学习记录

使用当前网站同源下的localStorage键`chinese-adventure.records.v1`，与数学键分开。保存日期、题号、阶段、首次作答、首次/后续是否正确、尝试历史、提示次数、讲解是否展开、完成、自查和实际前台交互时长。首次错误和开放题初稿不被后续修改覆盖。暂停/隐藏期间不计时。记录每次作答/帮助/完成时保存；未提交草稿与提交后尚未保存的思考时长不保证保留。

“家长手记”显示各册完成题数、客观原题首次正确率、首次错后改正率、迁移客观题首次正确率、开放自查次数与知识类别。统计按小练习及练习会话，不是整册考试分数。不把单次结果转为医学、心理或发展诊断。支持JSON/CSV导出，CSV避免公式开头被执行。学习数据不上传；换设备、无痕模式或清除网站数据不会同步/保留。

## 如何加新题

1. 在`src/catalog.ts`新增Lesson，使用唯一ID、book、number与已核对知识类别。
2. 给tasks设置choice/multi/fill/order/sort/open；选择项、标准答案、讲解和开放自查清单必须明确。
3. 开放题answers为空，不设唯一参考句；用example与checks引导。
4. 确认原题条件完整、资料可靠；不把扫描件解析错误直接当标准答案。
5. 新知识类需同时增加Scene、demos和variants，提供真实动态对象及不同的相似题/迁移题。
6. 更新逐题清单，运行类型检查、单元、浏览器与构建。独立分支提交，验证Pages后再交付。

## 限制与后续

没有自动上传PDF/OCR生成题目，没有自由修改所有题干或自动生成新标准答案。当前按精选模型教学；书籍回忆题仍须结合读过的书。开放表达只能自查，不能自动鉴定语病。各知识类的相似题/迁移题为固定两题，多次进入会重复；后续应扩大题库。没有规范汉字逐笔书写动画，不伪装已具备该能力。拼音朗读要以教师和规范音频核对，浏览器语音不是专业拼音音库。后续可增加更多情境模型、规范语音、字词收藏与经家长授权的跨设备同步。
