# 项目约定

- 首发使用 Vue 3 + TypeScript。视觉方向为水墨与科技融合、功夫朋克的原创转译；通过基础组件、MG 与真实流程样板持续收敛视觉规范。
- 公开组件统一使用 `M` 前缀，例如 `MInput` / `<m-input>`，公开 Props 与选项类型同样使用 `M` 前缀。CSS `ui-*` 与 `--ui-*` 是现有主题契约，按需演进，不随组件引用名机械替换。
- 持续优化遵循 `design/quality-contract.json` 的七项品质约定；每批二级组件需要放进真实组合流程，兼顾明暗、窄屏、长内容和减少动态效果。
- `src/utils/` 保持纯 TypeScript，不依赖 Vue、React 或 GSAP。Vue 响应式与生命周期适配放在 `src/composables/`。
- GSAP 和 MG 编排放在独立的 `src/motion/` 入口。纯工具入口不能引入组件、样式或动效运行时；聚合能力通过 `all` 入口提供。
- `design/tokens.json` 是设计变量真源。修改变量后运行 `pnpm tokens`，生成 `src/styles/tokens.css`，不要只修改生成文件。
- 日常组件支持键盘、可见焦点、加载和错误等实际状态；中文组合输入期间保留未提交文本。
- 动效遵循减少动态效果偏好。每个实例负责暂停、销毁及事件和观察器清理，避免清理其他实例的 GSAP 状态。
- 修改后执行与改动相关的检查；交付工程变更前运行 `pnpm check`。有交互变更时在 Storybook 中检查相关状态和窄屏表现。
- `pnpm check` 在构建后以 `skipLibCheck: false` 检查 `tests/consumer/` 对公开声明的使用。新增组件或入口时同步覆盖消费用法，不用源码别名替代构建产物。
- 表单、导航、数据、浮层、通知或业务组合的交互变更还需运行 `pnpm test:browser`；不要让工具层测试与真实浏览器用例互相混入。先完成源码与 Token 生成，再启动浏览器回归，避免开发服务器 HMR 干扰测试。
- 浏览器回归在本地使用独立 Storybook 开发服务；CI 在 `pnpm check` 后托管刚生成的 `storybook-static`，校验实际构建产物，避免将首次开发编译时间混入交互断言。进入 Story 后先等待工作台渲染容器就绪，不用延长断言超时掩盖页面尚未加载。
- 保留现有 MIT `LICENSE` 和版权声明。构建产物、依赖目录和工作台静态产物不提交。
- 当前按用户约定在 `main` 推进；相关检查和 `pnpm check` 通过后直接提交并推送 `main`，不主动创建 PR。每次提交前核对仓库级 Git 身份，使用已确认的 GitHub 用户名 `MaLaNg116` 和 `117097445+MaLaNg116@users.noreply.github.com`，不要沿用全局实名身份。
