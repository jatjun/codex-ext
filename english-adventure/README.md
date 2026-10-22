# 英语奇遇岛 · English Adventure

独立的英语动画学习项目，与数学、语文共用「学习小花园」首页。两个上传题本按原题号保留18+12个入口；含字母、问候、拼写、听力、词卡组句、口语、操场绘画、课程表和书包设计。

## 使用

发布首页：https://jatjun.github.io/codex-ext/ ，点击「进入英语世界」。英语直达：https://jatjun.github.io/codex-ext/english-adventure/ 。发布状态请看本次交付和 GitHub Actions，地址本身不代表发布完成。

Windows Chrome/Edge和iPhone Safari均可使用。手机先点击开始和播放语音；若没有英语声音，检查系统语音包、音量及静音设置，仍无法播放可主动切换文字学习。文字辅助会单独记录，不算独立听力成功。画布支持手指画图和点击印章，画布之外可以滑动。

操作：选择题本→打开原题→开始→三步观察→作答。首次错误给轻提示，第二次引导回看，第三次讲解并先做相似题，再回原题。原题完成后要做独立迁移。暂停同时暂停画面、语音和计时；重播不增加物品。作品题先动手、用英语描述，再逐项自查。

## 本地运行（含Windows终端）

先安装Node.js22及Git，克隆或下载仓库后：

```sh
cd codex-ext/english-adventure
npm ci
npm run dev
```

打开终端显示的地址。iPhone同Wi-Fi访问电脑局域网IP与Vite端口，按Windows防火墙提示仅对可信局域网放行；也可直接打开Pages，无须电脑开机。

```sh
npm test
npm run build
npx playwright install
npm run test:e2e -- --workers=2
```

CI使用与锁文件一致的官方Playwright1.64.1镜像，不在每次发布时安装系统浏览器依赖。测试覆盖范围见 [VALIDATION.md](docs/VALIDATION.md)。

## 结构与技术

- `src/catalog.ts`：结构化原题、相似题、独立迁移、参考与自查规则。
- `src/Art.tsx`：原创SVG人物、动物、物品；不使用外部图片/CDN。
- `src/Scene.tsx`：逐步动画、字母可视标记、听力目标遮挡。
- `src/Workshop.tsx`：真实手绘、印章、25格课程表、书包物品操作。
- `src/App.tsx`：教学状态、逐级提示、家长报告。
- `src/audio.ts`：原生英语语音队列，按每句结束事件推进。
- `src/model.ts`：拼写、大小写、词序、选择和数量规则。
- `src/records.ts`：本地记录及JSON/CSV导出。
- `tests/`：单元与真实浏览器测试。

React+TypeScript+Vite；生产依赖仅React和ReactDOM。动画采用SVG、requestAnimationFrame及CSS，尊重减少动态效果设置。

## 记录与隐私

英语记录在浏览器localStorage键`english-adventure.records.v1`，与数学/语文分开。首次原始答案、是否用辅助、所有提交历史、提示、讲解、自查、听力/文字、迁移、完成和活动用时均保留。首次错误不会被后续正确覆盖。JSON可保留绘画线条及课程表；CSV便于查看摘要。浏览器隐私模式、清理网站数据、更换设备会导致记录不保留或不互通。存储失败显示提示。

无需登录，不上传学习数据，无API Key或大模型接口，不发布原PDF、手写答案、孩子姓名或照片。教材人物为虚构角色。成绩不作任何发展、医学或心理诊断。

## 听力与自查边界

题本不含可提取的原音频；听力根据印刷文字由浏览器合成，明确标为「非原录音」。完整播放以onend事件为准；错误或超时不计为听完。下一步同时等待当前动画和语音，用户手动推进；不保证毫秒同步。后台自动暂停，设备语音异常可重听/看文字。

没有语音识别、自动口语评分或自由写作语法评分。口语及作品完成表示孩子完成自查；不计入客观题正确率。中文姓名音译和孤立音标可能读不准确，发音教学应参考老师；j在jam中是浊塞擦音/dʒ/，区别于字母名/dʒeɪ/。ink/igloo均用重新绘制的清晰图片。

## 增加错题

在`src/catalog.ts`用`add`加入入口，给Task唯一id、mode、scene、提示、讲解、标准答案（客观题）或自查清单/参考（开放题），提供不同的retry和transfer。字母题明确列出完整数组，不能随机后猜数量。听力需提供合法来源文字并保留辅助标记；不要把答案预画在主场景。需要新插画时扩展Art类型和Drawing。修改后运行单元、构建和浏览器测试，并更新目录文档。

## Pages与后续方向

沿用`.github/workflows/math-adventure.yml`，分别检查三科，统一组装`learning-home/index.html`和三个子目录。Vite使用相对base。Pages Source为GitHub Actions，现有`MATH_ADVENTURE_PAGES_ENABLED=true`控制发布。发布分支仍为`codex/math-adventure-v1`，不合并main。新功能先在独立分支验证，保留旧版本备份。

后续可加入经授权的真人音频、更多原创情境、跨设备可选同步和教师审核；首版不实现账户、付费、语音识别或AI辅导。
