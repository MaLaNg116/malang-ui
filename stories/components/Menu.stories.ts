import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MMenu from '../../src/components/MMenu.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';
import type { MMenuItem } from '../../src/components/types';

const items: MMenuItem[] = [
  { value: 'overview', label: '归档总览', href: '#overview' },
  { value: 'archive', label: '资产归档', href: '#ignored-group-target', children: [
    { value: 'images', label: '图像资料', href: '#images' },
    { value: 'motion', label: '动态编排' },
    { value: 'locked', label: '封存入口', href: '#locked', disabled: true },
  ] },
  { value: 'settings', label: '工作台设置' },
];
const meta = {
  title: '二级组件/Menu 导航菜单', component: MMenu, tags: ['autodocs'],
  args: { modelValue: 'overview', expandedValues: ['archive'], items, label: '档案工作台导航', disabled: false },
  parameters: { docs: { description: { component: '应用导航使用命名 nav、嵌套列表与原生链接/按钮，不使用命令菜单的 menu 角色。value 在整棵导航内唯一；非空 children 节点仅负责展开，href 不生效；空 children 为叶节点。modelValue 与 expandedValues 均受控，拒绝请求可重试，数据更新不会主动清洗父模型。展开状态允许多组并存，收起保留后代展开状态。普通左键或键盘激活叶节点发出 select(value, MouseEvent) 与选择请求；父级可在 select 中 preventDefault 接管路由，Ctrl/⌘/Shift/Alt 与中键保持链接原生行为且不请求选中。禁用项不激活，禁用父节点只禁用自身，已经展开的子节点仍独立可用。Tab 依次经过可见入口，Escape 收起最近可用分组，生效后恢复其中焦点；外部焦点不被抢走。' } } },
  render: args => defineComponent({
    components: { MMenu },
    setup() {
      const value = ref(args.modelValue), expanded = ref([...args.expandedValues]), message = ref('尚未切换入口');
      watch(() => args.modelValue, next => { value.value = next; });
      watch(() => args.expandedValues, next => { expanded.value = [...next]; });
      return { args, value, expanded, message };
    },
    template: `<main class="kit-stack" style="max-width:480px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">循轨入卷，各有其门。</h1><p class="kit-muted">链接保留浏览器习惯，分组只负责展开。当前入口与键盘焦点各有清晰落点。</p><MMenu v-bind="args" v-model="value" v-model:expanded-values="expanded" @select="message = '激活入口：' + $event" /><p role="status" class="kit-muted">当前入口：{{ value || '无' }}；{{ message }}</p><p id="overview" class="kit-muted">总览参考位置</p><p id="images" class="kit-muted">图像参考位置</p></main>`,
  }),
} satisfies Meta<typeof MMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const LongLabels: Story = { name: '长中文与窄屏', args: { items: [{ value: 'overview', label: '归档导航的标题可以自然换行，保持每个入口的完整含义', href: '#overview' }, { value: 'archive', label: '设计与动作素材归档资料的完整目录', children: [{ value: 'long', label: 'LongAssetArchiveReferenceWithoutArtificialTruncation'.repeat(3), href: '#long' }] }] } };
export const Empty: Story = { args: { items: [], modelValue: null, expandedValues: [] } };
export const InvalidValues: Story = { name: '无效模型与展开值', args: { modelValue: 'missing', expandedValues: ['missing', 'overview', 'archive', 'archive'] } };
export const Controlled: Story = {
  name: '父级确认与路由接管',
  render: () => defineComponent({
    components: { MMenu, MButton },
    setup() {
      const value = ref<string | null>('overview'), expanded = ref(['archive']);
      const requested = ref<string>(), requestedExpanded = ref<string[]>([]), selections = ref(0), expansions = ref(0), prevented = ref(false);
      function request(next: string) { requested.value = next; selections.value++; }
      function requestExpanded(next: string[]) { requestedExpanded.value = next; expansions.value++; }
      function route(_value: string, event: MouseEvent) { event.preventDefault(); prevented.value = event.defaultPrevented; }
      return { items, value, expanded, requested, requestedExpanded, selections, expansions, prevented, request, requestExpanded, route };
    },
    template: `<main class="kit-stack" style="max-width:480px"><MMenu :items="items" :model-value="value" :expanded-values="expanded" label="受控档案导航" @update:model-value="request" @update:expanded-values="requestExpanded" @select="route" /><div class="kit-row"><MButton @click="value = requested || value">接受导航请求</MButton><MButton variant="secondary" @click="expanded = [...requestedExpanded]">接受展开请求</MButton></div><p role="status">选择请求：{{ selections }} 次；展开请求：{{ expansions }} 次；当前：{{ value }}；已接管链接：{{ prevented }}</p></main>`,
  }),
};
export const Dynamic: Story = {
  name: '数据更新与焦点归位',
  render: () => defineComponent({
    components: { MMenu, MButton, MInput },
    setup() {
      const data = ref([...items]), value = ref<string | null>('images'), expanded = ref(['archive']), draft = ref('保留这份编辑草稿');
      function remove() { data.value = data.value.map(item => item.value === 'archive' ? { ...item, children: item.children?.filter(child => child.value !== 'images') } : item); }
      return { data, value, expanded, draft, remove };
    },
    template: `<main class="kit-stack" style="max-width:480px"><MMenu v-model="value" v-model:expanded-values="expanded" :items="data" label="动态档案导航" /><div class="kit-row"><MButton variant="secondary" @mousedown.prevent @click="expanded = []">从外部收起分组</MButton><MButton variant="secondary" @mousedown.prevent @click="remove">移除图像入口</MButton><MButton variant="secondary" @mousedown.prevent @click="data = [...data].reverse()">重排导航</MButton></div><MInput v-model="draft" label="导航外部草稿" /><p role="status">父模型：{{ value }}；展开：{{ expanded.join(', ') || '无' }}</p><p class="kit-muted">鼠标调整数据时保留原焦点，便于观察节点隐藏、移除后的归位。外部草稿中的焦点与文本不受影响。</p></main>`,
  }),
};
