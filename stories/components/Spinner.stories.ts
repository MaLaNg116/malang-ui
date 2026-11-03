import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import UiSpinner from '../../src/components/UiSpinner.vue';
import UiButton from '../../src/components/UiButton.vue';

const meta = {
  title: '基础组件/Spinner 加载标记',
  component: UiSpinner,
  tags: ['autodocs'],
  args: { label: '加载中', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  parameters: { docs: { description: { component: '断角印记式加载标记。图形对辅助技术隐藏，status 内只保留一份 label 文本。减少动态效果时停止旋转；组件不获取焦点。' } } },
  render: args => defineComponent({ components: { UiSpinner }, setup: () => ({ args }), template: '<div class="kit-row"><UiSpinner v-bind="args" /><p class="kit-muted">正在载入设计档案。</p></div>' }),
} satisfies Meta<typeof UiSpinner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Sizes: Story = {
  name: '三个尺寸',
  render: () => defineComponent({ components: { UiSpinner }, template: '<div class="kit-row" style="gap:28px"><UiSpinner size="sm" label="小尺寸加载中" /><UiSpinner label="默认尺寸加载中" /><UiSpinner size="lg" label="大尺寸加载中" /><span class="kit-muted">16 / 24 / 32 px</span></div>' }),
};
export const BusyRegion: Story = {
  name: '内容载入状态',
  render: () => defineComponent({
    components: { UiSpinner, UiButton },
    setup: () => ({ loading: ref(true) }),
    template: `<section class="kit-stack" style="max-width:580px"><div class="kit-row"><UiSpinner v-if="loading" label="正在载入档案列表" /><p>{{ loading ? '正在载入档案列表。' : '三份设计档案已准备好。' }}</p></div><div role="region" aria-label="设计档案列表" :aria-busy="loading" class="kit-panel"><p class="kit-muted">{{ loading ? '等待内容。' : '山水、器物与字体，均已完成整理。' }}</p></div><div><UiButton variant="secondary" @click="loading = !loading">{{ loading ? '完成加载' : '重新载入' }}</UiButton></div></section>`,
  }),
};
export const ReducedMotion: Story = { name: '减少动态效果', globals: { motion: 'reduced' } };
