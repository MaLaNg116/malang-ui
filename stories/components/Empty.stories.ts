import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref } from 'vue';
import UiEmpty from '../../src/components/UiEmpty.vue';
import UiButton from '../../src/components/UiButton.vue';
import UiCard from '../../src/components/UiCard.vue';

const meta = {
  title: '基础组件/Empty 空状态',
  component: UiEmpty,
  tags: ['autodocs'],
  args: { title: '暂无内容', description: '这里还没有档案，可以从第一份内容开始整理。' },
  parameters: { docs: { description: { component: '以原创档案线稿与可读标题表达空内容。默认插槽用于下一步操作，图形对辅助技术隐藏，组件不会主动移动焦点。' } } },
  render: args => defineComponent({ components: { UiEmpty, UiCard }, setup: () => ({ args }), template: '<UiCard style="max-width:680px"><UiEmpty v-bind="args" /></UiCard>' }),
} satisfies Meta<typeof UiEmpty>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithAction: Story = {
  name: '清除筛选操作',
  render: () => defineComponent({
    components: { UiEmpty, UiButton, UiCard },
    setup: () => ({ query: ref('山水'), message: ref('') }),
    template: `<UiCard style="max-width:680px"><UiEmpty :title="query ? '没有匹配的档案' : '尚未建立档案'" :description="query ? '试着清除「' + query + '」筛选，查看其他内容。' : '筛选已清除，可以添加新的内容。'"><UiButton variant="secondary" :disabled="!query" @click="query = ''; message = '已清除示例筛选。'">清除筛选</UiButton><p role="status" class="kit-muted" style="width:100%;font-size:12px">{{ message }}</p></UiEmpty></UiCard>`,
  }),
};
export const LongContent: Story = {
  name: '长标题与说明',
  args: { title: 'NoMatchingArchiveWithoutArtificialTruncation'.repeat(3), description: '请重新选择筛选范围，或补充新的档案。长标题与说明会自然换行，避免把需要理解的信息截断。' },
};
