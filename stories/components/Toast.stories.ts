import { defineComponent, nextTick, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UiToast from '../../src/components/UiToast.vue';
import UiToastViewport from '../../src/components/UiToastViewport.vue';
import { UiButton, UiInput } from '../../src/components';

const meta = {
  title: '基础组件/Toast 轻提示',
  component: UiToast,
  tags: ['autodocs'],
  args: { modelValue: false, title: '设置已保存', description: '新的配置已经应用，可以继续创作。', variant: 'success', closeLabel: '关闭通知' },
  parameters: { docs: { description: { component: '受控的单条轻提示，每个实例管理自己的剩余时间。duration=0 保持显示；悬停、键盘焦点或页面隐藏时暂停，解除全部原因后继续。通知不抢焦点；独立的稳定 live regions 负责消息播报。UiToastViewport 仅提供主题范围内的浮层布局，不创建全局单例。' } } },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'error'] },
    duration: { control: { type: 'number', min: 0, step: 500 }, description: '自动关闭的毫秒数；未设置时普通/成功为5000ms，错误持续显示。0 表示持续显示。' },
  },
  render: args => defineComponent({
    components: { UiToast, UiToastViewport, UiButton, UiInput },
    setup() {
      const open = ref(args.modelValue);
      const note = ref('继续编辑中的内容');
      watch(() => args.modelValue, value => { open.value = value; });
      async function show() { open.value = false; await nextTick(); open.value = true; }
      return { args, open, note, show };
    },
    template: `<main class="kit-stack"><p class="kit-mono kit-muted" style="font-size:11px;letter-spacing:1px">TOAST / 一次清楚的回应</p><h1 style="font-family:var(--ui-font-family-display);font-size:32px">消息落定，继续手中的事。</h1><p class="kit-muted">提示出现时保留当前焦点；鼠标悬停或聚焦关闭按钮，可以安心阅读。</p><UiInput v-model="note" label="通知外输入框" style="max-width:400px" /><div class="kit-row"><UiButton @click="show">显示保存通知</UiButton></div><p class="kit-muted">{{ open ? '本页配置已保存。' : '当前没有显示的通知。' }}</p><UiToastViewport><UiToast v-bind="args" v-model="open" /></UiToastViewport></main>`,
  }),
} satisfies Meta<typeof UiToast>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Persistent: Story = { args: { duration: 0, title: '操作说明已就绪', description: '这条消息会保留，直到你手动关闭。' } };

export const Variants: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton },
    setup: () => ({ info: ref(false), success: ref(false), error: ref(false) }),
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">不同状态，同样清楚。</h1><div class="kit-row"><UiButton @click="info = success = error = true">显示三种通知</UiButton></div><p class="kit-muted">普通与成功消息使用礼貌播报，错误消息使用即时提醒；每条可以独立关闭。</p><UiToastViewport><UiToast v-model="info" title="资料已就绪" description="可以开始查看新的设计资料。" :duration="0" /><UiToast v-model="success" variant="success" title="草稿已归档" description="这一次创作已经留存。" :duration="0" /><UiToast v-model="error" variant="error" title="保存未完成" description="请检查连接后重试，已填写内容仍保留。" /></UiToastViewport></div>`,
  }),
};

export const Pause: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton, UiInput },
    setup() {
      const open = ref(false); const note = ref('把焦点放回这里继续计时');
      async function show() { open.value = false; await nextTick(); open.value = true; }
      return { open, note, show };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">读完，再继续。</h1><p class="kit-muted">显示 1200ms；悬停、键盘焦点与页面隐藏分别暂停，全部解除后才恢复剩余时间。</p><UiInput v-model="note" label="通知外输入框" style="max-width:400px" /><div class="kit-row"><UiButton @click="show">显示暂停示例</UiButton></div><p data-testid="toast-pause-state" class="kit-muted">{{ open ? '通知显示中' : '通知已关闭' }}</p><UiToastViewport><UiToast v-model="open" title="暂停中的通知" description="可以将鼠标移到这里，再聚焦关闭按钮。" :duration="1200" /></UiToastViewport></div>`,
  }),
};

export const Replacement: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton },
    setup() {
      const open = ref(false); const version = ref(1);
      async function show() { open.value = false; version.value = 1; await nextTick(); open.value = true; }
      const replace = () => { version.value++; };
      return { open, version, show, replace };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">新消息，重新留出阅读时间。</h1><div class="kit-row"><UiButton @click="show">显示可替换通知</UiButton><UiButton variant="secondary" :disabled="!open" @click="replace">替换当前消息</UiButton></div><p class="kit-muted">每条新消息重新获得 1200ms；暂停状态仍会保留。</p><UiToastViewport><UiToast v-model="open" :title="version === 1 ? '第一条消息' : '第' + version + '条消息'" :description="'当前消息编号：' + version" :duration="1200" /></UiToastViewport></div>`,
  }),
};

export const Controlled: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton },
    setup() {
      const open = ref(false); const requests = ref(0);
      const request = () => { requests.value++; };
      async function show() { open.value = false; requests.value = 0; await nextTick(); open.value = true; }
      return { open, requests, request, show };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">关闭由页面确认。</h1><div class="kit-row"><UiButton @click="show">显示受控通知</UiButton><UiButton variant="secondary" :disabled="!open" @click="open = false">接受关闭请求</UiButton><UiButton variant="ghost" @click="show">清零并重开</UiButton></div><p data-testid="toast-close-requests" class="kit-muted">关闭请求：{{ requests }} 次</p><p class="kit-muted">本例先保留消息，只记录请求。650ms 到期仅请求一次，手动关闭仍可以再次请求。</p><UiToastViewport><UiToast :model-value="open" title="等待页面确认" description="关闭请求不会擅自改变父级状态。" :duration="650" @update:model-value="request" /></UiToastViewport></div>`,
  }),
};

export const Multiple: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton },
    setup() {
      const first = ref(false); const second = ref(false);
      async function show() { first.value = second.value = false; await nextTick(); first.value = second.value = true; }
      return { first, second, show };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">各自计时，彼此独立。</h1><div class="kit-row"><UiButton @click="show">同时显示两条通知</UiButton></div><p class="kit-muted">第一条 900ms，第二条 1600ms。暂停或关闭其中一条，不会改变另一条。</p><UiToastViewport><UiToast v-model="first" variant="success" title="归档已完成" :duration="900" /><UiToast v-model="second" title="资料处理中" :duration="1600" /></UiToastViewport></div>`,
  }),
};

export const UnmountCleanup: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton },
    setup() {
      const mounted = ref(true); const open = ref(false); const requests = ref(0);
      const update = (value: boolean) => { requests.value++; open.value = value; };
      async function show() { mounted.value = false; open.value = false; requests.value = 0; await nextTick(); mounted.value = true; open.value = true; }
      const remount = () => { mounted.value = true; open.value = true; };
      return { mounted, open, requests, update, show, remount };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">离开时，不留下等待。</h1><div class="kit-row"><UiButton @click="show">显示可卸载通知</UiButton><UiButton variant="secondary" :disabled="!mounted" @click="mounted = false">卸载当前通知</UiButton><UiButton variant="ghost" @click="remount">重新挂载通知</UiButton></div><p data-testid="toast-unmount-requests" class="kit-muted">关闭请求：{{ requests }} 次</p><p class="kit-muted">650ms 内卸载后，不应再收到旧实例的关闭请求。</p><UiToastViewport><UiToast v-if="mounted" :model-value="open" title="等待中的临时通知" :duration="650" @update:model-value="update" /></UiToastViewport></div>`,
  }),
};

export const LongContent: Story = {
  render: () => defineComponent({
    components: { UiToast, UiToastViewport, UiButton },
    setup() {
      const open = ref(false);
      const title = '设计档案已更新 · ' + 'WORKSPACE'.repeat(12);
      const description = '这段较长的资料说明会保留完整内容，并在需要时独立滚动。'.repeat(22);
      return { open, title, description };
    },
    template: `<div class="kit-stack"><h1 style="font-family:var(--ui-font-family-display);font-size:32px">长消息，也留有出口。</h1><div class="kit-row"><UiButton @click="open = true">显示长消息</UiButton></div><p class="kit-muted">右上方显示持续通知，长标题会换行，说明可以滚动；关闭按钮始终可用。</p><UiToastViewport placement="top-end" label="阅读通知"><UiToast v-model="open" :title="title" :description="description" :duration="0" /></UiToastViewport></div>`,
  }),
};
