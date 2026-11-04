import { computed, defineComponent, nextTick, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MMessage from '../../src/components/MMessage.vue';
import { MButton, MInput, MInputNumber, MSwitch } from '../../src/components';
import type { MToastVariant } from '../../src/components/types';

const meta = {
  title: '反馈组件/Message 全局提示',
  component: MMessage,
  tags: ['autodocs'],
  args: { modelValue: false, content: '操作已完成，可以继续编辑。', type: 'info' },
  parameters: { docs: { description: { component: '顶部居中的轻量全局反馈，默认距顶部8px，显示3秒，不接管焦点。应用根部放置一个受控实例，由业务更新content/type/modelValue；组件不创建静态服务或全局队列。悬停、聚焦与页面隐藏暂停剩余计时。type支持info/success/warning/error/loading，持续加载传duration=0；只有业务确认成功后才显示成功提示。需要标题、详情和其他落点时使用Toast通知。' } } },
  argTypes: {
    type: { control: 'select', options: ['info', 'success', 'warning', 'error', 'loading'] },
    duration: { control: { type: 'number', min: 0, step: 500 }, description: '所有类型默认3000ms；0表示持续显示。' },
    offset: { control: { type: 'number', min: 0 }, description: '可见提示到顶部的距离，默认8px，遵循安全区。' },
  },
  render: args => defineComponent({
    components: { MMessage, MButton, MInput },
    setup() {
      const open = ref(args.modelValue), draft = ref('继续手中的创作');
      const bindings = computed(() => { const value = { ...args }; Reflect.deleteProperty(value, 'onUpdate:modelValue'); return value; });
      watch(() => args.modelValue, value => { open.value = value; });
      async function show() { open.value = false; await nextTick(); open.value = true; }
      return { bindings, open, draft, show };
    },
    template: `<main class="kit-stack" style="max-width:680px"><p class="kit-mono kit-muted">MESSAGE / 一声轻响</p><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">事有回应，手中不停。</h1><p class="kit-muted">顶部轻提示在3秒后收起，手中的编辑继续保留。</p><MInput v-model="draft" label="全局提示外的草稿" /><div class="kit-row"><MButton @click="show">显示全局提示</MButton></div><MMessage v-bind="bindings" v-model="open" data-testid="global-message" /></main>`,
  }),
} satisfies Meta<typeof MMessage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Types: Story = {
  name: '五种反馈',
  render: () => defineComponent({
    components: { MMessage, MButton, MInput, MInputNumber },
    setup() {
      const open = ref(false), type = ref<MToastVariant>('info'), content = ref(''), draft = ref('切换反馈后仍保留的草稿'), offset = ref<number | null>(8);
      const types: { type: MToastVariant; label: string; content: string }[] = [
        { type: 'info', label: '信息', content: '新的素材已就绪。' },
        { type: 'success', label: '成功', content: '资料已保存。' },
        { type: 'warning', label: '警告', content: '名称尚未填写完整。' },
        { type: 'error', label: '错误', content: '保存未完成，请重试。' },
        { type: 'loading', label: '加载', content: '正在读取素材，请稍候。' },
      ];
      const show = (item: typeof types[number]) => { type.value = item.type; content.value = item.content; open.value = true; };
      return { open, type, content, draft, types, show, offset };
    },
    template: `<main class="kit-stack" style="max-width:680px"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">五种回应，一个轻落点。</h1><p class="kit-muted">信息与处理中使用青灰，完成、提醒和错误各有语义。此处保留提示，便于逐一查看。</p><MInput v-model="draft" label="反馈类型外的草稿" /><MInputNumber v-model="offset" :min="0" label="提示顶部间距" /><div class="kit-row"><MButton v-for="item in types" :key="item.type" variant="secondary" @click="show(item)">显示{{ item.label }}提示</MButton></div><MMessage v-model="open" :type="type" :content="content" :offset="offset ?? 8" :duration="0" closable /></main>`,
  }),
};

export const Loading: Story = {
  name: '等待与完成',
  render: () => defineComponent({
    components: { MMessage, MButton, MInput, MSwitch },
    setup() {
      const open = ref(false), type = ref<MToastVariant>('loading'), content = ref('正在整理素材，请稍候。'), duration = ref(0), draft = ref('整理期间继续编辑的草稿'), closable = ref(false);
      const start = () => { type.value = 'loading'; content.value = '正在整理素材，请稍候。'; duration.value = 0; open.value = true; };
      const complete = () => { type.value = 'success'; content.value = '素材已整理完成。'; duration.value = 3000; };
      return { open, type, content, duration, draft, start, complete, closable };
    },
    template: `<main class="kit-stack" style="max-width:680px"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">等待有声，完成有据。</h1><p class="kit-muted">开始后持续显示等待提示，按下「完成操作」才确认成功；成功提示在3秒后收起。此示例仅在本页演练。</p><MInput v-model="draft" label="等待期间的草稿" /><MSwitch v-model="closable" label="显示关闭按钮" /><div class="kit-row"><MButton @click="start">开始操作</MButton><MButton variant="secondary" :disabled="!open || type !== 'loading'" @click="complete">完成操作</MButton></div><MMessage v-model="open" :content="content" :type="type" :duration="duration" :closable="closable" /></main>`,
  }),
};

export const LongContent: Story = {
  name: '长文与关闭确认',
  render: () => defineComponent({
    components: { MMessage, MButton, MInput, MSwitch },
    setup() {
      const open = ref(false), allowClose = ref(false), requests = ref(0), draft = ref('阅读长提示时保留的草稿');
      const content = '素材名称过长，请核对归档目录与说明后再继续。'.repeat(28);
      const update = (value: boolean) => { requests.value++; if (allowClose.value) open.value = value; };
      return { open, allowClose, requests, draft, content, update };
    },
    template: `<main class="kit-stack" style="max-width:680px"><h1 style="font:500 32px/1.5 var(--ui-font-family-display)">读得完整，也留有出口。</h1><p class="kit-muted">长内容可换行与滚动，关闭由本页确认。</p><MInput v-model="draft" label="长提示外的草稿" /><div class="kit-row"><MButton @click="open = true">显示长文提示</MButton></div><p class="kit-muted" data-testid="message-close-requests">关闭请求：{{ requests }} 次</p><MSwitch v-model="allowClose" label="允许关闭提示" /><MMessage :model-value="open" :content="content" type="warning" :duration="0" closable close-label="关闭长文提示" @update:model-value="update" /></main>`,
  }),
};

export const ReducedMotion: Story = {
  name: '减少动态效果',
  globals: { motion: 'reduced' },
  args: { type: 'loading', content: '正在读取素材，请稍候。', duration: 0, closable: true },
};
