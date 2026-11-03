import { defineComponent } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { UiAlert, UiBadge, UiCard, UiDivider } from '../src';
import './GettingStarted.css';

const catalog = [
  { title: '动作与输入', count: 7, names: 'Button · Input · Textarea · Select · Checkbox · RadioGroup · Switch', detail: '原生表单、中文输入、禁用与错误状态' },
  { title: '内容与数据', count: 3, names: 'Card · Table · Divider', detail: '语义化内容、单元格插槽、加载与空状态' },
  { title: '页面导航', count: 3, names: 'Tabs · Pagination · Breadcrumb', detail: '键盘切换、受控分页与真实链接' },
  { title: '浮层与说明', count: 3, names: 'Dialog · Popover · Tooltip', detail: '模态焦点、非模态浮层与文本提示' },
  { title: '状态与反馈', count: 7, names: 'Badge · Alert · Spinner · Skeleton · Empty · Toast · ToastViewport', detail: '静态状态、可选播报、独立通知计时' },
];
const install = 'cd malang-ui\npnpm install\npnpm build\npnpm pack\n\n# 在你的 Vue 项目中\npnpm add /绝对路径/malang-ui-0.1.0.tgz vue@^3.5.0\n# 使用 motion 或 all 入口时额外安装\npnpm add gsap@^3.15.0';
const usage = `<script setup lang="ts">
import { ref } from 'vue';
import { UiButton, UiInput } from 'malang-ui';
import 'malang-ui/style.css';

const name = ref('');
<\/script>

<template>
  <main data-ui-theme="dark" data-ui-density="comfortable">
    <UiInput v-model="name" label="项目名称" />
    <UiButton @click="name = ''">清空</UiButton>
  </main>
</template>`;
const modules = `// UI、Vue 适配与工具；不会加载 GSAP
import { UiTable, useReducedMotion } from 'malang-ui';
import type { UiTableColumn } from 'malang-ui';

// 纯 TypeScript，可供 Vue / React / 原生项目使用
import { debounce, throttle, asyncLock } from 'malang-ui/utils';

// 独立 GSAP / MG 入口；组件卸载时调用 controller.dispose()
import { createInkSequence, createOrbitSequence } from 'malang-ui/motion';`;
const GettingStarted = defineComponent({
  components: { UiAlert, UiBadge, UiCard, UiDivider },
  setup: () => ({ catalog, install, usage, modules }),
  template: `<main class="getting-started">
    <header><p class="getting-started__eyebrow">MALANG UI / BASIC EDITION</p><h1>落墨有形，交互有章。</h1><p class="getting-started__intro">23 个 Vue 组件，一套水墨科技语言。从单个状态走向能实际操作的业务页面。</p><div class="getting-started__badges"><UiBadge tone="info">Vue 3 + TypeScript</UiBadge><UiBadge>本地验证版 0.1</UiBadge><UiBadge tone="success">明暗主题 · 键盘操作</UiBadge></div></header>
    <UiAlert title="先在自己的项目中验证" description="当前包尚未发布到 npm。通过本地构建与打包安装使用；颜色、细节和更多 MG 编排仍会继续迭代。" />
    <section aria-labelledby="start-route"><h2 id="start-route">从这里开始</h2><ol class="getting-started__route"><li><strong>看语言</strong><p>「水墨科技样板」与「交互语言」展示视觉方向、焦点和动效。</p></li><li><strong>试组合</strong><p>「业务组合工作台」完成搜索、筛选、分页、编辑和保存通知。</p></li><li><strong>查组件</strong><p>在左侧基础组件目录切换状态；「文档」页提供参数与可运行示例。</p></li></ol></section>
    <UiDivider label="组件索引 / 23" />
    <section class="getting-started__catalog" aria-label="组件分类"><UiCard v-for="group in catalog" :key="group.title" :title="group.title" :description="group.detail" heading-tag="h2"><UiBadge>{{ group.count }} 个组件</UiBadge><p>{{ group.names }}</p></UiCard></section>
    <section aria-labelledby="start-install"><h2 id="start-install">安装到本地项目</h2><p>组件运行时使用 Vue 3.5+；开发工作台使用 Node.js 24+、pnpm 11.25。替换下方安装包路径为你本机的实际位置。</p><pre tabindex="0" aria-label="本地安装命令"><code v-text="install"></code></pre></section>
    <section aria-labelledby="start-use"><h2 id="start-use">按需导入与主题</h2><p>导入一次 style.css，然后在应用容器设置 data-ui-theme、data-ui-density。主题值为 light / dark，密度为 comfortable / compact；缺省采用浅色与舒适密度。</p><pre tabindex="0" aria-label="Vue 最小用法"><code v-text="usage"></code></pre><p>CSS 动效默认尊重系统减少动态效果偏好，也可在容器设置 data-ui-motion="reduced"。MG 控制器默认读取系统偏好；应用内开关需同时传入控制器的 reducedMotion 选项。</p></section>
    <section aria-labelledby="start-modules"><h2 id="start-modules">独立模块入口</h2><pre tabindex="0" aria-label="模块导入示例"><code v-text="modules"></code></pre></section>
    <UiAlert tone="info" title="首版使用边界" description="Dialog 与浮层使用原生 dialog / Popover API，面向具备这些能力的现代浏览器。Select 保留系统下拉框；Table 提供基础语义表格和插槽。高级数据网格、日期选择、React 适配与 npm 发布会在后续阶段推进。" />
    <footer><p>保持原生交互与可读内容，让轮廓、墨线和适度动效建立识别度。</p></footer>
  </main>`,
});
const meta = { title: '开始/基础版使用指南', component: GettingStarted, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof GettingStarted>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '组件索引与接入' };
