# 开发与贡献

使用 Node.js 24 或更高版本以及仓库指定的 pnpm 11.25。首次使用运行 `pnpm install`。

## 本地服务

```sh
pnpm dev
```

Storybook 使用 6006。另开一个终端运行 `pnpm dev:website`，在 5173 浏览官网。官网开发模式从 6006 加载交互预览。可以只启动 Storybook 开发组件，也可以同时启动两个服务检查官网目录、示例和文档。 [本地官网](http://127.0.0.1:5173/) · [Storybook](http://127.0.0.1:6006/)

官网静态产物在 `website/dist/`，完整 Storybook 位于其中的 `workbench/`。构建后可用独立预览服务检查本地产物。

```sh
pnpm build:website
pnpm exec vite preview --config website/vite.config.ts --port 5174 --host 127.0.0.1 --strictPort
```

官网目录和 API 数据由 `scripts/generate-website-catalog.mjs` 与 `scripts/generate-website-api.mjs` 根据公开导出、Storybook 索引和 Vue 单文件组件的声明生成。改动组件接口后运行 `pnpm build:website` 刷新生成的 JSON。

## 检查与构建

| 命令 | 内容 |
| --- | --- |
| `pnpm tokens` | 从 `design/tokens.json` 生成 CSS 变量 |
| `pnpm typecheck` | Vue 与 TypeScript 类型检查 |
| `pnpm test` | 工具与基础逻辑测试 |
| `pnpm build` | 在 `dist/` 生成组件库、样式和声明 |
| `pnpm typecheck:package` | 构建后使用 `skipLibCheck: false` 检查公开声明 |
| `pnpm build:storybook` | 在 `storybook-static/` 生成独立工作台 |
| `pnpm check` | 执行库类型、测试、构建、声明消费和带工作台的官网构建 |
| `pnpm test:browser` | 验证组件状态与真实业务组合的浏览器交互 |
| `pnpm build:website` | 生成带完整工作台的官网静态产物 |
| `pnpm test:website` | 对已构建的官网运行浏览器验证 |

首次运行浏览器测试前执行 `pnpm exec playwright install chromium`，Linux 缺少系统依赖时可加 `--with-deps`。组件浏览器测试在本地使用 6007 的独立 Storybook。CI 校验 `pnpm check` 生成的 `storybook-static/`。官网浏览器测试使用 5174 托管 `website/dist/`，进入每个示例后先确认真实内容就绪。 [Playwright webServer](https://playwright.dev/docs/test-webserver)

`dist/`、`storybook-static/`、`website/dist/` 和测试输出都是生成文件。组件安装包只包含库产物和第三方声明。

## 目录

```text
src/components/    Vue 组件和公开 Props
src/utils/         纯 TypeScript 工具
src/composables/   Vue 响应式和生命周期适配
src/motion/        独立 GSAP 与 MG 编排
src/styles/        Token、滚动条和 DOM 过渡样式
design/            设计真源、品质约定与覆盖对照
stories/           组件状态、交互组合和动效示例
.storybook/        Storybook 配置
website/           官网、组件目录和接入指南
tests/             单元、消费、组件和官网浏览器测试
scripts/           Token、目录数据和构建辅助脚本
```

## 组件与设计验证

改动设计变量时编辑 `design/tokens.json`，执行 `pnpm tokens` 更新生成的 CSS。Storybook 的顶部工具栏可切换主题、浅色材质、密度和减少动效。设计约定和实测取舍见[品质约定](../design/quality-contract.json)、[配色复核](../design/palette-review.json)和[交互动效盘点](../design/motion-audit.md)。

配色回归覆盖实际使用的常见不透明前景和背景组合。普通文字检查至少 4.5:1，识别控件的边界与焦点标记检查相邻颜色至少 3:1。按不透明 sRGB 计算相对亮度，在浏览器中核对变量是否生效，临界值不四舍五入。装饰性加载纹理另做视觉与减动检查。接入页面仍需检查自身结构、状态和辅助技术体验。 [W3C 文字对比度](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [G18 相对亮度](https://www.w3.org/WAI/WCAG22/Techniques/general/G18) · [非文字对比度](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

### 组件覆盖记录

Storybook「开始 / 组件覆盖对照」按能力搜索和筛选两家参考目录。2026-11-05 的快照覆盖 Ant Design 6.7.0 和 Element Plus 2.14.7，归并为 29 类能力，保留 155 条官方组件记录。快照区分基础支持、可组合能力和缺项。 [覆盖快照](../design/component-coverage.json) · [Ant Design 6.7.0](https://github.com/ant-design/ant-design/releases/tag/6.7.0) · [Element Plus 2.14.7](https://github.com/element-plus/element-plus/releases/tag/2.14.7)

逐项实现、源码和核心验收可查阅[实现对照](../design/component-parity.json)。Border 与 Color 属于设计参考，Util 属于类型工具，Pro、X、Mobile 等独立产品在核心目录范围之外。组件采用 MaLang 公开 API，覆盖记录反映核心能力及验证范围。

## 贡献

先查看仓库约定和现有 Story。组件改动提供可复现状态，新增公开入口同步补充严格消费检查，交互改动验证实际浏览器行为。关注明暗配色、360px 布局、长内容、键盘和减少动效。 [仓库约定](../AGENTS.md)

当前优先在自己的项目中验证，继续打磨功夫朋克的视觉与 MG。工具、设计数据和编排规范独立维护，为后续 React 适配保留边界。 [路线图](../design/roadmap.json) · [设计参考](../design/skill-references.json)
