# codex-ext
My codex claude projects


## 学习小花园

数学、语文与英语共用一个GitHub Pages首页，分别进入独立项目：

- `learning-home/`：共同首页源文件。
- `math-adventure/`：数学动画实验室，原功能与学习记录保留。
- `english-adventure/`：英语奇遇岛，2本30题入口，原创动画、听力与创作工作室。见 [使用说明](english-adventure/README.md)。
- `chinese-adventure/`：语文动画小花园，5本125题入口与共享知识动画。

发布首页：https://jatjun.github.io/codex-ext/

语文使用与开发说明见 [chinese-adventure/README.md](chinese-adventure/README.md)。原始PDF和手写作答不发布。语文表达题使用自查，不自动判断语意，不把参考句当唯一答案。

沿用现有GitHub Actions Pages工作流，分别检查三科再发布。开发和发布使用功能分支；未经确认不合并main。根目录原测试`index.html`保留，实际Pages首页由`learning-home/index.html`构建发布。

## 按题型复习与我的错题本

数学首页可按题型找原题；三科页眉和共同首页都有[我的错题本](https://jatjun.github.io/codex-ext/mistakes.html)。实际答错后自动收录，首次答案保留，口语与表达单列自查作品。说明与旧记录限制见[复习说明](docs/REVIEW_NOTEBOOKS.md)。

## 教材 · 空间探索站

`textbook-adventure/`为独立教材动画项目，与三科共用首页；首轮依据本次“观察物体”第1～5页截图，提供原创CSS 3D多方向观察与六面纸盒展开折叠。教材原图不入库，三科学习数据不变。[运行与教学说明](textbook-adventure/README.md)。
