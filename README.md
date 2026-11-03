# malang-ui

一套以水墨与科技融合为视觉方向的前端组件库，包含 UI 组件、GSAP 动效、MG 编排和实用工具。首发使用 Vue 3 + TypeScript，先在自己的项目中验证，再逐步扩展与开源。

当前基础版提供 23 个公开组件、纯 TypeScript 工具与两套 GSAP / MG 编排。视觉使用暖纸、浓墨、朱砂和青玉，颜色与细节仍会继续迭代。

从 Storybook 的「开始 / 基础版使用指南」查看组件索引和接入方式；在「业务组合工作台」实际操作搜索、阶段筛选、重点项目过滤、分页、编辑、新建与保存通知。示例数据只保留在当前预览，不提交到服务器。

「基础组件 / 交互语言」集中展示按钮、输入框与开关的轮廓、焦点和状态反馈。设计使用折锋边角、墨线焦点与方形滑锁，在明暗主题中保持一致，并保留原生输入、键盘与触屏操作。

「开始 / 导航与弹层」把 Tabs 和 Dialog 组合成一个可操作的工作空间：切换示例、用法与参数，打开编辑窗口，校验并保存设置，再回到原先的触发按钮。

工作空间现由 `UiCard` 承载，保存后由 Toast 提供轻提示，结果文字仍会保留。提示不会抢走焦点；悬停、键盘聚焦或页面隐藏时会暂停计时。

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
pnpm typecheck:package # 构建后，严格检查公开声明和泛型表格的消费用法
pnpm test             # 工具行为测试
pnpm test:browser     # 表单、数据、导航、浮层、通知和业务组合的真实浏览器测试
pnpm build            # 构建组件库与类型声明
pnpm build:storybook  # 构建可独立托管的工作台
pnpm check            # 类型、测试、库构建、公开声明消费与工作台构建
```

`dist/` 是组件库产物，`storybook-static/` 是工作台产物。开发工具、stories 和测试文件不属于组件运行时入口。

首次运行浏览器测试前执行 `pnpm exec playwright install chromium`；Linux 如需系统依赖可加 `--with-deps`。测试会自动在 6007 端口启动独立 Storybook，不占用日常预览的 6006。CI 会安装浏览器，并在 `pnpm check` 后执行这批交互测试。

## 模块入口

当前包尚未发布到 npm，`package.json` 保持 `private: true`。以下导入方式用于构建后的本地安装包：

```ts
import { UiButton, UiInput, UiTable, UiPagination, UiDialog } from 'malang-ui';
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

```sh
pnpm add /实际路径/malang-ui-0.1.0.tgz vue@^3.5.0
# 可选，使用 motion / all 入口时安装
pnpm add gsap@^3.15.0
```

最小用法（Vue 单文件组件）：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { UiInput, UiButton } from 'malang-ui';
import 'malang-ui/style.css';
const name = ref('');
</script>

<template>
  <main data-ui-theme="dark" data-ui-density="comfortable">
    <UiInput v-model="name" label="项目名称" />
    <UiButton @click="name = ''">清空</UiButton>
  </main>
</template>
```

`style.css` 包含组件样式和 Token，应用导入一次即可。`data-ui-theme` 支持 `light/dark`，`data-ui-density` 支持 `comfortable/compact`；缺省采用浅色和舒适密度。容器可设置 `data-ui-motion="reduced"`，CSS 动效也默认遵循系统偏好。MG 控制器默认读取系统偏好；应用内减少动效开关需同步传入其 `reducedMotion` 选项。

这是 ESM 包，使用支持原生 `dialog.showModal()` 与 Popover API 的现代浏览器；不附带 polyfill。Popover / Tooltip 使用 `@floating-ui/dom` 定位，随普通依赖安装；基础组件入口不会加载 GSAP。SSR 导入不会访问浏览器全局，原生浮层在挂载后启用。

## 已有能力

| 模块 | 当前内容 |
| --- | --- |
| 动作与输入（7） | `UiButton`、`UiInput`、`UiTextarea`、`UiSelect`、`UiCheckbox`、`UiRadioGroup`、`UiSwitch` |
| 内容与数据（3） | `UiCard`、`UiTable`、`UiDivider` |
| 页面导航（3） | `UiTabs`、`UiPagination`、`UiBreadcrumb` |
| 浮层与说明（3） | `UiDialog`、`UiPopover`、`UiTooltip` |
| 状态与反馈（7） | `UiBadge`、`UiAlert`、`UiSpinner`、`UiSkeleton`、`UiEmpty`、`UiToast`、`UiToastViewport` |
| 工具 | `debounce`、`throttle`、`asyncLock` |
| 动效与 MG | 轨道构形与墨迹切面编排，支持播放、暂停、定位、重播与销毁 |
| Vue 适配 | `useReducedMotion`，以及示例中的生命周期清理 |
| 设计基础 | 明暗主题、密度、排版、间距与动效变量 |
| 开发工作台 | Storybook 的组件状态、组合界面和工具交互示例 |

防抖和节流提供 `cancel()`、`flush()`、`pending()`。`asyncLock()` 让并发调用共享同一个进行中的 Promise，并在成功或失败后释放。MG 控制器的 `seek()` 使用秒，`dispose()` 只清理当前实例。

## 组件使用约定

详细参数、可运行状态和插槽示例见各组件的 Storybook「文档」。公开 Props、选项和表格列类型从 `malang-ui` 导出。

`UiInput` / `UiTextarea` 使用字符串 `v-model`，支持 `label/hint/error/disabled`。`name/required/maxlength/autocomplete` 等原生属性与事件传给实际控件；中文组合输入期间保留未提交文本，结束后同步模型。Textarea 默认 4 行，可设置 `rows`。用可见 `label` 或 `aria-label` 为控件命名。

`UiCheckbox` 使用布尔 `v-model`，支持 `indeterminate`。`UiRadioGroup` 使用字符串 `v-model`、必填 `label` 和 `options`；每个选项提供唯一 `value`、`label`、可选 `disabled/description`，原生方向键会跳过禁用项。每个组默认独立的表单名称，传 `name` 时同一表单内保持唯一。

`UiSelect` 使用字符串 `v-model` 与 `options`（同 `UiChoiceOption`）；`placeholder` 提供不可选的空值提示。它保留原生单选下拉框与系统键盘行为，选项描述用于 RadioGroup。上述表单控件的禁用、错误、帮助信息和模型变化通过原生语义呈现；受控模型由父级决定是否接受更新。

`UiPagination` 使用数字 `v-model`、记录总量 `total` 和 `pageSize`（默认 10）。页码从 1 开始，提供首尾和当前页附近的有限按钮；记录减少时夹取显示页码，但不会主动改写父模型。业务列表应同时对其切片页码做校正。「业务组合工作台」展示筛选时重置页码的处理。

`UiBreadcrumb` 的 `items` 提供 `label` 和可选 `href`；祖先节点使用真实链接，最后一项始终是 `aria-current="page"` 的当前页面文本。适配路由时传入真实路径，或在应用层拦截导航。

`UiTable` 是语义化基础表格，必填 `caption`、`columns` 与 `rows`。列包含 `key/label` 与可选 `align`；行支持普通业务接口，`rowKey` 默认 `id`，没有键时使用索引。排序或更新列表应提供稳定且唯一的行键。`#cell-列key="{ row, value, column, index }"` 自定义单元格；`#loading`、`#empty` 自定义状态。默认只输出简单值，复杂内容通过插槽渲染。窄屏滚动限制在可键盘聚焦的表格区域内。当前不内置排序、选择、筛选或虚拟滚动，数据操作由调用方组合。

```vue
<UiTable :rows="projects" :columns="columns" caption="项目列表">
  <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
</UiTable>
```

`UiPopover` 使用布尔 `v-model`、必填 `label` 与可选 `triggerLabel/placement/disabled`。它自带触发按钮，`#trigger` 只放文字或图标；默认插槽读取 `{ close }`。键盘打开会聚焦内容，Escape、关闭按钮或外部点击可请求关闭；它是非模态浮层，不锁定背景或循环焦点。

`UiTooltip` 必填 `text` 与 `label`，自带可聚焦触发按钮，默认插槽只放文字或图标。悬停默认等待 300ms，聚焦立即出现，Escape 可关闭；`placement` 和 `delay` 可调整。提示只承载补充文本，需要按钮和表单时使用 Popover。

`UiBadge` 是静态状态标记。`UiAlert` 必填 `title`，可提供 `description`；默认静态且不自动播报，动态消息设置 `announce` 后，错误使用 alert，其余使用 status。两者的 `tone` 支持 `neutral/info/success/warning/error`。

`UiSpinner` 提供单一可访问加载名称（`label` 默认「加载中」），支持 `sm/md/lg`。`UiSkeleton` 是隐藏于辅助技术的装饰占位，`lines` 默认 3；两者减少动态效果时静止。`UiEmpty` 提供 `title/description` 和操作插槽，默认标题「暂无内容」。`UiDivider` 是语义分隔线，`label` 可加入可读说明。

`UiTabs` 使用 `v-model`、`items` 和必填的 `label`。每个 item 提供同组唯一的 `value`、`label` 与可选 `disabled`，同名插槽承载面板，默认插槽可读取 `{ item, active }`。面板切换时保留挂载；方向键、Home/End 会跳过禁用项。默认聚焦即激活，`activationMode="manual"` 改为回车或空格确认。传入值不可用时显示首个可用面板，兜底不会主动修改父模型；全禁用或空列表时不显示活动面板。

`UiDialog` 使用 `v-model`、必填的 `title` 与可选 `description`，`#footer="{ close }"` 提供自定义操作区。默认允许 Escape 关闭，点击遮罩保持打开；可通过 `closeOnEscape`、`closeOnBackdrop` 调整，关闭按钮始终可用。它基于原生 `dialog.showModal()`，面向支持该 API 的现代浏览器，未附带 polyfill。打开时背景不可交互并锁定滚动，关闭后恢复焦点；嵌套实例和卸载会清理各自的滚动锁。对话框保留原有 DOM 位置，因此可继承所在区域的主题与减少动态效果设置。

`UiCard` 默认渲染 `article` 与 `h3` 标题，支持 `as`、`headingTag`、`title`、`description` 和 `header/default/footer` 插槽。卡片本身保持静态，内部按钮、链接和表单各自操作；自定义头部接管标题与说明，必要时由调用方提供 `aria-labelledby`。

`UiToast` 使用 `v-model`、`title`、`description` 与 `variant`（`info/success/error`）。普通和成功消息默认显示 5000ms，错误消息默认持续显示；显式 `duration` 优先，`:duration="0"` 表示手动关闭。暂停原因可以叠加，全部解除后按剩余时间继续；消息替换会重新计时，每个实例独立清理。提示的播报区常驻，并与关闭按钮分开；同一消息由一个播报区负责，组合页保留的结果文字不重复自动播报。

`UiToastViewport` 管理通知布局，可放在应用主题容器内，通过 `placement="top-end"` 或 `bottom-end` 选择位置，`label` 提供通知区域名称。调用方管理消息列表与每条消息的 `v-model`，容器保留主题继承，不引入全局队列。

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

- 用基础版组件在自己的真实项目中验证，逐步形成独立文档与展示站。
- 根据首轮水墨科技样板继续优化颜色与细节，扩充笔画构形、切面展开、机械归位等 MG 场景。
- 按实际项目需求增加日期选择、树形结构、高级表格和更多场景组合。
- 保持工具、设计数据和编排规范可复用，后续增加 React 适配。

完整范围见 [design/roadmap.json](design/roadmap.json)，设计参考见 [design/skill-references.json](design/skill-references.json)。

## 许可证

[MIT](LICENSE)，保留仓库现有版权声明。
