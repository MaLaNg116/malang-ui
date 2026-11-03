# 项目约定

- 首发使用 Vue 3 + TypeScript。视觉方向为水墨与科技融合、功夫朋克的原创转译；现有科技主题是工程原型，下一步通过样板收敛视觉规范。
- `src/utils/` 保持纯 TypeScript，不依赖 Vue、React 或 GSAP。Vue 响应式与生命周期适配放在 `src/composables/`。
- GSAP 和 MG 编排放在独立的 `src/motion/` 入口。纯工具入口不能引入组件、样式或动效运行时；聚合能力通过 `all` 入口提供。
- `design/tokens.json` 是设计变量真源。修改变量后运行 `pnpm tokens`，生成 `src/styles/tokens.css`，不要只修改生成文件。
- 日常组件支持键盘、可见焦点、加载和错误等实际状态；中文组合输入期间保留未提交文本。
- 动效遵循减少动态效果偏好。每个实例负责暂停、销毁及事件和观察器清理，避免清理其他实例的 GSAP 状态。
- 修改后执行与改动相关的检查；交付工程变更前运行 `pnpm check`。有交互变更时在 Storybook 中检查相关状态和窄屏表现。
- 保留现有 MIT `LICENSE` 和版权声明。构建产物、依赖目录和工作台静态产物不提交。
