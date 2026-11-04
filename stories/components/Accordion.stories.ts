import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MAccordion from '../../src/components/MAccordion.vue';
import MInput from '../../src/components/MInput.vue';
import MSwitch from '../../src/components/MSwitch.vue';
import MButton from '../../src/components/MButton.vue';
import type { MAccordionItem } from '../../src/components/types';

const items: MAccordionItem[] = [
  { value: 'archive', label: '配置档案', description: '先确认名称，再开始整理内容。' },
  { value: 'workflow', label: '编辑说明', description: '切换卷页后，未提交内容仍会保留。' },
  { value: 'locked', label: '已归档条目', description: '这份内容目前不可展开。', disabled: true },
  { value: 'motion', label: '动效偏好', description: '让交互节奏跟随自己的习惯。' },
];
const meta = {
  title: '二级组件/Accordion 折叠面板', component: MAccordion, tags: ['autodocs'],
  args: { modelValue: ['archive'], items, label: '工作台使用说明', multiple: false, headingTag: 'h3' },
  argTypes: { headingTag: { control: 'inline-radio', options: ['h2', 'h3', 'h4'] } },
  parameters: { docs: { description: { component: '机械折脊与卷页内容组成的受控折叠面板。modelValue 是 value 数组；默认只显示首个有效展开项，multiple 允许多项同时展开。每组 value 保持唯一，禁用项不会展开。展开/收起保留面板挂载，隐藏内容不参与键盘顺序。方向键与 Home/End 移动标题按钮焦点，Enter/空格开合；面板可用同名插槽或默认插槽的 item/expanded。兜底不会主动回写父模型。' } } },
  render: args => defineComponent({
    components: { MAccordion, MInput, MSwitch },
    setup() { const value = ref([...args.modelValue]); const name = ref('观山 · 设计档案'); const reduced = ref(false); watch(() => args.modelValue, next => { value.value = [...next]; }); return { args, value, name, reduced }; },
    template: `<main class="kit-stack" style="max-width:760px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">卷页有序，内容有藏。</h1><p class="kit-muted">展开一页细看，收拢之后仍保留原来的内容。</p><MAccordion v-bind="args" v-model="value"><template #archive><div class="kit-stack" style="gap:16px"><p>这份档案会随着当前卷页保留，不会因收起重新建立表单。</p><MInput v-model="name" label="档案名称" name="archiveName" /></div></template><template #workflow><div class="kit-stack" style="gap:14px"><p>先编辑名称，再切换到其他条目，重新展开便能继续。</p><a href="#archive-reference">查看档案规范</a></div></template><template #motion><MSwitch v-model="reduced" label="减少动态效果" hint="此处演示表单状态；全局动效由工具栏设置。" /></template><template #default="{ item }"><p>{{ item.label }} 的说明内容。</p></template></MAccordion><p class="kit-muted kit-mono" role="status">展开项：{{ value.length ? value.join(', ') : '无' }}</p></main>`,
  }),
} satisfies Meta<typeof MAccordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Multiple: Story = { name: '多项展开', args: { multiple: true, modelValue: ['archive', 'motion'] } };
export const InvalidValues: Story = { name: '无效值与单项兜底', args: { modelValue: ['missing', 'locked', 'archive', 'motion'] } };
export const Controlled: Story = {
  name: '父级确认开合',
  render: () => defineComponent({
    components: { MAccordion, MButton },
    setup() { const value = ref(['archive']); const requested = ref<string[]>([]); const count = ref(0); function request(next: string[]) { requested.value = next; count.value++; } return { items, value, requested, count, request }; },
    template: `<main class="kit-stack" style="max-width:760px"><MAccordion :model-value="value" :items="items" label="受控说明" @update:model-value="request"><template #default="{ item }"><p>{{ item.label }} 的完整说明。</p></template></MAccordion><div><MButton variant="secondary" @click="value = [...requested]">接受最近请求</MButton></div><p role="status" class="kit-muted">请求：{{ count }} 次；父模型：{{ value.length ? value.join(', ') : '无' }}</p></main>`,
  }),
};
export const LongLabels: Story = { name: '长标题与窄屏', args: { items: [{ value: 'archive', label: '卷页标题应当自然换行，不把理解内容所需的信息裁掉', description: 'LongReferenceWithoutArtificialTruncation'.repeat(3) }, ...items.slice(1)] } };
export const Empty: Story = { name: '空目录', args: { items: [], modelValue: [] } };
