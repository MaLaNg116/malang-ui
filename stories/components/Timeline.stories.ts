import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MTimeline from '../../src/components/MTimeline.vue';
import MButton from '../../src/components/MButton.vue';
import type { MTimelineItem } from '../../src/components/types';
const entries: MTimelineItem[] = [
  { value: 'prepare', title: '整理素材', description: '将墨迹、结构与文案归入同一份档案。', time: '09:20', datetime: '2026-11-04T09:20:00+08:00', status: 'success' },
  { value: 'inspect', title: '校准细节', description: '核对焦点、对比与动效节奏。', time: '09:35', datetime: '2026-11-04T09:35:00+08:00', status: 'active' },
  { value: 'deliver', title: '落印交付', description: '完成检查后记录新的版本。', status: 'pending' },
];
const meta = {
  title: '二级组件/Timeline 时间线', component: MTimeline, tags: ['autodocs'], args: { label: '交付记录', items: entries },
  parameters: { docs: { description: { component: '按输入顺序呈现真实记录，以刻印节点和细轨区分等待、进行、完成与异常。时间使用原生time元素；内容插槽保持其原生交互，列表本身不抢焦点或自动播报。' } } },
  render: args => defineComponent({ components: { MTimeline }, setup: () => ({ args }), template: '<div style="max-width:680px"><MTimeline v-bind="args" /></div>' }),
} satisfies Meta<typeof MTimeline>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { items: [entries[0]!, { ...entries[1]!, title: '检查未完成', description: '补齐必要字段后可以重试。', status: 'error' }, entries[2]!] } };
export const Empty: Story = { args: { items: [] } };
export const WithAction: Story = { render: () => defineComponent({ components: { MTimeline, MButton }, setup: () => ({ entries, retried: ref(false) }), template: '<div class="kit-stack" style="max-width:680px"><MTimeline :items="entries" label="带操作的交付记录"><template #inspect><MButton variant="secondary" @click="retried = true">重新校准</MButton></template></MTimeline><p role="status">{{ retried ? \'已请求重新校准。\' : \'等待操作。\' }}</p></div>' }) };
export const LongContent: Story = { args: { items: [{ value: 'long', title: 'ArchiveWithoutArtificialTruncation'.repeat(3), description: '一段完整的项目记录，应当在窄屏自然换行，同时保留可读的层次与留白。'.repeat(3), time: '2026-11-04 10:30', status: 'active' }] } };
