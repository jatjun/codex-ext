# 架构

React + TypeScript + Vite；新增运行时依赖仅React与ReactDOM，复用仓库已锁定成熟开发工具。Vite base='./'，支持GitHub Pages子路径。

- src/math-engine/space.ts：六面数据、相对关系、答案规则、铰链角度与有效性校验。
- src/lessons/catalog.ts：两课来源、故事、分步讲解和问题。
- src/animation/Solid.tsx：仅根据传入状态绘制六个面，不判断答案。
- src/teacher/logic.ts：分级错误提示、导航门控；TeacherAdapter只是未来扩展的类型边界，本版不连接API。
- src/progress/store.ts：独立localStorage命名空间 textbook-adventure.records.v1，首次答案和历史不能被后续答案覆盖。
- src/main.tsx：交互、步骤调度、语音屏障、路由式面板与记录页；控制集中在本项目，无共享数据库。
- tests：数学规则与浏览器完整流程。

新增课程先定义可校验模型与标签，给定正确答案规则、主题/独立题/迁移题，再连接可视化组件；增加测试确保全过程相同模型。不从AI生成文本中提取或修改数学答案。未来接入AI须经服务端代理、用户授权、规则校验，前端不保存Key。

Pages原工作流增加一个独立矩阵项目和一个构建子目录，前三科源代码不变。共用首页新增一个教材入口。本项目记录暂不接入原三科错题本；不会擅自改变其记录结构。
