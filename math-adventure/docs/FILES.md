# V1.1 本次修改文件清单

基于 e763684b19d73ae00084ae37a9acf986b15be072，在 codex/math-adventure-v1 分支继续开发。根目录旧 README.md 与 index.html 内容不变。

- `.github/workflows/math-adventure.yml`
- `math-adventure/README.md`
- `math-adventure/docs/FILES.md`
- `math-adventure/docs/QUEUE_DESIGN.md`
- `math-adventure/docs/TEACHING_DESIGN.md`
- `math-adventure/docs/VALIDATION.md`
- `math-adventure/package-lock.json`
- `math-adventure/package.json`
- `math-adventure/src/App.tsx`
- `math-adventure/src/animation/storyboards.ts`
- `math-adventure/src/components/Configuration.tsx`
- `math-adventure/src/components/LevelSession.tsx`
- `math-adventure/src/components/Report.tsx`
- `math-adventure/src/questions/builders.ts`
- `math-adventure/src/questions/data.ts`
- `math-adventure/src/questions/models.ts`
- `math-adventure/src/questions/queue.ts`
- `math-adventure/src/records/store.ts`
- `math-adventure/src/scenes/QueueScene.tsx`
- `math-adventure/src/scenes/Scenes.tsx`
- `math-adventure/src/styles/main.css`
- `math-adventure/tests/e2e/adventure.spec.ts`
- `math-adventure/tests/e2e/configurable.spec.ts`
- `math-adventure/tests/queue.test.ts`

新增排队设计见 QUEUE_DESIGN.md；测试记录见 VALIDATION.md。缓存、截图、node_modules、dist 和测试临时产物不提交。


## V1.2 错题本动画修改清单

本次仅修改以下15个项目文件，原四关、排队专题、根目录测试网页和工作流均保留：

- `math-adventure/README.md`
- `math-adventure/docs/FILES.md`
- `math-adventure/docs/PDF_NOTEBOOK.md`（新增）
- `math-adventure/docs/TEACHING_DESIGN.md`
- `math-adventure/docs/VALIDATION.md`
- `math-adventure/package.json`
- `math-adventure/package-lock.json`
- `math-adventure/src/App.tsx`
- `math-adventure/src/components/Report.tsx`
- `math-adventure/src/pdf/model.ts`（新增）
- `math-adventure/src/pdf/Scene.tsx`（新增）
- `math-adventure/src/pdf/Lab.tsx`（新增）
- `math-adventure/src/styles/main.css`
- `math-adventure/tests/pdf.test.ts`（新增）
- `math-adventure/tests/e2e/pdf.spec.ts`（新增）

本次不新增依赖。原PDF、本地预览截图、孩子学习记录、缓存和构建产物均不提交。


## V1.3 两份新错题本修改清单

共20个项目文件；原四关、排队、21题、根目录测试网页和工作流保留。

- `math-adventure/README.md`
- `math-adventure/docs/FILES.md`
- `math-adventure/docs/TEACHING_DESIGN.md`
- `math-adventure/docs/TWO_NOTEBOOKS.md`
- `math-adventure/docs/VALIDATION.md`
- `math-adventure/package-lock.json`
- `math-adventure/package.json`
- `math-adventure/src/App.tsx`
- `math-adventure/src/components/Report.tsx`
- `math-adventure/src/notebooks/Lab.tsx`
- `math-adventure/src/notebooks/Scene.tsx`
- `math-adventure/src/notebooks/geometry.ts`
- `math-adventure/src/notebooks/model.ts`
- `math-adventure/src/notebooks/types.ts`
- `math-adventure/src/pdf/Lab.tsx`
- `math-adventure/src/pdf/Scene.tsx`
- `math-adventure/src/pdf/model.ts`
- `math-adventure/src/styles/main.css`
- `math-adventure/tests/e2e/notebooks.spec.ts`
- `math-adventure/tests/notebooks.test.ts`

新增模块见 TWO_NOTEBOOKS.md；已有教学会话通过可选参数扩展，旧题接口保持兼容。依赖清单仅更新版本号，没有安装新运行依赖。
