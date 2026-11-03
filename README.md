# malang-ui

一套以水墨与科技融合为视觉方向的前端组件库，包含 UI 组件、GSAP 动效、MG 编排和实用工具。首发使用 Vue 3 + TypeScript，先在自己的项目中验证，再逐步扩展与开源。

当前交付的是可运行的工程起点和 Storybook 开发工作台。界面仍沿用前一版科技主题；下一步会用组件与 MG 样板验证水墨科技、功夫朋克的原创视觉转译。

## 本地开发

使用 Node.js 24 或更高版本、pnpm 11.25。

```sh
pnpm install
pnpm dev
```

打开终端输出中的 Storybook 地址。左侧目录可以查看组件状态、MG 编排和工具示例；顶部工具栏可以切换主题、密度与减少动态效果。

## 检查与构建

```sh
pnpm tokens           # 从 design/tokens.json 生成 CSS 变量
pnpm typecheck        # Vue 与 TypeScript 类型检查
pnpm test             # 工具行为测试
pnpm build            # 构建组件库与类型声明
pnpm build:storybook  # 构建可独立托管的工作台
pnpm check            # 依次执行类型、测试和两类构建
```

`dist/` 是组件库产物，`storybook-static/` 是工作台产物。开发工具、stories 和测试文件不属于组件运行时入口。

## 模块入口

当前包尚未发布到 npm，`package.json` 保持 `private: true`。以下导入方式用于构建后的本地安装包：

```ts
import { UiButton, UiInput, UiSwitch } from 'malang-ui';
import 'malang-ui/style.css';

// 纯工具入口不依赖 Vue 或 GSAP。
import { debounce, throttle, asyncLock } from 'malang-ui/utils';

// 动效入口单独使用 GSAP，消费方需要安装 gsap。
import { createOrbitSequence } from 'malang-ui/motion';

// 聚合入口包含 UI、工具与 GSAP 动效。
import * as MalangUI from 'malang-ui/all';
```

在独立项目中验证时，先生成本地安装包：

```sh
pnpm build
pnpm pack
```

随后在消费项目中安装生成的 `.tgz` 文件，并安装 Vue；使用动效或聚合入口时同时安装 GSAP。

## 已有能力

| 模块 | 当前内容 |
| --- | --- |
| UI | `UiButton`、`UiInput`、`UiSwitch`，含常用状态、键盘操作与中文输入示例 |
| 工具 | `debounce`、`throttle`、`asyncLock` |
| 动效与 MG | 轨道构形编排，支持播放、暂停、定位、重播与销毁 |
| Vue 适配 | `useReducedMotion`，以及示例中的生命周期清理 |
| 设计基础 | 明暗主题、密度、排版、间距与动效变量 |
| 开发工作台 | Storybook 的组件状态、组合界面和工具交互示例 |

防抖和节流提供 `cancel()`、`flush()`、`pending()`。`asyncLock()` 让并发调用共享同一个进行中的 Promise，并在成功或失败后释放。MG 控制器的 `seek()` 使用秒，`dispose()` 只清理当前实例。

## 目录

```text
design/        设计 Token、首版规划与参考资料
src/components/  Vue 基础组件
src/utils/       不依赖框架的通用工具
src/motion/      GSAP 与 MG 编排
src/composables/ Vue 响应式和生命周期适配
src/styles/      由 Token 生成的 CSS 变量
stories/         组件状态与交互演示
.storybook/      开发工作台配置
tests/           工具行为测试
scripts/         Token 生成与构建辅助脚本
```

设计变量以 [design/tokens.json](design/tokens.json) 为真源，通过 `pnpm tokens` 更新生成的 CSS。当前颜色仍为临时值，水墨科技方案将先在样板中验证。

## 后续方向

- 用组件库自己的文档与展示站检验公开入口和组合能力。
- 完成水墨科技组件样板，并扩充墨迹聚散、笔画构形、切面展开、机械归位等 MG 场景。
- 逐步加入 Tabs、Card、Dialog、Popover、Toast 等组件。
- 保持工具、设计数据和编排规范可复用，后续增加 React 适配。

完整范围见 [design/roadmap.json](design/roadmap.json)，设计参考见 [design/skill-references.json](design/skill-references.json)。

## 许可证

[MIT](LICENSE)，保留仓库现有版权声明。
