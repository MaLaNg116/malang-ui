import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MTree from '../../src/components/MTree.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';
import type { MTreeNode } from '../../src/components/types';

const items: MTreeNode[] = [
  { value: 'assets', label: '素材总卷', children: [
    { value: 'design', label: '设计资料', children: [{ value: 'alpha', label: 'Alpha · 水墨界面' }, { value: 'beta', label: 'Beta · 机械切面' }] },
    { value: 'audio', label: 'Audio · 动作音效' },
  ] },
  { value: 'locked', label: '封存目录', disabled: true, children: [{ value: 'legacy', label: '封存子卷' }] },
  { value: 'release', label: '发布记录' },
];
const meta = {
  title: '二级组件/Tree 层级目录', component: MTree, tags: ['autodocs'],
  args: { modelValue: 'alpha', expandedValues: ['assets', 'design'], items, label: '资产归档目录', disabled: false, checkable:false,checkedValues:[] as string[],checkStrictly:false,multiple:false,selectedValues:[] as string[] },
  parameters: { docs: { description: { component: '单选受控树。value 在整棵树唯一稳定；children 非空才是可展开节点。modelValue 与 expandedValues 分别控制选择和展开，不自动回写无效值，不因收起清除后代状态。焦点与选择独立：上下/Home/End 只浏览可见节点，右键展开或进入子级，左键收起或回父级，Enter/空格选择；点击节点文字选择，点击铰链仅开合。Tab 只有一个停靠点，重新进入时优先选中可见节点或其最近可见祖先；700ms 字符前缀查找支持重复字符轮换，不截获组合输入和修饰键。禁用节点仍可被方向键发现，但不能选择或开合；禁用不级联，其已展开子级仍独立可用；全局 disabled 阻止所有选择和展开请求，仍可浏览。模型更新不抢外部焦点，焦点节点隐藏/移除时回到最近可见祖先或相邻节点。空树保留命名的键盘停靠点。checkable 开启独立复选：Space 勾选，Enter 选择；checkedValues 控制联动与半选，checkStrictly 切为逐项独立。禁用节点阻断批量复选传播，其启用子级仍可独立操作。multiple 与 selectedValues 提供多项选择，选择和复选互不修改；仍保留一个键盘停靠点。不包含拖拽、异步加载或虚拟滚动。' } } },
  render: args => defineComponent({
    components: { MTree },
    setup() {
      const value = ref(args.modelValue), expanded = ref([...args.expandedValues]), checked=ref([...(args.checkedValues??[])]), selections=ref([...(args.selectedValues??[])]);
      watch(() => args.modelValue, next => { value.value = next; });
      watch(() => args.expandedValues, next => { expanded.value = [...next]; });
      watch(() => args.checkedValues, next => { checked.value = [...next??[]]; });watch(() => args.selectedValues, next => { selections.value = [...next??[]]; });
      return { args, value, expanded,checked,selections };
    },
    template: `<main class="kit-stack" style="max-width:640px"><h1 style="font:500 30px/1.5 var(--ui-font-family-display)">沿脉寻卷，落点有印。</h1><p class="kit-muted">方向键浏览目录，Enter 确认选择。浏览时保留右侧内容，展开也不改动选中状态。</p><MTree v-bind="args" v-model="value" v-model:expanded-values="expanded" v-model:checked-values="checked" v-model:selected-values="selections" /><p v-if="args.checkable" data-tree-checked>{{ checked.join(', ') }}</p><p v-if="args.multiple" data-tree-selected>{{ selections.join(', ') }}</p><p role="status" class="kit-muted">已选择：{{ value || '无' }}；展开：{{ expanded.join(', ') || '无' }}</p></main>`,
  }),
} satisfies Meta<typeof MTree>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const DisabledParent: Story = { name: '禁用父级与独立子级', args: { modelValue: 'legacy', expandedValues: ['locked'] } };
export const LongLabels: Story = { name: '长中文与窄屏', args: { modelValue: 'long', expandedValues: ['assets', 'design'], items: [{ value: 'assets', label: '素材总卷中的目录名称可以自然换行，保留完整的信息', children: [{ value: 'design', label: '设计与动作素材归档资料的完整目录', children: [{ value: 'long', label: 'LongAssetArchiveReferenceWithoutArtificialTruncation'.repeat(3) }] }] }] } };
export const Empty: Story = { args: { modelValue: null, items: [], expandedValues: ['missing'] } };
export const Checkable:Story={name:'父子联动与半选',args:{checkable:true,checkedValues:['alpha']}};
export const StrictChecks:Story={name:'独立复选与禁用边界',args:{checkable:true,checkStrictly:true,checkedValues:['assets','locked']}};
export const Multiple:Story={name:'选择与复选分别受控',args:{checkable:true,multiple:true,selectedValues:['alpha','audio'],checkedValues:['beta']}};
export const ControlledChecks:Story={
  name:'复选请求可拒绝与重试',render:()=>defineComponent({components:{MTree,MButton},setup(){const checked=ref(['alpha']),selected=ref(['alpha']),expanded=ref(['assets','design','locked']),accept=ref(false),checks=ref(0),selections=ref(0);return{items,checked,selected,expanded,accept,checks,selections,onCheck:(values:string[])=>{checks.value++;if(accept.value)checked.value=values;},onSelect:(values:string[])=>{selections.value++;if(accept.value)selected.value=values;}};},template:`<main class="kit-stack" style="max-width:640px"><MTree :model-value="null" :items="items" v-model:expanded-values="expanded" checkable multiple :checked-values="checked" :selected-values="selected" label="复选受控目录" @update:checked-values="onCheck" @update:selected-values="onSelect"/><MButton variant="secondary" @click="accept=!accept">{{accept?'拒绝目录更新':'接受目录更新'}}</MButton><p data-tree-check-requests>复选请求 {{checks}}；选择请求 {{selections}}</p><output data-tree-check-model>{{JSON.stringify({checked,selected})}}</output></main>`}),
};
export const Controlled: Story = {
  name: '父级确认与无效值',
  render: () => defineComponent({
    components: { MTree, MButton },
    setup() {
      const value = ref<string | null>('missing'), expanded = ref(['assets', 'design', 'alpha', 'missing', 'assets']);
      const requested = ref<string>(), requestedExpanded = ref<string[]>([]), selections = ref(0), expansions = ref(0);
      function request(next: string) { requested.value = next; selections.value++; }
      function requestExpanded(next: string[]) { requestedExpanded.value = next; expansions.value++; }
      return { items, value, expanded, requested, requestedExpanded, selections, expansions, request, requestExpanded };
    },
    template: `<main class="kit-stack" style="max-width:640px"><MTree :items="items" :model-value="value" :expanded-values="expanded" label="受控资产目录" @update:model-value="request" @update:expanded-values="requestExpanded" /><div class="kit-row"><MButton @click="value = requested || value">接受目录选择</MButton><MButton variant="secondary" @click="expanded = [...requestedExpanded]">接受目录开合</MButton></div><p role="status">选择请求：{{ selections }} 次；展开请求：{{ expansions }} 次；父模型：{{ value }}</p></main>`,
  }),
};
export const Dynamic: Story = {
  name: '重排删除与隐藏焦点',
  render: () => defineComponent({
    components: { MTree, MButton, MInput },
    setup() {
      const data = ref([...items]), value = ref<string | null>('alpha'), expanded = ref(['assets', 'design']), draft = ref('保留目录外部草稿');
      function remove() { data.value = data.value.map(item => item.value === 'assets' ? { ...item, children: item.children?.map(child => child.value === 'design' ? { ...child, children: child.children?.filter(leaf => leaf.value !== 'alpha') } : child) } : item); }
      return { data, value, expanded, draft, remove };
    },
    template: `<main class="kit-stack" style="max-width:640px"><MTree v-model="value" v-model:expanded-values="expanded" :items="data" label="动态资产目录" /><div class="kit-row"><MButton variant="secondary" @mousedown.prevent @click="expanded = ['assets']">从外部收起设计资料</MButton><MButton variant="secondary" @mousedown.prevent @click="remove">移除水墨节点</MButton><MButton variant="secondary" @mousedown.prevent @click="data = [...data].reverse()">重排目录</MButton><MButton variant="secondary" @mousedown.prevent @click="data = []">清空目录</MButton></div><MInput v-model="draft" label="目录外部草稿" /><p role="status">父模型：{{ value }}；展开：{{ expanded.join(', ') || '无' }}</p><p class="kit-muted">鼠标调整保留原焦点；节点隐藏或移除时归位，外部编辑中的焦点保持原处。</p></main>`,
  }),
};
