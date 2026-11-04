import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MCombobox from '../../src/components/MCombobox.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';
import type { MChoiceOption } from '../../src/components/types';

const options: MChoiceOption[] = [
  { value: 'ink', label: '朱砂落印', description: '有力度的归位与清晰的完成反馈。' },
  { value: 'jade', label: '青玉回响', description: '在沉静底色中保留一线回响。' },
  { value: 'locked', label: '旧卷封存', description: '这份方案暂不可选择。', disabled: true },
  { value: 'steel', label: '冷钢构形', description: '以切面、滑轨与刻度形成秩序。' },
  { value: 'paper', label: '素纸留白', description: '为长内容留下舒展的阅读空间。' },
];
const meta = {
  title: '二级组件/Combobox 搜索选择', component: MCombobox, tags: ['autodocs'],
  args: { modelValue: '', options, label: '演示方案', placeholder: '输入名称或标识查找', hint: '方向键浏览候选，Enter 选择，Escape 放弃本次查询。', disabled: false, clearable: true },
  parameters: { docs: { description: { component: '可编辑的单选搜索框，输入只用于过滤，模型始终是已选择选项的 value。焦点保留在输入框，通过 aria-activedescendant 浏览候选；展开后可用上下键、Home/End 导航，Enter 确认，Escape 恢复原选择，Tab 自然离开。关闭时 Home/End、修饰键和中文组合输入保持原生编辑行为。清空按钮或删除全部文字可请求清空。父级可以拒绝更新；原生 name/form 提交所选值，required 验证真实选项。需要原生 Popover API。' } } },
  render: args => defineComponent({
    components: { MCombobox, MInput },
    setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; },
    template: '<main class="kit-stack" style="width:min(100%,480px)"><h1 style="font:500 30px/1.4 var(--ui-font-family-display)">择一份章法，再落笔。</h1><MCombobox v-bind="args" v-model="value" /><p class="kit-muted">当前方案：{{ value || "尚未选择" }}</p><div style="margin-top:330px"><MInput label="候选外部备注" placeholder="继续编辑其他内容" /></div></main>',
  }),
} satisfies Meta<typeof MCombobox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { modelValue: 'ink' } };
export const Disabled: Story = { args: { modelValue: 'ink', disabled: true } };
export const Error: Story = { args: { error: '请从候选中选择一份方案。' } };
export const Empty: Story = { args: { options: [] } };
export const Controlled: Story = {
  name: '受控请求与程序更新',
  render: () => defineComponent({
    components: { MCombobox, MButton },
    setup() { const value = ref('ink'); const requests = ref(0); const accepting = ref(false); function request(next: string) { requests.value++; if (accepting.value) value.value = next; } return { value, requests, accepting, options, request }; },
    template: '<main class="kit-stack" style="max-width:480px"><MCombobox :model-value="value" :options="options" label="受控方案" @update:model-value="request" /><p role="status">更新请求：{{ requests }} 次 · 父模型：{{ value }}</p><div class="kit-row"><MButton variant="secondary" @click="accepting = !accepting">{{ accepting ? "改为拒绝更新" : "接受后续更新" }}</MButton><MButton variant="secondary" @click="value = value === \'paper\' ? \'ink\' : \'paper\'">程序切换方案</MButton></div></main>',
  }),
};
export const Composition: Story = {
  name: '中文组合输入与提示更新',
  render: () => defineComponent({
    components: { MCombobox },
    setup() { const value = ref('ink'); const updates = ref(0); const hint = ref('组合输入期间不会提交候选。'); return { value, updates, hint, options }; },
    template: '<main class="kit-stack" style="max-width:480px"><MCombobox v-model="value" :options="options" label="中文方案" :hint="hint" @input="hint = \'提示已更新，未提交文字继续保留。\'" @update:model-value="updates++" /><p>父模型：{{ value }} · 模型更新：{{ updates }} 次</p></main>',
  }),
};
export const FormAttributes: Story = {
  name: '原生表单、只读与禁用',
  render: () => defineComponent({
    components: { MCombobox, MButton },
    setup() {
      const value = ref(''); const read = ref('ink'); const disabled = ref('jade'); const message = ref('尚未提交'); const formId = `combo-form-${useId()}`;
      function submit(event: Event) { const data = new FormData(event.target as HTMLFormElement); message.value = `提交方案：${data.get('preset')} · 只读：${data.get('readonlyPreset')} · 禁用：${data.has('disabledPreset') ? '存在' : '未提交'}`; }
      return { value, read, disabled, message, options, formId, submit };
    },
    template: '<form :id="formId" class="kit-stack" style="max-width:480px" @submit.prevent="submit"><MCombobox v-model="value" :options="options" label="交付方案" name="preset" required /><MCombobox v-model="read" :options="options" label="只读方案" name="readonlyPreset" readonly /><MCombobox v-model="disabled" :options="options" label="禁用方案" name="disabledPreset" disabled /><div class="kit-row" style="margin-top:100px"><MButton type="submit">提交交付方案</MButton><MButton type="reset" variant="secondary" @click="value = \'\'">重置方案</MButton></div><p role="status">{{ message }}</p></form>',
  }),
};
export const LongContent: Story = {
  name: '长清单与边缘避让',
  args: { label: '长清单方案', options: Array.from({ length: 20 }, (_, index) => ({ value: `preset-${index + 1}`, label: index === 19 ? '最后一份方案' : `${index + 1} · 方案名称自然换行 LongReferenceWithoutArtificialClipping`, description: '每份方案都保留完整说明，沿刻度向下查看。', disabled: index === 4 })) },
};
export const UnmountCleanup: Story = {
  name: '卸载与重新挂载',
  render: () => defineComponent({
    components: { MCombobox, MButton }, setup: () => ({ mounted: ref(true), value: ref('ink'), options }),
    template: '<main class="kit-stack" style="max-width:480px"><div><MButton variant="secondary" @click="mounted = !mounted">{{ mounted ? "卸载候选组件" : "重新挂载候选组件" }}</MButton></div><MCombobox v-if="mounted" v-model="value" :options="options" label="可卸载方案" /><p class="kit-muted">候选展开时也可以卸载；新的实例独立管理定位与焦点。</p></main>',
  }),
};
