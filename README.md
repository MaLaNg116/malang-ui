# malang-ui

一套以水墨与科技融合为视觉方向的前端组件库，包含 UI 组件、GSAP 动效、MG 编排和实用工具。首发使用 Vue 3 + TypeScript，先在自己的项目中验证，再逐步扩展与开源。

公开组件与对应能力由[逐项目录](design/component-parity.json)记录，另提供纯 TypeScript 工具、六套 Canvas / MG 编排和 DOM 错峰动效，共七个动效工厂。浅色提供宣纸朱砂、青瓷冷玉与绢素鎏金三种材质配色，深色保留浓墨；朱砂刻印独立于主题主色。

组件统一使用 **M 前缀**，例如 `MInput`、`MButton`、`MDrawer`；Vue 模板也可以写成 `<m-input>`、`<m-button>`、`<m-drawer>`。M 代表 MaLang，公开类型对应 `MInputProps` 等。当前私有验证阶段已统一迁移命名。

「开始 / 组件库展示首页」提供可跳过、可重播的品牌开场、能力索引和真实本地请求演练。等待只表示处理中；仅确认成功才触发落印，失败、取消和迟到响应不会伪装成完成。列表默认可读，显式重播时再错峰归位。

从 Storybook 的「开始 / 基础版使用指南」查看组件索引和接入方式；在「业务组合工作台」实际操作搜索、阶段筛选、重点项目过滤、分页、编辑、新建与保存通知。示例数据只保留在当前预览，不提交到服务器。

「开始 / 功夫朋克规范」将七项品质落实到真实组件样本；「开始 / 铸刃工坊」组合抽屉、菜单、折叠章节、步骤、进度与时间线，演示资料编辑、取消、异常重试和完成通知。该流程仅在本地计时演练，不执行构建或发布。

「开始 / 归印调校台」把搜索预设、数字与滑杆、可移除关键词和资料描述连接到真实的成功落印控制器。草稿在应用前保持独立，应用后可播放、暂停、定位与重播；减少动态效果直接呈现完成态。

「开始 / 藏品归档台」组合侧栏导航、目录树、日期选择与文件选择，演示本地素材登记、资料查看、移除和操作记录。目录焦点与选择分开，切换导航保留编辑草稿；附件不会自动发送到服务器。

「开始 / 档案发布台」把表单规则、分段筛选、图片组预览和可取消的异步确认接入同一份本页档案。登记成功后可核对大图，再确认归档；取消或过期校验不会提交结果。数据与等待均为本地演练，不执行服务器发布；见[组合示例源码](stories/ArchivePublisher.stories.ts)。

「开始 / 纸墨试色台」把三种浅色配色、深色、纸面层次、静态指标和页面结果放在同一个局部容器中。切色保留输入与选项；「记录并验印」保存本页实际方案并播放经纬织光，还原会清空本页草稿与记录。

「基础组件 / 交互语言」集中展示按钮、输入框与开关的轮廓、焦点和状态反馈。设计使用折锋边角、墨线焦点与方形滑锁，在明暗主题中保持一致，并保留原生输入、键盘与触屏操作。

「开始 / 导航与弹层」把 Tabs 和 Dialog 组合成一个可操作的工作空间：切换示例、用法与参数，打开编辑窗口，校验并保存设置，再回到原先的触发按钮。

工作空间现由 `MCard` 承载，保存后由 Toast 提供轻提示，结果文字仍会保留。提示不会抢走焦点；悬停、键盘聚焦或页面隐藏时会暂停计时。

## 本地开发

使用 Node.js 24 或更高版本、pnpm 11.25。

```sh
pnpm install
pnpm dev
```

打开终端输出中的 Storybook 地址。左侧目录可以查看组件状态、MG 编排和工具示例；顶部工具栏可以切换主题、浅色配色、密度与减少动态效果。

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

首次运行浏览器测试前执行 `pnpm exec playwright install chromium`；Linux 如需系统依赖可加 `--with-deps`。本地测试在 6007 启动独立 Storybook，不占日常预览的 6006。CI 在 `pnpm check` 后使用 Vite preview 托管刚生成的 `storybook-static`，验证实际构建产物；交互断言先等待工作台容器就绪。服务管理遵循 [Playwright webServer](https://playwright.dev/docs/test-webserver) 的启动与就绪配置。

## 模块入口

当前包尚未发布到 npm，`package.json` 保持 `private: true`。以下导入方式用于构建后的本地安装包：

```ts
import { MButton, MInput, MTable, MPagination, MDialog } from 'malang-ui';
import 'malang-ui/style.css';

// 纯工具入口不依赖 Vue 或 GSAP。
import { debounce, throttle, asyncLock } from 'malang-ui/utils';

// 动效入口单独使用 GSAP，消费方需要安装 gsap。
import { createInkSequence, createOrbitSequence, createSealSequence,
  createBrandSequence, createWaitingSequence, createWeaveSequence,
  createStaggerSequence } from 'malang-ui/motion';

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
import { MInput, MButton } from 'malang-ui';
import 'malang-ui/style.css';
const name = ref('');
</script>

<template>
  <main data-ui-theme="dark" data-ui-density="comfortable">
    <MInput v-model="name" label="项目名称" />
    <MButton @click="name = ''">清空</MButton>
  </main>
</template>
```

`style.css` 包含组件样式和 Token，应用导入一次即可。`data-ui-theme` 支持 `light/dark`，`data-ui-density` 支持 `comfortable/compact`；缺省采用宣纸浅色和舒适密度。浅色配色使用 `data-ui-palette="paper|celadon|gilt"`，依次对应宣纸朱砂、青瓷冷玉、绢素鎏金；主题和配色必须放在同一个容器上。深色使用浓墨，保留的 palette 值不改变深色配色。

```html
<main data-ui-theme="light" data-ui-palette="celadon">
  <!-- 此区域内的组件与 Canvas MG 继承同一套颜色 -->
</main>
```

底纸、浮纸与静层分别使用 `canvas/surface/surface-muted`；`secondary-soft`、`metal-soft` 提供副色与金属的柔和承托。`--ui-color-seal` 始终表达朱砂刻印，主色改为冷玉或鎏金时也保留独立含义。已创建的 Canvas MG 会观察同容器的主题和配色变化并重绘，无需为切色重建时间线。

状态使用独立语义色：`--ui-color-info` 的低饱和青灰表示信息与处理中，`--ui-color-success` 的青玉绿表示成功与完成，`--ui-color-warning` 的鎏金表示提醒，`--ui-color-danger` 的朱红表示错误。`--ui-color-focus` 使用低饱和青灰标记键盘与编辑焦点。品牌强调色 `--ui-color-accent` 随浅色配色使用朱砂、冷玉或鎏金，`seal` 表达刻印；状态通过各自的语义变量取色。

容器可设置 `data-ui-motion="reduced"`，CSS 动效也默认遵循系统偏好。MG 控制器默认读取系统偏好；应用内减少动效开关需同步传入其 `reducedMotion` 选项。

这是 ESM 包，使用支持原生 `dialog.showModal()` 与 Popover API 的现代浏览器；不附带 polyfill。Popover / Tooltip 使用 `@floating-ui/dom` 定位，随普通依赖安装；基础组件入口不会加载 GSAP。SSR 导入不会访问浏览器全局，原生浮层在挂载后启用。

## 已有能力

| 模块 | 当前内容 |
| --- | --- |
| 表单验证 | `MForm`、`MFormItem`、`MFormList` |
| 动作与输入 | `MButton`、`MSegmented`、`MInput`、`MInputNumber`、`MSlider`、`MCombobox`、`MAutoComplete`、`MUpload`、`MTextarea`、`MSelect`、`MCheckbox`、`MCheckboxGroup`、`MRadio`、`MRadioGroup`、`MSwitch` |
| 日期与时间 | `MDatePicker`、`MDateRangePicker`、`MDateTimePicker`、`MDatePickerPanel`、`MTimePicker`、`MTimeSelect`、`MCalendar` |
| 复合输入 | `MCascader`、`MTreeSelect`、`MColorPicker`、`MColorPickerPanel`、`MRate`、`MTransfer`、`MInputOTP`、`MInputTag`、`MMention` |
| 内容与数据 | `MCard`、`MTable`、`MDivider`、`MTag`、`MAvatar`、`MImage`、`MDescriptions`、`MStatistic`、`MQRCode` |
| 列表与窗口化 | `MList`、`MListy`、`MVirtualList`、`MVirtualTable`、`MVirtualTree`、`MVirtualSelect`、`MInfiniteScroll`、`MScrollbar` |
| 页面导航 | `MTabs`、`MPagination`、`MBreadcrumb`、`MMenu`、`MTree`、`MBackTop`、`MAnchor`、`MAffix`、`MPageHeader`、`MFloatButton`、`MFloatButtonGroup` |
| 页面布局 | `MSpace`、`MGrid`、`MGridItem`、`MFlex`、`MLayout`、`MSplitter`、`MMasonry` |
| 展示与引导 | `MCarousel`、`MTour`、`MWatermark`、`MBorderBeam` |
| 排版与图标 | `MTypography`、`MText`、`MLink`、`MIcon` |
| 浮层与说明 | `MDialog`、`MPopover`、`MTooltip` |
| 状态与反馈 | `MBadge`、`MAlert`、`MResult`、`MSpinner`、`MSkeleton`、`MEmpty`、`MMessage`、`MPopconfirm`、`MToast`、`MToastViewport`、`MLoading`、`MMessageBox` |
| 二级流程 | `MDrawer`、`MDropdownMenu`、`MAccordion`、`MSteps`、`MProgress`、`MTimeline` |
| 配置与服务 | `MConfigProvider`、`MApp`、`useMConfig`、`useMApp`、`vMLoading`、`createMLoading` |
| 工具 | `debounce`、`throttle`、`asyncLock`、`MGetProps`、`MGetProp`、`MGetRef` |
| 动效与 MG | 六套 Canvas：轨道构形、墨迹切面、成功落印、品牌开场、双轨等待、经纬织光；另有 DOM 错峰，均提供可控生命周期 |
| Vue 适配 | `useReducedMotion`，以及示例中的生命周期清理 |
| 设计基础 | 三种浅色材质配色、浓墨深色、密度、排版、间距与动效变量 |
| 开发工作台 | Storybook 的组件状态、组合界面和工具交互示例 |

防抖和节流提供 `cancel()`、`flush()`、`pending()`。`asyncLock()` 让并发调用共享同一个进行中的 Promise，并在成功或失败后释放。MG 控制器的 `seek()` 使用秒，`dispose()` 只清理当前实例。

## 组件使用约定

详细参数、可运行状态和插槽示例见各组件的 Storybook「文档」。公开 Props、选项和表格列类型从 `malang-ui` 导出。

`MInput` 与 `<m-input>` 都对应同一个公开组件。CSS 类 `ui-*` 和变量 `--ui-*` 继续作为现有主题契约；组件引用使用 `M`，不需要更改已有主题变量。

`MInput` / `MTextarea` 使用字符串 `v-model`，支持 `label/hint/error/disabled`。`name/required/maxlength/autocomplete` 等原生属性与事件传给实际控件；中文组合输入期间保留未提交文本，结束后同步模型。Textarea 默认 4 行，可设置 `rows`。用可见 `label` 或 `aria-label` 为控件命名。

`MCheckbox` 使用布尔 `v-model`，支持 `indeterminate`。`MRadioGroup` 使用字符串 `v-model`、必填 `label` 和 `options`；每个选项提供唯一 `value`、`label`、可选 `disabled/description`，原生方向键会跳过禁用项。每个组默认独立的表单名称，传 `name` 时同一表单内保持唯一。

`MSegmented` 将同一组选择放进机械滑轨，必填字符串 `v-model`、`label` 与 `options: readonly MChoiceOption[]`。它使用原生 `fieldset/legend/radio`，提供 `name`、`disabled`、`size="sm|md|lg"`（默认 `md`）、`block` 与 `orientation="horizontal|vertical"`（默认横向）；原生 `required/form` 作用于每个单选控件。方向键跳过禁用项，左右遵循实际阅读方向，空格选择；描述通过辅助说明关联。滑块随标签、字体与容器尺寸更新，超长内容自然折行，必要滚动留在轨道内。父级拒绝更新后仍可重试，未匹配的模型保持无选中。原生表单 reset 后恢复当前父模型；需要恢复初值或清空时，父页面应明确更新模型。分段选择表达单值，不使用 Tabs 的面板语义。

`MForm` 使用真实 `form`，接收受控 `model` 与按字段名组织的 `rules: MFormRules`；默认 `label="表单"`、`validateOn="submit"`、`showSummary=true`、`disabled=false`。`validateOn` 还支持 `blur/change`。`MFormItem` 的 `name/label` 必填，可传 `hint/required/disabled`；它注册字段并通过 `#default="{ field, error, validating }"` 提供绑定。将 `field` 显式传给一个控件，同时自行绑定其 `v-model`：`field` 包含 `id/name/label/hint/error/required/disabled/onBlur`，不会自动查找或改写子组件。

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import { MButton, MForm, MFormItem, MInput, MTextarea } from 'malang-ui';
import type { MFormModel, MFormRules } from 'malang-ui';
import 'malang-ui/style.css';

const model = reactive({ title: '', note: '' });
const rules: MFormRules = {
  title: [{ required: true, message: '请填写作品名称。' }, { max: 40 }],
};
function save(values: MFormModel) { console.log(values.title); }
function restore(initial: MFormModel) { Object.assign(model, initial); }
</script>

<template>
  <MForm :model="model" :rules="rules" label="作品登记"
    @submit="save" @reset="restore" v-slot="{ validating }">
    <MFormItem name="title" label="作品名称" v-slot="{ field }">
      <MInput v-model="model.title" v-bind="field" />
    </MFormItem>
    <MFormItem name="note" label="作品说明" v-slot="{ field }">
      <MTextarea v-model="model.note" v-bind="field" />
    </MFormItem>
    <MButton type="submit" :loading="validating">核对并登记</MButton>
    <MButton type="reset" variant="secondary">恢复初始资料</MButton>
  </MForm>
</template>
```

规则支持 `required/min/max/pattern/message` 与 `validator(value, modelSnapshot, signal)`。`min/max` 检查数值本身或字符串、数组长度；校验器可返回 `void/true`、表示未通过的 `false` 或错误文字，也可返回 Promise。模型变化、新一轮校验、重置或卸载会取消旧校验结果；异步请求应把 `signal` 继续传给支持取消的操作。跨字段规则从第二个参数读取本轮模型快照。注册字段还会合并对应原生控件的 `validity`，提交失败聚焦首个错误，摘要按钮可回到字段。

`MForm` 只校验已注册的 `MFormItem`；`name="title"` 对应 `model.title`，也支持 `user.name`、`members[0].name` 与 `members.0.name` 嵌套路径；同名字面平铺键优先，兼容已有模型。规则可写 `members.*.name`。`MFormList` 接收数组 `v-model`、`name`、可选 `itemKey/min/max/disabled`，通过插槽提供稳定 `fields` 与 `add/remove/move`；`field.name` 可直接组成 `MFormItem` 路径。`submit(modelCopy, SubmitEvent)` 提交模型副本，`invalid(errors)` 报告错误；它不代替 `FormData` 或网络请求。`reset(initialModel)` 发出挂载时的初始模型快照并清除校验，由父级决定是否接受，组件不会直接修改 `model`。实例公开 `validate(names?)`（返回 `{ valid, errors, cancelled }` 的 Promise）、`clearValidation(names?)`、`reset()` 与 `focusField(name)`；默认插槽也提供 `{ errors, validating, validate, reset }`。自定义控件需自行转发 `field` 的标签、错误、原生属性与失焦事件。

`MSelect` 单选使用字符串 `v-model` 与 `options`（同 `MChoiceOption`）；`placeholder` 提供不可选的空值提示。设置 `multiple` 后使用数组 `v-model:selectedValues`，提交同名的多项 FormData。两种模式都保留原生 select 与系统键盘行为。上述表单控件的禁用、错误、帮助信息和模型变化通过原生语义呈现；受控模型由父级决定是否接受更新。

`MInputNumber` 使用 `number | null` 模型，清空表示 `null`；`min/max/step` 作用于原生数字控件和增减拨片。输入不会发出 `NaN`，组合输入保留草稿，失焦时规范化格式与边界。手输不强制四舍五入到步长，原生 `stepMismatch` 仍参与表单验证；`readonly` 同时阻止拨片，`name/required/form` 等属性提交到原生输入框。

`MSlider` 使用数字 `v-model`，默认 `0–100`、步长 `1`，保留原生 range 的键盘、触屏和表单行为。显示值按范围和步长对齐，范围变化不会擅自改写父模型；`showValue` 可关闭可见数值。与可清空的数字输入联动时，使用 `computed` 的 get/set 桥接空值，示例见归印调校台。

```ts
import { computed, ref } from 'vue';

const amount = ref<number | null>(1);
const sliderAmount = computed({
  get: () => amount.value ?? 1,
  set: (value: number) => { amount.value = value; },
});
```

`MCombobox` 是本地过滤的单选搜索控件，`modelValue` 始终是已选选项的 `value`；自由输入只作为查询，不自动创建选项。使用非空且组内唯一的选项 value，空字符串表示未选择。通过 `MChoiceOption` 提供候选，方向键浏览、Enter 选择、Escape 放弃查询、Tab 离开；中文组合输入不会抢选。`name/form` 提交真实选值，`required` 校验真实候选和未确认查询；`readonly` 阻止打开与清空，`clearable` 默认开启。

`MTag` 表达关键词和分类，支持 `MStatusTone` 的语义色；`closable` 发出 `close(MouseEvent)` 请求，父级决定是否移除并安排后续焦点。`closeLabel` 命名具体关闭操作，默认说明会关联标签文字；关闭按钮在触屏上提供 44px 操作区。

`MAvatar` 的 `alt` 必填，提供单一的图像名称；相邻文字已经表达身份时可传空字符串，作为装饰。`name` 提供最多两个字素的缩略，图片加载或失败时保留文字回退，更换 `src` 后重新尝试。`size` 支持 `sm/md/lg`，`tone` 支持 `ink/seal/jade`。

`MImage` 必填 `src/alt`，默认 `fit="cover"`、`loading="lazy"`、`preview=true`；`fit` 支持原生五种 `object-fit`。空 `alt` 表示装饰图，内容图片应给出实际说明。它提供载入占位、失败重试和换源隔离；`class/style` 作用于外框，其余原生图片属性传给缩略图，正数 `width/height` 同时确定外框尺寸比例。`load(Event)`、`error(Event)` 对应缩略图，原图另行管理加载与失败状态。

载入完成后，预览按钮打开原生模态 Dialog；`previewSources: readonly string[]` 提供 URL 列表，`initialIndex` 为从 0 开始的初始索引，省略时优先定位当前 `src`。上一张/下一张与左右方向键在列表边界停止，缩放支持 1–3 倍，图片区独立滚动，Escape 关闭并回到安全的触发位置。打开或切换预览时发出 `preview-change(index, src)`。URL 列表不包含逐图说明，其他 URL 使用「图片组第 N 张」的名称；需要每张图片各自的 `alt` 时，用多个 `MImage` 构成画廊，示例见 Image / Gallery。

`MDescriptions` 使用原生 `dl/dt/dd` 展示资料，必填 `label/items`；条目包含唯一 `key`、`label`、可选简单值 `value` 和跨列 `span`。`columns` 支持 1–3 列，窄屏自动单列；复杂内容通过同名插槽 `{ item }` 渲染，无资料时有明确空说明。

`MStatistic` 用原生 `dl/dt/dd` 展示静态指标，必填 `label`，`value` 接收数值或已格式化字符串。`prefix/suffix/unit/description` 补充读数；`tone` 使用现有语义色。`null`、空字符串与非有限数值显示 `placeholder`（默认 `—`），省略前后缀与单位，数值 `0` 保留。格式化由应用负责，组件不自动跳数或播报。

`MPagination` 使用数字 `v-model`、记录总量 `total` 和 `pageSize`（默认 10）。页码从 1 开始，提供首尾和当前页附近的有限按钮；记录减少时夹取显示页码，但不会主动改写父模型。业务列表应同时对其切片页码做校正。「业务组合工作台」展示筛选时重置页码的处理。

`MBreadcrumb` 的 `items` 提供 `label` 和可选 `href`；祖先节点使用真实链接，最后一项始终是 `aria-current="page"` 的当前页面文本。适配路由时传入真实路径，或在应用层拦截导航。

`MSpace` 统一安排子项间距，支持 `direction="horizontal|vertical"`、`align`、`wrap` 与 `inline`。`size` 使用 `sm/md/lg` 或非负像素数值，`0` 有效；不增加子项包装与额外语义，适合按钮组、工具条与纵向控件组合。

`MBackTop` 在滚动超过 `visibilityHeight`（默认 400px）时显示 44px 原生返回按钮。默认滚动当前文档，也可通过 `target` 传入元素或返回元素的 getter；显式空目标不会操作文档。`label` 提供名称，`behavior` 支持 `smooth/instant`，系统或祖先容器减少动效时使用即时回顶。键盘操作后保留按钮焦点，离焦后再隐藏；`class/style` 传给按钮，可调整浮动位置或置于自定义容器。

`MTable` 是语义化基础表格，必填 `caption`、`columns` 与 `rows`。列包含 `key/label` 与可选 `align`；行支持普通业务接口，`rowKey` 默认 `id`，没有键时使用索引。排序或更新列表应提供稳定且唯一的行键。`#cell-列key="{ row, value, column, index }"` 自定义单元格；`#loading`、`#empty` 自定义状态。默认只输出简单值，复杂内容通过插槽渲染。窄屏滚动限制在可键盘聚焦的表格区域内。当前不内置排序、选择、筛选或虚拟滚动，数据操作由调用方组合。

```vue
<MTable :rows="projects" :columns="columns" caption="项目列表">
  <template #cell-name="{ row }"><strong>{{ row.name }}</strong></template>
</MTable>
```

`MPopover` 使用布尔 `v-model`、必填 `label` 与可选 `triggerLabel/placement/disabled`。它自带触发按钮，`#trigger` 只放文字或图标；默认插槽读取 `{ close }`。键盘打开会聚焦内容，Escape、关闭按钮或外部点击可请求关闭；它是非模态浮层，不锁定背景或循环焦点。

`MPopconfirm` 提供专用的非模态确认气泡，必填布尔 `v-model` 与 `title`，支持 `description/triggerLabel/confirmText/cancelText/placement/disabled/danger`。确认、取消文字默认「确认 / 取消」，默认向上定位并自动避让；`#trigger` 只放文字或图标，组件自带原生触发按钮。键盘开启时先聚焦取消；Tab 可离开，Escape 与外部点击可取消，外部焦点不会被拉回。`danger` 只改变危险确认动作的语义色。

异步守卫使用 `beforeConfirm(signal): void | boolean | Promise<void | boolean>`：返回 `false` 保留气泡；抛出或拒绝会显示错误并发出 `confirm-error(error)`，可以原处重试。等待期间合并重复确认，取消仍可操作；取消、关闭、禁用或卸载会中止本轮信号，并忽略不响应信号的迟到结果。仅守卫通过后发出 `confirm(MouseEvent)` 并请求关闭，业务结果在该事件中更新；`cancel(event?)` 报告用户退出，`update:modelValue` 的最终接受与否仍由父级决定。

```vue
<MPopconfirm v-model="confirmOpen" title="确认归档这份卷宗？"
  trigger-label="归档卷宗" confirm-text="确认归档" cancel-text="保留草稿"
  :before-confirm="verifyArchive" @confirm="archive" @confirm-error="showError">
  <template #trigger>归档本页卷宗</template>
</MPopconfirm>
```

其中 `verifyArchive` 接收 `AbortSignal` 并返回上述守卫结果；`archive` 更新已确认的业务状态。`AsyncConfirmation` Story 与档案发布台提供完整的取消、失败和迟到响应处理。

`MTooltip` 必填 `text` 与 `label`，自带可聚焦触发按钮，默认插槽只放文字或图标。悬停默认等待 300ms，聚焦立即出现，Escape 可关闭；`placement` 和 `delay` 可调整。提示只承载补充文本，需要按钮和表单时使用 Popover。

`MBadge` 是静态状态标记。`MAlert` 必填 `title`，可提供 `description`；默认静态且不自动播报，动态消息设置 `announce` 后，错误使用 alert，其余使用 status。两者的 `tone` 支持 `neutral/info/success/warning/error`。

`MSpinner` 提供单一可访问加载名称（`label` 默认「加载中」），支持 `sm/md/lg`，对应 16/24/32 px。四枚轻折角在舒展、强展与回收之间连续离合；外轨以三拍变速完成三圈，平均每圈 1.8 秒，双楔内芯持续反转。不同段落的转速平滑衔接，保留轻细线条与更明显的伸缩。默认外轨与内芯分别使用主题主色和副色；宣纸与浓墨保留朱砂、青玉搭配，`MButton loading` 复用同一图形并继承按钮文字颜色，将装饰加载图形隐藏于辅助技术。`MSkeleton` 用固定纹理的细密雪花形成装饰占位，稀疏的 1px 水平短断片以低对比平滑浮现与退去，底色保持稳定；组件隐藏于辅助技术，`lines` 默认 3。两者在系统或容器减少动态效果与强制颜色模式下保留静态形态。`MEmpty` 提供 `title/description` 和操作插槽，默认标题「暂无内容」。`MDivider` 是语义分隔线，`label` 可加入可读说明。

`MResult` 是页面级结果面板，必填 `title`，可设置 `description`、`status="success|error|warning|info"` 和 `headingTag="h1|h2|h3"`（默认 `h2`）。默认静态且不搬移焦点；`default` 补充业务内容，`footer` 放原生按钮或链接。显式 `announce` 仅让标题与描述的消息区播报：错误用 assertive alert，其余用 polite status，补充内容和动作保持独立。组件参数和场景在「二级组件 / Result 结果面板」中查看。

`MTabs` 使用 `v-model`、`items` 和必填的 `label`。每个 item 提供同组唯一的 `value`、`label` 与可选 `disabled`，同名插槽承载面板，默认插槽可读取 `{ item, active }`。面板切换时保留挂载；方向键、Home/End 会跳过禁用项。默认聚焦即激活，`activationMode="manual"` 改为回车或空格确认。传入值不可用时显示首个可用面板，兜底不会主动修改父模型；全禁用或空列表时不显示活动面板。

`MDialog` 使用 `v-model`、必填的 `title` 与可选 `description`，`#footer="{ close }"` 提供自定义操作区。默认允许 Escape 关闭，点击遮罩保持打开；可通过 `closeOnEscape`、`closeOnBackdrop` 调整，关闭按钮始终可用。它基于原生 `dialog.showModal()`，面向支持该 API 的现代浏览器，未附带 polyfill。打开时背景不可交互并锁定滚动，关闭后恢复焦点；嵌套实例和卸载会清理各自的滚动锁。对话框保留原有 DOM 位置，因此可继承所在区域的主题与减少动态效果设置。

`MCard` 默认渲染 `article` 与 `h3` 标题，支持 `as`、`headingTag`、`title`、`description` 和 `header/default/footer` 插槽。卡片本身保持静态，内部按钮、链接和表单各自操作；自定义头部接管标题与说明，必要时由调用方提供 `aria-labelledby`。

`MToast` 使用 `v-model`、`title`、`description` 与 `variant`（`info/success/warning/error/loading`）。`presentation="message"` 提供轻量单句反馈，普通和成功消息默认 3000ms；默认的 `notification` 模式保留标题与详情卡片，普通和成功消息默认 5000ms。错误消息默认持续显示；显式 `duration` 优先，`:duration="0"` 表示持续显示。`closable` 默认开启，轻提示可显式关闭它。悬停、聚焦与页面隐藏暂停计时，原因可以叠加，全部解除后按剩余时间继续；消息替换会重新计时，每个实例独立清理。形态切换不重新播报相同消息。

`MMessage` 是「反馈组件 / Message 全局提示」的独立入口：`v-model` 控制显示，`content` 提供单句内容，`type` 支持 `info/success/warning/error/loading`。默认顶部居中、偏移 `8px`、`duration=3000`、无关闭按钮；`:duration="0"` 持续显示，适合等待实际操作完成后再切换成功或错误。`closable`、`closeLabel`、`offset` 和通知区域 `label` 可配置。可见提示继承主题，悬停、聚焦与页面隐藏暂停剩余计时，自动关闭不移动编辑焦点。

```vue
<MMessage v-model="saved" content="已保存" type="success" />
<MMessage v-model="saving" content="正在保存" type="loading" :duration="0" />
```

这种顶部轻反馈的用途参考 [Ant Design Message](https://ant.design/components/message/) 与 [Element Plus Message](https://element-plus.org/en-US/component/message.html)，视觉继续使用本库的纸墨与短折角。调用方管理状态，组件不创建全局单例。

`MToastViewport` 管理通知布局，`placement` 支持 `top-start/top-center/top-end/bottom-start/bottom-center/bottom-end`，默认 `bottom-end`；起始侧与末尾侧跟随阅读方向，居中位置保留安全区和窄屏宽度。`label` 提供通知区域名称。调用方管理消息列表与每条消息的 `v-model`，容器保留主题继承，不引入全局队列。Toast 的 `TopCenter` 和 `Positions` 示例分别演示顶部居中，以及六个落点、RTL 与编辑焦点。

## 二级流程组件

| 组件 | 主要接口与行为 |
| --- | --- |
| `MDrawer` | 复用 `MDialog` 的 `v-model/title/description/closeOnEscape/closeOnBackdrop`；`side` 为 `left/right/bottom`，`size` 为 `sm/md/lg`。正文独立滚动，footer 接收 `{ close }`，原生模态与焦点策略保持一致。 |
| `MDropdownMenu` | 必填 `v-model/items/label`，`select` 事件给出操作的 `value`。操作项提供 `value/label/disabled/danger/shortcut`；分隔项为 `{ type: 'separator', key }`。方向键、Home/End、字符搜索与原生按钮激活，Tab 离开菜单。`shortcut` 仅显示说明，不注册全局快捷键。 |
| `MAccordion` | `v-model` 为字符串数组，`items` 提供 `value/label/description/disabled`，必填 `label`。默认单展开，`multiple` 允许多展开；无效值只影响显示兜底，不主动改写父模型。面板隐藏时保留挂载，命名插槽接收 `{ item, expanded }`。 |
| `MSteps` | 必填 `v-model/items/label`，按顺序表达完成、当前与待办。默认静态；`interactive` 允许原生按钮请求更新，禁用项不能激活。`orientation` 与 `status` 分别控制方向和当前步骤的 `process/error/success` 状态。 |
| `MProgress` | 必填 `label`；`value/max` 默认 `0/100`，数值夹取到有效范围。`status` 为 `default/success/error`，分别使用信息、成功与错误色；成功和错误有可见图形标记，`showValue` 仅控制可见百分比。`indeterminate` 省略当前数值，错误时的 `aria-valuetext` 为「处理出错，进度未知」。每次进度不自动播报，业务层负责完成通知。 |
| `MTimeline` | 必填 `items/label`，条目提供唯一 `value`、`title` 与可选 `description/time/datetime/status`。顺序由调用方决定；`time` 使用原生 `time` 元素，`datetime` 可提供机器可读时间。命名内容插槽保留原生操作；无记录时呈现空状态。 |

## 日期、附件与目录

`MDatePicker` 使用字符串 `v-model`（空字符串或 `YYYY-MM-DD`）与必填 `label`。首版提供公历单日期、周一开始的历盘，支持 `min/max/clearable`；年份为 `0001–9999`，日期不经时区转换。文本草稿与已确认模型独立，完整合法日期在确认或离开时请求更新，非法和越界草稿保留供修改并阻止表单验证通过。中文组合输入期间不提交。`name/form/required/readonly/disabled` 保持原生表单行为，提交规范日期。

历盘使用非模态区域与网格；打开后可用方向键、Home/End、PageUp/Down 浏览，Shift + PageUp/Down 切年，Enter 或空格选择。焦点与选中日期分别呈现，Escape 返回输入，Tab 可正常离开。边界含端点；非法边界或反向范围会显示配置错误并禁止选择，外部无效模型不会被静默改写。

`MUpload` 使用 `readonly File[]` 模型和必填 `label`。单选替换，多选追加；`accept/maxCount/maxSize` 分别约束本地文件类型、数量和每个文件的字节数。选择与拖放共用校验，合法文件可部分接受；`reject` 事件返回 `MUploadRejection[]`，原因为 `type/size/count/duplicate`，重复判定依据文件元数据。`accept` 是客户端选择约束，正式应用仍需按自己的保存流程验证文件。

附件由真实 file input 承载，`name/form/required` 对应真实 File 对象；只读保留已选文件的提交，禁用时不提交。取消选择保留原内容；父级可拒绝添加和移除请求。未配置远端时只管理本地选择；设置 `action`（或 `url`）后通过 XMLHttpRequest 上传，支持 `method/headers/data/withCredentials/fieldName`、原生上传进度、失败重试与取消。`customRequest` 可接入业务请求；`autoUpload=false` 时调用实例的 `submit()`，`retry()/abort()` 控制单个文件或队列。移除、卸载和真实请求配置变化会取消对应请求，过期回调不覆盖新状态。长文件名换行，移除被接受后将焦点交给相邻项或选择入口。

`MMenu` 使用 `v-model`（`string | null`）、`v-model:expandedValues`、`items` 和 `label`。条目包含全局唯一 `value`、`label` 与可选 `href/disabled/children`；带子项的节点作为展开分组，其 `href` 不参与导航。它使用原生导航链接和按钮，保留 Tab 顺序与修改键、新标签页操作；普通激活才请求当前项更新。`select(value, event)` 提供原始鼠标事件，路由适配可在调用方阻止默认导航。命令操作继续使用 `MDropdownMenu`。

`MTree` 使用同样的两个受控模型、`items` 和 `label`，节点为递归的 `MTreeNode`。`multiple` 配合 `v-model:selectedValues` 提供多选；`checkable` 配合 `v-model:checkedValues` 提供父子联动勾选与半选，`checkStrictly` 可切换独立勾选。方向键和 Home/End 移动焦点，Enter 选择，空格在复选模式下勾选、其他模式下选择；右键展开或进入子级，左键收起或返回父级，字符前缀可定位节点。仅一个节点进入 Tab 顺序；禁用节点阻断批量勾选，启用的后代仍可独立操作。外部父节点勾选值只做显示投影，用户操作后输出归一后的已选节点；删除、重排与外部收起不清洗父模型或抢走组件外的焦点。大数据窗口渲染使用独立的 `MVirtualTree`。

交互语义参考 [W3C 菜单按钮模式](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) 与 [折叠面板模式](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)。视觉与验收约定见 [design/quality-contract.json](design/quality-contract.json)。

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

设计变量以 [design/tokens.json](design/tokens.json) 为真源，通过 `pnpm tokens` 更新生成的 CSS。样板使用同一套变量；主题、浅色配色与减少动态效果可在 Storybook 顶部切换。

配色回归针对实际使用的常用不透明前景与背景：普通文字检查至少 4.5:1，识别控件所需的边界与焦点标记检查相邻颜色至少 3:1。按设计变量中的不透明 sRGB 颜色计算相对亮度，在浏览器中核对配色落地；临界值不四舍五入。加载占位的装饰纹理另做视觉与减少动效检查。方法参考 [W3C 文字对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[G18 相对亮度计算与测试](https://www.w3.org/WAI/WCAG22/Techniques/general/G18) 和 [W3C 非文字对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)。这些检查只覆盖选定配色对；接入页面仍需验证完整状态、结构与辅助技术体验。

`createInkSequence(canvas, options)` 是独立的五秒 MG 编排，按「蓄势、疾出、收锋、归位」组织墨迹与几何切面。控制器默认不自动播放；使用 `play()`、`pause()`、`seek(seconds)`、`replay()` 与 `dispose()` 控制。默认遵循系统减少动态效果偏好，此时播放直接显示落印状态；仍可使用 `seek()` 静态查看各阶段。实例会在页面隐藏时暂停，卸载时应调用 `dispose()`。

`createSealSequence(canvas, options)` 提供 3.6 秒「蓄印、合轨、落印、回响」编排，四向机械夹具、缓存朱砂印面与干墨纹共同形成“成章”终态。默认手动播放；减少动态效果在创建时直接显示终态，仍可通过 `seek()` 静态看各阶段。`amplitude` 为 0.6–1.8，`speed` 为有限正数；定位仍以编排秒数为单位。控制器独立处理页面隐藏、BFCache、DPR、字体与主题变化，销毁一枚印记不会清理其他实例。

`createBrandSequence(canvas, options)` 提供 4.8 秒「聚轨、刻骨、显字、归定」开场，终态清晰呈现 MALANG UI。默认暂停；展示首页自行决定首次播放，正文和导航始终可用。跳过使用 `pause(); seek(controller.duration)`，重播使用 `replay()`；减少动态效果直接呈现完整字标。选项与成功落印同样提供 `amplitude/speed/reducedMotion/colors/onUpdate`。

`createWaitingSequence(canvas, options)` 提供 2.8 秒双轨等待，默认暂停、`loop: true`。`time/progress` 只表示动画周期位置，`cycle` 记录自然跨周期次数，均不代表业务进度。`seek()` 会暂停，包含精确周期终点；从末尾播放或重播开始新一轮。`loop: false` 只运行一周期，终态仍是等待姿态。减少动态效果显示 1.4 秒的静态轨道，不循环、不自动宣告成功；播放偏好恢复后也不自动续播。

`createWeaveSequence(canvas, options)` 提供 4.2 秒「铺经、穿纬、织光、归序」有限编排。开放的经纬丝面承载主副色微光，朱砂刻痕读取独立的 `seal` 颜色。默认暂停，支持 `amplitude/speed/reducedMotion/colors/onUpdate`，`seek()` 使用秒；减少动态效果显示完整静态织印，仍可手动定位。纸墨试色台切换配色时保留当前定位，显式记录后再 `replay()`；组件卸载时调用 `dispose()`。

业务调用方管理真实请求结果：发起后播放 Waiting，确认成功后停止 Waiting 并播放 Seal；失败、取消与过期响应不触发落印。稳定 DOM 文案负责状态语义，`aria-busy` 表示等待，不逐帧播报。六套 Canvas 编排都支持独立 DPR、主题、配色、字体、页面可见性和 BFCache 生命周期；卸载时调用各自的 `dispose()`。

`createStaggerSequence(elements, options)` 面向同一 document 中已挂载的专属 DOM 容器，目标去重后固定顺序。`duration` 默认为每项 0.42 秒，`stagger` 为 0.08 秒，`distance` 为 18px；`direction` 支持 `up/down/left/right`，`speed` 控制播放倍率。控制器的 `duration` 是整条编排长度，定位仍用未乘倍率的秒数。空列表返回零时长的稳定控制器。

创建时内容保持原样可读，首次播放、重播或显式定位才应用入场状态。它只管理自己的位移与 opacity，不修改 `visibility/aria-hidden/tabindex`；焦点进入目标时立即归位并暂停。减少动态效果或页面隐藏也会收束为可读终态。目标的 transform/opacity 交由这一实例独占，业务自身的变换放在内层；重叠实例会被拒绝，销毁归还自己的样式并释放监听。列表变更后在 Vue `nextTick` 中销毁并重新创建。错峰与样式恢复参考 [GSAP Staggers](https://gsap.com/resources/getting-started/Staggers/) 和 [GSAP revert](https://gsap.com/docs/v3/GSAP/Timeline/revert()/)。

## 组件覆盖对照

「开始 / 组件覆盖对照」按能力搜索和筛选，映射本库组件与 [Ant Design 目录](https://ant.design/components/overview/)、[Element Plus 目录](https://element-plus.org/en-US/component/overview.html)。[design/component-coverage.json](design/component-coverage.json) 保存 2026-11-05 的版本快照：[Ant Design 6.7.0](https://github.com/ant-design/ant-design/releases/tag/6.7.0)、[Element Plus 2.14.7](https://github.com/element-plus/element-plus/releases/tag/2.14.7)，归并为 29 类能力，并保留 155 条官方组件逐项记录。记录同时标明基础支持、可组合与缺项，组件数量与目录条数不能直接视为覆盖比例。

本轮按两份正式核心目录逐项补实现与核心交互，覆盖二维码、颜色/时间/日期/层级输入、虚拟列表/表格/树/选择器、布局与导航、排版、轮播/引导/水印、配置与反馈服务。对应实现、来源文件、核心验收内容与当前验证阶段见[design/component-parity.json](design/component-parity.json)。Border/Color属于设计参考，Util属于类型工具；外部Pro、X、Mobile等独立产品不计入核心目录。组件采用MaLang公开API，不承诺第三方所有属性名兼容。不得把实现数量当作已经完成全部验证的证明。

## 滚动条、配色与新增能力

`MScrollbar` 使用原生滚动内容和独立双轴细轨，支持拖动、轨道点击、方向键/PageUp/PageDown/Home/End、RTL、动态内容与强制颜色回退。`height/maxHeight` 接收数字或CSS长度，`viewportClass` 指定实际滚动元素；实例提供 `viewport/scrollTo/update`。无溢出时不增加无用Tab停靠点，Message、Dialog与Drawer的长内容复用它。其余原生滚动区域使用限定在`ui-*`上的轻量皮肤，可通过`--ui-scrollbar-thumb/active/track`覆盖。

配色复核参考高星设计技能中的暖中性色、灰绿/象牙白与暖金关系，具体取舍见[design/palette-review.json](design/palette-review.json)。仅将宣纸和青瓷浮层底调整为带少量材质倾向的白色，保留朱砂/青玉品牌双色与独立状态语义；滚动条使用金属灰与青灰，避免与错误状态混淆。

`MQRCode` 编码真实UTF-8文本，支持SVG/Canvas、四档纠错、受限中心图标、至少4模块静区、`active/loading/expired/scanned`状态与`refresh`事件。实例`toDataURL('svg'|'png')/download(filename,format)`返回可导出的图像；颜色使用不透明六位HEX并检查对比度。编码/图标读取失败通过`error`报告，外部图标导出需允许跨域读取。默认固定高对比浅色码体，主题装饰位于静区之外。

`MConfigProvider` 的`theme/palette/density/motion/locale/dir/messages`配置在子树内继承；`useMConfig()`提供响应式配置和文案。`MApp` 为后代`useMApp()`提供独立的`message/notification/messageBox/alert/confirm/prompt/destroyAll`，不建立进程级全局队列。Message支持同key更新和返回句柄`update/close`，MessageBox返回`{action:'confirm'|'cancel'|'close',value}`并取消过期校验；卸载会结束本实例待处理请求。

`MLoading` 支持局部/模态全屏、延迟与取消；`vMLoading`和`createMLoading({target,text,...})`用于现有区域，返回句柄需在所属任务或组件结束时`close()`。独立实例只恢复自己管理的样式、busy状态与交互锁；不要将真实上传进度用虚构计时器替代。

`MTypography/MText/MLink/MIcon` 提供正文、标题、编辑复制、截断展开、真实链接和SVG图形。`MCheckboxGroup`提供原生复选数组与数量约束，只统计当前存在、启用且唯一的选项；在`MForm`中通过`MFormItem`注册字段，`error`用于呈现，业务校验由表单规则负责。`MSelect multiple`使用`v-model:selectedValues`，保持原单选`v-model`的字符串契约。需要搜索和标签多选时使用`MVirtualSelect`。

## 后续方向

- 用基础版组件在自己的真实项目中验证，逐步形成独立文档与展示站。
- 根据首轮水墨科技样板继续优化颜色与细节，扩充笔画构形、切面展开、机械归位等 MG 场景。
- 按实际项目需求增加日期范围、树形下拉选择、高级表格和更多场景组合。
- 保持工具、设计数据和编排规范可复用，后续增加 React 适配。

完整范围见 [design/roadmap.json](design/roadmap.json)，设计参考见 [design/skill-references.json](design/skill-references.json)。

## 许可证

[MIT](LICENSE)，保留仓库现有版权声明。
