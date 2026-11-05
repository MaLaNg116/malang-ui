import { defineComponent } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAlert, MBadge, MCard, MDivider } from '../src';
import './GettingStarted.css';
import coverage from '../design/component-coverage.json';

const catalog = coverage.items.filter(item => item.components.length > 0).map(item => ({ title: item.capability, count: item.components.length, names: item.components.join(' · '), detail: item.available }));
const install = 'cd malang-ui\npnpm install\npnpm build\npnpm pack\n\n# 在你的 Vue 项目中\npnpm add /绝对路径/malang-ui-0.1.0.tgz vue@^3.5.0\n# 使用 motion 或 all 入口时额外安装\npnpm add gsap@^3.15.0';
const usage = `<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MInput } from 'malang-ui';
import 'malang-ui/style.css';

const name = ref('');
<\/script>

<template>
  <main data-ui-theme="light" data-ui-palette="celadon" data-ui-density="comfortable">
    <MInput v-model="name" label="项目名称" />
    <MButton @click="name = ''">清空</MButton>
  </main>
</template>`;
const formUsage = `<script setup lang="ts">
import { reactive } from 'vue';
import { MButton, MForm, MFormItem, MInput } from 'malang-ui';
import type { MFormModel, MFormRules } from 'malang-ui';

const model = reactive({ title: '' });
const rules: MFormRules = {
  title: [{ required: true, message: '请填写作品名称。' }, { max: 40 }],
};
function save(values: MFormModel) { console.log(values.title); }
function restore(initial: MFormModel) { Object.assign(model, initial); }
<\/script>

<template>
  <MForm :model="model" :rules="rules" label="作品登记"
    @submit="save" @reset="restore" v-slot="{ validating }">
    <MFormItem name="title" label="作品名称" v-slot="{ field }">
      <MInput v-model="model.title" v-bind="field" />
    </MFormItem>
    <MButton type="submit" :loading="validating">核对并登记</MButton>
    <MButton type="reset" variant="secondary">恢复初始资料</MButton>
  </MForm>
</template>`;
const modules = `// UI、Vue 适配与工具；不会加载 GSAP
import { MTable, useReducedMotion } from 'malang-ui';
import type { MTableColumn } from 'malang-ui';

// 纯 TypeScript，可供 Vue / React / 原生项目使用
import { debounce, throttle, asyncLock } from 'malang-ui/utils';

// 独立 GSAP / MG 入口；组件卸载时调用 controller.dispose()
import { createInkSequence, createOrbitSequence, createSealSequence,
  createBrandSequence, createWaitingSequence, createWeaveSequence,
  createStaggerSequence } from 'malang-ui/motion';`;
const GettingStarted = defineComponent({
  components: { MAlert, MBadge, MCard, MDivider },
  setup: () => ({ catalog, total: coverage.publicComponentCount, install, usage, formUsage, modules }),
  template: `<main class="getting-started">
    <header><p class="getting-started__eyebrow">MALANG / KUNGFU PUNK</p><h1>落墨有形，交互有章。</h1><p class="getting-started__intro">{{ total }} 个 Vue 组件，一套功夫朋克语言。从单个状态走向能实际操作的业务页面。</p><div class="getting-started__badges"><MBadge tone="info">Vue 3 + TypeScript</MBadge><MBadge>M 前缀 · 本地验证版</MBadge><MBadge tone="success">明暗主题 · 键盘操作</MBadge></div></header>
    <MAlert title="先在自己的项目中验证" description="当前包尚未发布到 npm。通过本地构建与打包安装使用；颜色、细节和更多 MG 编排仍会继续迭代。" />
    <section aria-labelledby="start-route"><h2 id="start-route">从这里开始</h2><ol class="getting-started__route"><li><strong>看语言</strong><p>「功夫朋克规范」与「交互语言」展示材质、焦点和七项品质约定；「纸墨试色台」可保留草稿切换三款浅色与浓墨深色，记录本页方案并验印。</p></li><li><strong>试组合</strong><p>「业务组合工作台」「铸刃工坊」「归印调校台」「藏品归档台」验证编辑、交付、归档和真实 MG。到 <a href="./?path=/story/开始-档案发布台--default" target="_top">档案发布台</a> 操作规则校验、分段筛选、图片核对与可取消确认。</p></li><li><strong>查组件</strong><p>基础组件目录包含 Form、Segmented 与 Image，气泡确认和顶部轻提示在反馈组件目录；静态指标看 Statistic，页面结果看 Result，六向详情通知看 Toast 的 Positions。「文档」页提供参数与可运行示例。</p></li></ol></section>
    <MDivider :label="'组件索引 / ' + total" />
    <section class="getting-started__catalog" aria-label="组件分类"><MCard v-for="group in catalog" :key="group.title" :title="group.title" :description="group.detail" heading-tag="h2"><MBadge>{{ group.count }} 个组件</MBadge><p>{{ group.names }}</p></MCard></section>
    <section aria-labelledby="start-install"><h2 id="start-install">安装到本地项目</h2><p>组件运行时使用 Vue 3.5+；开发工作台使用 Node.js 24+、pnpm 11.25。替换下方安装包路径为你本机的实际位置。</p><pre tabindex="0" aria-label="本地安装命令"><code v-text="install"></code></pre></section>
    <section aria-labelledby="start-use"><h2 id="start-use">按需导入与主题</h2><p>导入一次 style.css，主题与浅色配色放在同一容器：data-ui-theme 为 light / dark，data-ui-palette 为 paper / celadon / gilt，分别对应宣纸朱砂、青瓷冷玉、绢素鎏金。深色保持浓墨，palette 不改变深色；密度仍为 comfortable / compact。</p><pre tabindex="0" aria-label="Vue 最小用法"><code v-text="usage"></code></pre><p>底纸、浮纸与静层分开承托内容，朱砂刻印独立于主色。CSS 动效默认尊重系统减少动态效果偏好，也可在容器设置 data-ui-motion="reduced"。MG 控制器默认读取系统偏好；应用内开关需同时传入控制器的 reducedMotion 选项。</p></section>
    <section aria-labelledby="start-modules"><h2 id="start-modules">独立模块入口</h2><pre tabindex="0" aria-label="模块导入示例"><code v-text="modules"></code></pre></section>
    <section aria-labelledby="start-form"><h2 id="start-form">把字段接入表单</h2><p>MForm 使用受控 model，支持平铺与嵌套路径，MFormItem 按 name 注册字段。通过 field 显式绑定一个控件，v-model 仍由页面提供；已有输入组件负责标签、帮助文字、错误与原生属性，不自动克隆子组件。</p><pre tabindex="0" aria-label="Vue 表单字段绑定"><code v-text="formUsage"></code></pre><p>默认提交时校验，也可选择 blur / change。规则支持必填、边界、正则、跨字段与异步 validator(value, modelSnapshot, signal)；改值、重置或新校验会取消旧结果。重置发出挂载时的初始模型快照，由父级接受；name 支持 user.name 与 members.0.name；MFormList 提供受控数组增删和重排。提交给业务的是模型副本，校验范围是已注册字段，组件不执行上传或服务器请求。</p><p>运行示例见 <a href="./?path=/story/基础组件-form-表单--default" target="_top">Form 表单</a>；实例方法 validate(names?) 返回含 valid / errors / cancelled 的结果，clearValidation、reset 与 focusField 可由应用显式调用。</p></section>
    <section aria-labelledby="start-p1"><h2 id="start-p1">选择、核对与确认</h2><p><a href="./?path=/story/基础组件-segmented-分段选择--default" target="_top">Segmented 分段选择</a> 用原生 radio 表达单值，支持横纵布局、禁用、键盘与表单；未匹配值保持无选中，reset 后服从当前父模型。它不承载标签页面板。</p><p><a href="./?path=/story/基础组件-image-图片--gallery" target="_top">Image 图片画廊</a> 提供载入失败重试、1–3 倍缩放与成组预览。src 与 alt 必填；previewSources 只传 URL，组内其他图片按序命名，需要各自说明时由多个缩略图提供 alt。</p><p><a href="./?path=/story/反馈组件-popconfirm-气泡确认--async-confirmation" target="_top">Popconfirm 异步确认</a> 的 beforeConfirm(signal) 返回 false 时保留气泡，失败可原处重试；取消会中止本轮并忽略迟到结果。守卫通过才发出 confirm，父页面在该事件中更新已确认状态。示例触发插槽只放文字或图标，原生按钮由组件提供。</p></section>
    <section aria-labelledby="start-motion"><h2 id="start-motion">六套 Canvas 与 DOM 错峰</h2><p>轨道构形、墨迹切面、成功落印、品牌开场、双轨等待与 4.2 秒经纬织光各有独立控制器；DOM 错峰管理已挂载的专属容器。七个工厂都提供播放、暂停、定位、重播和销毁，等待循环只表达处理中。</p><p>Spinner 以四枚轻折角舒展、强展与回收，形成三拍顺滑变奏；外轨转速柔和变化、连续旋转而不骤停，双楔内芯反向匀速换位，循环自然衔接。sm/md/lg 对应 16/24/32 px，按钮 loading 共享同一装饰图形；Skeleton 以细噪点和稀疏短切片表达占位。系统或容器减少动态效果与强制颜色模式下保留清晰静态状态。</p></section>
    <section aria-labelledby="start-contrast"><h2 id="start-contrast">配色检查范围</h2><p>按实际常用不透明颜色对检查：普通文字至少 4.5:1，识别控件所需的边界与焦点标记对相邻颜色至少 3:1，计算时不四舍五入临界比值。方法见 <a href="https://www.w3.org/WAI/WCAG22/Techniques/general/G18" target="_blank" rel="noreferrer">W3C G18 文字亮度计算</a> 与 <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html" target="_blank" rel="noreferrer">非文字对比度说明</a>；选定配色对的检查仍需结合接入页面的完整状态与辅助技术体验。</p></section>
    <section aria-labelledby="start-coverage"><h2 id="start-coverage">组件覆盖与补齐</h2><p>分段选择、气泡确认、图片预览与表单验证已接入本页索引；Space 统一排列控件，BackTop 服务长页与独立滚动区域。顶部单句反馈使用 MMessage，详情通知使用 notification。到 <a href="./?path=/story/开始-组件覆盖对照--default" target="_top">组件覆盖对照</a> 搜索 29 类能力及 155 条官方组件记录，分别查看基础支持、可组合方案与缺项，不按名称推断完整 API 兼容。</p><p>2026-11-05 对照快照采用 <a href="https://github.com/ant-design/ant-design/releases/tag/6.7.0" target="_blank" rel="noopener noreferrer">Ant Design 6.7.0</a> 与 <a href="https://github.com/element-plus/element-plus/releases/tag/2.14.7" target="_blank" rel="noopener noreferrer">Element Plus 2.14.7</a>，目录来源为 <a href="https://ant.design/components/overview/" target="_blank" rel="noopener noreferrer">Ant Design 官方目录</a> 和 <a href="https://element-plus.org/en-US/component/overview.html" target="_blank" rel="noopener noreferrer">Element Plus 官方目录</a>。后续 P1 优先排版与链接、锚点与吸附、日期区间与时间、栅格布局与分栏，继续按实际项目需要推进。</p></section>
    <MAlert tone="info" title="首版使用边界" description="Dialog 与浮层使用原生 dialog / Popover API，面向具备这些能力的现代浏览器。日期为单日期 ISO，附件先在本地管理，Table 提供基础语义表格和插槽。日期范围、高级数据网格、React 适配与 npm 发布留给后续阶段。" />
    <footer><p>保持原生交互与可读内容，让轮廓、墨线和适度动效建立识别度。</p></footer>
  </main>`,
});
const meta = { title: '开始/基础版使用指南', component: GettingStarted, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof GettingStarted>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '组件索引与接入' };
