# codex-ext
My codex claude projects


## 学习小花园

数学与语文共用一个GitHub Pages首页，分别进入独立项目：

- `learning-home/`：共同首页源文件。
- `math-adventure/`：数学动画实验室，原功能与学习记录保留。
- `chinese-adventure/`：语文动画小花园，5本125题入口与共享知识动画。

发布首页：https://jatjun.github.io/codex-ext/

语文使用与开发说明见 [chinese-adventure/README.md](chinese-adventure/README.md)。原始PDF和手写作答不发布。语文表达题使用自查，不自动判断语意，不把参考句当唯一答案。

沿用现有GitHub Actions Pages工作流，先检查两科再发布。开发和发布使用功能分支；未经确认不合并main。根目录原测试`index.html`保留，实际Pages首页由`learning-home/index.html`构建发布。
