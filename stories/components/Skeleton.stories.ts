import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import MSkeleton from '../../src/components/MSkeleton.vue';
import MCard from '../../src/components/MCard.vue';
import MButton from '../../src/components/MButton.vue';

const meta = {
  title: '基础组件/Skeleton 骨架屏',
  component: MSkeleton,
  tags: ['autodocs'],
  args: { lines: 3 },
  argTypes: { lines: { control: { type: 'range', min: 1, max: 12, step: 1 } } },
  parameters: { docs: { description: { component: '装饰性内容占位，不单独播报加载状态。lines 在 1 至 12 行之间；与所在内容区域的 aria-busy 或明确加载文本配合使用。减少动态效果时保持静态。' } } },
  render: args => defineComponent({ components: { MSkeleton, MCard }, setup: () => ({ args }), template: '<div class="kit-stack" style="max-width:580px"><p class="kit-muted">正在整理内容，先保留版面的节奏。</p><MCard title="设计档案"><MSkeleton v-bind="args" /></MCard></div>' }),
} satisfies Meta<typeof MSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ContentReplacement: Story = {
  name: '内容替换',
  render: () => defineComponent({
    components: { MSkeleton, MCard, MButton },
    setup: () => ({ loading: ref(true) }),
    template: `<div class="kit-stack" style="max-width:580px"><MCard title="最近整理" :aria-busy="loading"><MSkeleton v-if="loading" :lines="4" /><div v-else class="kit-stack" style="gap:12px"><p>山川有形，笔墨有意。</p><p class="kit-muted">三份新的素材已放入设计档案，可以继续归类。</p></div></MCard><p role="status" class="kit-muted">{{ loading ? '内容正在载入。' : '内容已准备好。' }}</p><div><MButton variant="secondary" @click="loading = !loading">{{ loading ? '显示实际内容' : '显示骨架占位' }}</MButton></div></div>`,
  }),
};
export const ReducedMotion: Story = { name: '静态占位', globals: { motion: 'reduced' } };
