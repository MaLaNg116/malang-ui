# malang-ui

一套以水墨与科技融合为视觉方向的前端组件库，包含 UI 组件、GSAP 动效、MG 编排和实用工具。首发使用 Vue 3 + TypeScript，先在自己的项目中验证，再逐步扩展与开源。

当前包含可运行的工程起点与首轮水墨科技样板。在 Storybook 的「开始 / 水墨科技样板」中，可以体验暖纸、浓墨、朱砂与青玉主题，试用工作空间配置、防抖搜索和四段 MG 编排。视觉方向正在通过实际组件验证，尚未定稿。

「基础组件 / 交互语言」集中展示按钮、输入框与开关的轮廓、焦点和状态反馈。设计使用折锋边角、墨线焦点与方形滑锁，在明暗主题中保持一致，并保留原生输入、键盘与触屏操作。

「开始 / 导航与弹层」把 Tabs 和 Dialog 组合成一个可操作的工作空间：切换示例、用法与参数，打开编辑窗口，校验并保存设置，再回到原先的触发按钮。

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
pnpm test:browser     # Tabs / Dialog 真实浏览器交互测试
pnpm build            # 构建组件库与类型声明
pnpm build:storybook  # 构建可独立托管的工作台
pnpm check            # 依次执行类型、测试和两类构建
```

`dist/` 是组件库产物，`storybook-static/` 是工作台产物。开发工具、stories 和测试文件不属于组件运行时入口。

首次运行浏览器测试前执行 `pnpm exec playwright install chromium`；Linux 如需系统依赖可加 `--with-deps`。测试会自动在 6007 端口启动独立 Storybook，不占用日常预览的 6006。CI 会安装浏览器，并在 `pnpm check` 后执行这批交互测试。

## 模块入口

当前包尚未发布到 npm，`package.json` 保持 `private: true`。以下导入方式用于构建后的本地安装包：

```ts
import { UiButton, UiInput, UiSwitch, UiTabs, UiDialog } from 'malang-ui';
import 'malang-ui/style.css';

// 纯工具入口不依赖 Vue 或 GSAP。
import { debounce, throttle, asyncLock } from 'malang-ui/utils';

// 动效入口单独使用 GSAP，消费方需要安装 gsap。
import { createInkSequence, createOrbitSequence } from 'malang-ui/motion';

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
| UI | `UiButton`、`UiInput`、`UiSwitch`、`UiTabs`、`UiDialog`，含常用状态、键盘操作与组合流程 |
| 工具 | `debounce`、`throttle`、`asyncLock` |
| 动效与 MG | 轨道构形与墨迹切面编排，支持播放、暂停、定位、重播与销毁 |
| Vue 适配 | `useReducedMotion`，以及示例中的生命周期清理 |
| 设计基础 | 明暗主题、密度、排版、间距与动效变量 |
| 开发工作台 | Storybook 的组件状态、组合界面和工具交互示例 |

防抖和节流提供 `cancel()`、`flush()`、`pending()`。`asyncLock()` 让并发调用共享同一个进行中的 Promise，并在成功或失败后释放。MG 控制器的 `seek()` 使用秒，`dispose()` 只清理当前实例。

`UiTabs` 使用 `v-model`、`items` 和必填的 `label`。每个 item 提供同组唯一的 `value`、`label` 与可选 `disabled`，同名插槽承载面板，默认插槽可读取 `{ item, active }`。面板切换时保留挂载；方向键、Home/End 会跳过禁用项。默认聚焦即激活，`activationMode="manual"` 改为回车或空格确认。传入值不可用时显示首个可用面板，兜底不会主动修改父模型；全禁用或空列表时不显示活动面板。

`UiDialog` 使用 `v-model`、必填的 `title` 与可选 `description`，`#footer="{ close }"` 提供自定义操作区。默认允许 Escape 关闭，点击遮罩保持打开；可通过 `closeOnEscape`、`closeOnBackdrop` 调整，关闭按钮始终可用。它基于原生 `dialog.showModal()`，面向支持该 API 的现代浏览器，未附带 polyfill。打开时背景不可交互并锁定滚动，关闭后恢复焦点；嵌套实例和卸载会清理各自的滚动锁。对话框保留原有 DOM 位置，因此可继承所在区域的主题与减少动态效果设置。

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
tests/           工具行为与浏览器交互测试
scripts/         Token 生成与构建辅助脚本
```

设计变量以 [design/tokens.json](design/tokens.json) 为真源，通过 `pnpm tokens` 更新生成的 CSS。样板使用同一套变量；明暗主题与减少动态效果可在 Storybook 顶部切换。

`createInkSequence(canvas, options)` 是独立的五秒 MG 编排，按「蓄势、疾出、收锋、归位」组织墨迹与几何切面。控制器默认不自动播放；使用 `play()`、`pause()`、`seek(seconds)`、`replay()` 与 `dispose()` 控制。默认遵循系统减少动态效果偏好，此时播放直接显示落印状态；仍可使用 `seek()` 静态查看各阶段。实例会在页面隐藏时暂停，卸载时应调用 `dispose()`。

## 后续方向

- 用组件库自己的文档与展示站检验公开入口和组合能力。
- 根据首轮水墨科技样板继续优化颜色与细节，扩充笔画构形、切面展开、机械归位等 MG 场景。
- 逐步加入 Card、Popover、Toast，并扩充现有组件的真实场景。
- 保持工具、设计数据和编排规范可复用，后续增加 React 适配。

完整范围见 [design/roadmap.json](design/roadmap.json)，设计参考见 [design/skill-references.json](design/skill-references.json)。

## 许可证

[MIT](LICENSE)，保留仓库现有版权声明。
