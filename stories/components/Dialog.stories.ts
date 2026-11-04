import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDialog from '../../src/components/MDialog.vue';
import { MButton, MInput } from '../../src/components';

const meta = {
  title: '基础组件/Dialog 对话框',
  component: MDialog,
  tags: ['autodocs'],
  args: {
    modelValue: false,
    title: '新建工作空间',
    description: '先给创作一个落点，更多设置可以稍后调整。',
    closeOnEscape: true,
    closeOnBackdrop: false,
    closeLabel: '关闭对话框',
  },
  parameters: {
    docs: { description: { component: '使用原生 dialog.showModal() 的模态对话框，保持主题继承、焦点约束及返回。默认允许 Escape，默认不点击遮罩关闭。内容与 footer 插槽保持挂载；footer 提供 close()。打开时短促进入，关闭即时响应。需要支持原生 dialog 的现代浏览器。' } },
  },
  argTypes: {
    modelValue: { control: 'boolean', description: '使用 v-model 控制打开状态。' },
    closeOnBackdrop: { control: 'boolean', description: '仅按下与松开均在面板外时请求关闭。' },
    closeOnEscape: { control: 'boolean', description: '允许 Escape / 平台关闭请求。' },
  },
  render: args => defineComponent({
    components: { MDialog, MButton, MInput },
    setup() {
      const open = ref(args.modelValue);
      const name = ref('观山 · 设计档案');
      const error = ref('');
      const status = ref('配置仅在当前预览中生效。');
      const formId = `workspace-form-${useId()}`;
      watch(() => args.modelValue, value => { open.value = value; });
      watch(name, () => { error.value = ''; });
      function save() {
        if (!name.value.trim()) { error.value = '请填写工作空间名称。'; return; }
        status.value = `「${name.value.trim()}」已创建。`;
        open.value = false;
      }
      return { args, open, name, error, status, formId, save };
    },
    template: `<main class="kit-stack">
      <p class="kit-mono kit-muted" style="font-size:11px;letter-spacing:1px">DIALOG / 一次专注的配置</p>
      <h1 style="font-family:var(--ui-font-family-display);font-size:32px">有层次，也有退路。</h1>
      <p class="kit-muted">打开后尝试 Tab、Shift+Tab 与 Escape，关闭后焦点会回到触发按钮。</p>
      <div class="kit-row"><MButton @click="open = true">打开配置对话框</MButton></div>
      <p role="status" class="kit-muted" style="overflow-wrap:anywhere">{{ status }}</p>
      <MDialog v-bind="args" v-model="open">
        <form :id="formId" @submit.prevent="save" style="display:grid;gap:20px">
          <MInput v-model="name" label="工作空间名称" name="workspaceName" :error="error" hint="支持中文；未提交内容会在关闭后保留。" autofocus maxlength="40" />
          <p style="margin:0;color:var(--ui-color-text-secondary);font-size:12px;line-height:1.8">这是一段可以安心编辑的空间。按 Escape 或点击取消离开，输入内容仍在；点击创建，完成这一次配置。</p>
        </form>
        <template #footer="{ close }"><MButton variant="secondary" @click="close">取消</MButton><MButton type="submit" :form="formId">创建空间</MButton></template>
      </MDialog>
    </main>`,
  }),
} satisfies Meta<typeof MDialog>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const BackdropDismiss: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup: () => ({ open: ref(false) }),
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="open = true">打开可点遮罩关闭的对话框</MButton></div><p class="kit-muted">按下和松开均位于遮罩区域才会关闭；从面板内拖到遮罩不会丢失当前对话。</p><MDialog v-model="open" title="查看设计说明" description="这是一个可以轻松退出的阅读窗口。" close-on-backdrop><p style="margin:0;line-height:1.8">留白让内容呼吸，边界让动作清晰。点击面板外即可返回。</p><template #footer="{ close }"><MButton @click="close">读完了</MButton></template></MDialog></div>`,
  }),
};

export const EscapeDisabled: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup: () => ({ open: ref(false) }),
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="open = true">打开关闭策略示例</MButton></div><p class="kit-muted">此示例关闭 Escape 与遮罩退出，仍保留清楚的关闭按钮。</p><MDialog v-model="open" title="先完成这一步" description="使用右上角关闭或下方按钮退出。" :close-on-escape="false"><p style="margin:0;line-height:1.8">可根据流程明确关闭方式。关闭策略不会隐藏退出入口。</p><template #footer="{ close }"><MButton @click="close">完成检查</MButton></template></MDialog></div>`,
  }),
};

export const LongContent: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup: () => ({ open: ref(false) }),
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="open = true">打开长内容对话框</MButton></div><MDialog v-model="open" title="一份长卷" description="标题与操作保留在窗口内，正文可以独立滚动。"><div style="display:grid;gap:20px"><section v-for="index in 12" :key="index"><h3 style="margin:0 0 8px;font-size:16px;font-weight:500">第 {{ index }} 节 · 留白与秩序</h3><p style="margin:0;line-height:1.9;color:var(--ui-color-text-secondary)">界面里的每一次切换，都应该有清楚的起点和落点。阅读长内容时，可以滚动正文，始终保留标题与关闭操作。内容不会撑出视口，也不会让后面的页面继续滚动。</p></section></div><template #footer="{ close }"><MButton @click="close">合上长卷</MButton></template></MDialog></div>`,
  }),
};

export const Nested: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup() {
      const outer = ref(false);
      const inner = ref(false);
      const mounted = ref(true);
      watch(outer, open => { if (!open) inner.value = false; });
      function show() { mounted.value = true; inner.value = false; outer.value = true; }
      return { outer, inner, mounted, show };
    },
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="show">打开外层对话框</MButton></div><MDialog v-if="mounted" v-model="outer" title="工作空间设置" description="可以打开第二层，关闭它后回到当前操作。"><MButton variant="secondary" @click="inner = true">打开内层对话框</MButton><MDialog v-model="inner" title="补充说明" description="Escape 仅关闭当前最上层窗口。"><p style="margin:0;line-height:1.8">每一层拥有自己的焦点与滚动锁，互不清理彼此的状态。</p><template #footer="{ close }"><MButton variant="secondary" @click="mounted = false">卸载两层对话框</MButton><MButton @click="close">返回设置</MButton></template></MDialog><template #footer="{ close }"><MButton @click="close">关闭设置</MButton></template></MDialog></div>`,
  }),
};

export const UnmountCleanup: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup() {
      const open = ref(false);
      const mounted = ref(true);
      function show() { mounted.value = true; open.value = true; }
      return { open, mounted, show };
    },
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="show">打开后卸载</MButton></div><p class="kit-muted">直接卸载打开中的组件，也应释放页面滚动锁，并可重新打开。</p><MDialog v-if="mounted" v-model="open" title="卸载清理" description="验证路由离开或条件渲染时的清理。"><MButton variant="secondary" @click="mounted = false">卸载当前对话框</MButton><template #footer="{ close }"><MButton @click="close">正常关闭</MButton></template></MDialog></div>`,
  }),
};

export const NativeFormClose: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup: () => ({ open: ref(false) }),
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="open = true">打开原生表单示例</MButton></div><p role="status" class="kit-muted">v-model：{{ open ? '打开' : '关闭' }}</p><MDialog v-model="open" title="原生表单关闭" description="method=dialog 关闭时同步更新 v-model。"><form method="dialog"><MButton type="submit" value="done">提交并关闭</MButton></form></MDialog></div>`,
  }),
};

export const RichContent: Story = {
  render: () => defineComponent({
    components: { MDialog, MButton },
    setup: () => ({ open: ref(false) }),
    template: `<div class="kit-stack"><div class="kit-row"><MButton @click="open = true">打开富内容对话框</MButton></div><p class="kit-muted">插槽内的富文本、原生说明与媒体控件保留各自的键盘操作。</p><MDialog v-model="open" title="编辑与阅读" description="使用 Tab 依次访问编辑区域、补充说明和原生音频控件。"><div style="display:grid;gap:24px"><div contenteditable="true" role="textbox" aria-label="编辑说明" aria-multiline="true" style="min-height:72px;padding:12px;border:1px solid var(--ui-color-border);line-height:1.8">可以直接编辑这段说明。<span contenteditable="true">嵌套的可编辑文本仍属于同一个编辑区域。</span></div><div contenteditable="true" tabindex="-1" aria-label="不进入 Tab 的说明" style="color:var(--ui-color-text-secondary);font-size:12px">此段设置 tabindex=-1，不会成为额外的 Tab 停靠点。</div><details><summary>查看补充说明</summary><p style="line-height:1.8">焦点访问第一处 summary，Enter 或空格切换展开。更复杂的内容仍使用浏览器原生行为。</p></details><label style="display:grid;gap:8px;font-size:12px">原生音频控件示例（未加载媒体）<audio controls preload="none" aria-label="原生音频控件" style="width:100%"></audio></label></div></MDialog></div>`,
  }),
};
