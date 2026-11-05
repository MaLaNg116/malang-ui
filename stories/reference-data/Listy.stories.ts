import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MListy from '../../src/components/reference-data/MListy.vue';
import { records } from './fixtures';
const meta = { title: '数据组件/Listy 编号清单', tags: ['autodocs'], parameters: { docs: { description: { component: '独立的编号选择清单：绝对序号、归印选中标记、默认键盘单选与虚拟窗口。复用VirtualList内核，不将静态List别名计作另一种能力。' } } } } satisfies Meta;
export default meta; type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => defineComponent({ components: { MListy }, setup: () => ({ records, selected: ref<string|number|null>('record-0') }), template: `<main style="max-width:600px"><MListy v-model="selected" :items="records" label="编目选择" :height="264"><template #header>编目 · 万卷归位</template><template #item="{item}">{{item.name}} · {{item.group}}</template><template #footer>选中：{{selected}}</template></MListy></main>` }) };
export const ReadOnly: Story = { render: () => defineComponent({ components: { MListy }, setup: () => ({ records: records.slice(0, 3) }), template: `<MListy :items="records" label="只读编号卷宗" :selectable="false" :height="180"><template #item="{item}">{{item.name}}</template></MListy>` }) };
