import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MProgress from '../../src/components/MProgress.vue';
import MButton from '../../src/components/MButton.vue';
const meta = {
  title: '二级组件/Progress 进度条', component: MProgress, tags: ['autodocs'],
  args: { label: '铸刃进度', value: 42, max: 100, status: 'default', indeterminate: false, showValue: true },
  parameters: { docs: { description: { component: '以分节滑轨呈现进度；确定进度提供真实数值，indeterminate 不伪造百分比。组件不自动播报每次数值变化，完成与异常由业务层提示。减少动效时停止滑动与过渡。' } } },
  render: args => defineComponent({ components: { MProgress }, setup: () => ({ args }), template: '<div class="kit-stack" style="max-width:640px"><MProgress v-bind="args">归位、校准，再落下最后一道印。</MProgress></div>' }),
} satisfies Meta<typeof MProgress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Interactive: Story = { render: () => defineComponent({ components: { MProgress, MButton }, setup: () => ({ value: ref(0) }), template: '<div class="kit-stack" style="max-width:640px"><MProgress label="文档检查" :value="value" :status="value === 100 ? \'success\' : \'default\'"/><div class="kit-row"><MButton @click="value = Math.min(100, value + 25)">推进检查</MButton><MButton variant="secondary" @click="value = 0">重置</MButton></div></div>' }) };
export const Indeterminate: Story = { args: { label: '正在准备资料', indeterminate: true } };
export const Error: Story = { args: { label: '构建检查', value: 68, status: 'error' } };
export const Complete: Story = { args: { value: 100, status: 'success' } };
export const InvalidValues: Story = { args: { value: -5, max: 0 } };
export const ReducedMotion: Story = { args: { indeterminate: true }, globals: { motion: 'reduced' } };
