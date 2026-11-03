import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent } from 'vue';
import UiDivider from '../../src/components/UiDivider.vue';

const meta = {
  title: '基础组件/Divider 分隔线',
  component: UiDivider,
  tags: ['autodocs'],
  args: { label: undefined },
  parameters: { docs: { description: { component: '水平内容分隔。可选 label 同时提供可见文字与分隔符名称；文字只播读一次，组件没有焦点或点击行为。' } } },
  render: args => defineComponent({ components: { UiDivider }, setup: () => ({ args }), template: '<div style="max-width:680px"><p>第一章 · 从留白开始。</p><UiDivider v-bind="args" /><p class="kit-muted">下一章 · 让内容各就其位。</p></div>' }),
} satisfies Meta<typeof UiDivider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithLabel: Story = { name: '带章节名称', args: { label: '下一章节' } };
export const LongLabel: Story = { name: '长名称换行', args: { label: 'ArchiveAndInteractionPrinciples'.repeat(5) } };
