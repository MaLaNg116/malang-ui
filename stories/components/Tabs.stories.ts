import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, defineComponent, ref, watch } from 'vue';
import UiTabs from '../../src/components/UiTabs.vue';
import UiInput from '../../src/components/UiInput.vue';
import UiButton from '../../src/components/UiButton.vue';
import type { UiTabItem } from '../../src/components/types';

const items: UiTabItem[] = [
  { value: 'preview', label: '组件示例' },
  { value: 'usage', label: '使用方式' },
  { value: 'spec', label: '交互约定' },
];

const meta = {
  title: '基础组件/Tabs 标签页',
  component: UiTabs,
  tags: ['autodocs'],
  args: { modelValue: 'preview', items, label: '组件文档', activationMode: 'automatic' },
  argTypes: { activationMode: { control: 'inline-radio', options: ['automatic', 'manual'] } },
  parameters: {
    docs: { description: { component: '横向标签页支持方向键、Home/End 和禁用跳过。automatic 随焦点切换，manual 由 Enter/空格确认。同组 value 须唯一，每个 value 可对应同名面板插槽，也可用默认插槽的 item/active。面板保持挂载；传入不可用的 value 时展示第一个可用项，不会仅因兜底主动发出模型更新。' } },
  },
  render: args => defineComponent({
    components: { UiTabs, UiInput, UiButton },
    setup() {
      const value = ref(args.modelValue);
      const name = ref('观山 · 设计档案');
      const notice = ref('');
      watch(() => args.modelValue, next => { value.value = next; });
      return { args, value, name, notice };
    },
    template: `<div class="kit-stack" style="max-width:800px">
      <p class="kit-muted">{{ args.activationMode === 'manual' ? '方向键移动焦点；按 Enter 或空格切换。' : '方向键移动焦点，同时切换内容。' }}</p>
      <UiTabs v-bind="args" v-model="value">
        <template #preview><div class="kit-stack"><h2>从一个真实组件开始</h2><p class="kit-muted">编辑内容后切换标签，再回来查看；表单状态会被保留。</p><UiInput v-model="name" label="演示项目名称" /><div><UiButton @click="notice = '草稿已在当前预览中保存。'">保存草稿</UiButton></div><p role="status" aria-label="草稿保存结果" class="kit-muted">{{ notice }}</p></div></template>
        <template #usage><div class="kit-stack"><h2>以具名插槽组织内容</h2><p class="kit-muted">使用 v-model 控制选中项，items 定义顺序、标签和禁用状态，面板插槽与 value 对应。</p><code>&lt;UiTabs v-model="active" :items="items" label="组件文档" /&gt;</code></div></template>
        <template #spec><div class="kit-stack"><h2>切换有边界，也有落点</h2><p class="kit-muted">同组只有一个标签处于 Tab 顺序中。方向键循环移动并跳过禁用项；Tab 将焦点送入内容区。</p></div></template>
        <template #default="{ item }"><p class="kit-muted">{{ item.label }} 的内容面板。</p></template>
      </UiTabs>
      <p class="kit-muted kit-mono" role="status">当前值：{{ value }}</p>
    </div>`,
  }),
} satisfies Meta<typeof UiTabs>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Manual: Story = { args: { activationMode: 'manual' } };
export const DisabledAndLongLabels: Story = {
  args: {
    items: [
      { value: 'preview', label: '组件示例' },
      { value: 'disabled', label: '暂未开放', disabled: true },
      { value: 'usage', label: '实际项目中的完整使用方式' },
      { value: 'spec', label: '交互与可访问性约定' },
      { value: 'release', label: '发布与迁移记录' },
    ],
  },
};

export const DynamicItems: Story = {
  render: () => defineComponent({
    components: { UiTabs, UiButton },
    setup() {
      const value = ref('preview');
      const disabled = ref(false);
      const empty = ref(false);
      const dynamicItems = computed(() => empty.value ? [] : items.map(item => ({ ...item, disabled: disabled.value && item.value === 'preview' })));
      return { value, disabled, empty, dynamicItems };
    },
    template: `<div class="kit-stack" style="max-width:760px">
      <div class="kit-row"><UiButton variant="secondary" @click="disabled = !disabled">{{ disabled ? '恢复首项' : '禁用首项' }}</UiButton><UiButton variant="secondary" @click="empty = !empty">{{ empty ? '恢复目录' : '清空目录' }}</UiButton></div>
      <p class="kit-muted">禁用或移除选中项时显示首个可用面板。仅展示兜底不更改父级模型；显式选择时更新模型。</p>
      <UiTabs v-model="value" :items="dynamicItems" label="动态文档目录"><template #default="{ item }"><h2>{{ item.label }}</h2><p class="kit-muted" style="margin-top:12px">这是 {{ item.value }} 的面板。</p></template></UiTabs>
      <p v-if="empty" class="kit-muted" role="status">目录为空，暂无可用标签。</p><p class="kit-muted kit-mono">父级值：{{ value }}</p>
    </div>`,
  }),
};

export const AllDisabled: Story = { args: { items: items.map(item => ({ ...item, disabled: true })) } };

export const Controlled: Story = {
  name: '受控更新请求',
  render: () => defineComponent({
    components: { UiTabs, UiButton },
    setup() {
      const value = ref('preview');
      const updates = ref(0);
      const requested = ref('');
      function record(next: string) { updates.value += 1; requested.value = next; }
      function reset() { value.value = 'preview'; updates.value = 0; requested.value = ''; }
      return { items, value, updates, requested, record, reset };
    },
    template: `<div class="kit-stack" style="max-width:760px">
      <p class="kit-muted">父级仅记录请求，直到手动确认才改变选中值。每次指针点击或键盘确认都应只发送一个请求，再次操作可以重试。</p>
      <UiTabs :model-value="value" :items="items" label="受控组件文档" @update:model-value="record"><template #default="{ item }"><h2>{{ item.label }}</h2><p class="kit-muted" style="margin-top:12px">父级确认后才切换显示内容。</p></template></UiTabs>
      <p class="kit-muted kit-mono" role="status">更新请求：{{ updates }} 次；最近请求：{{ requested || '无' }}；父级值：{{ value }}</p>
      <div class="kit-row"><UiButton :disabled="!requested" @click="value = requested">确认最近请求</UiButton><UiButton variant="secondary" @click="reset">清零请求</UiButton></div>
    </div>`,
  }),
};
