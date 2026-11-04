import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MDatePicker from '../../src/components/MDatePicker.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';

const meta = {
  title: '二级组件/DatePicker 日期历盘', component: MDatePicker, tags: ['autodocs'],
  args: { modelValue: '2024-02-29', label: '归档日期', hint: '输入 YYYY-MM-DD，Enter 确认；也可打开历盘逐日校准。', disabled: false, clearable: true },
  parameters: { docs: { description: { component: 'ISO 文本输入与独立日历按钮组成原生表单控件，支持 0001 至 9999 年的整数公历、周一始历。合法草稿在 Enter 或离开组件时请求更新，无效草稿保留并阻止表单校验；父级拒绝后恢复父值，后续仍可重试。历盘为非模态 region 与 grid，焦点日期和选中日期独立；方向键逐日/周，Home/End 到周首末，PageUp/Down 换月，Shift 配合换年，Escape 回输入，Tab 自然离开。name、required、form、readonly 等属性传给实际文本输入；错误的范围配置会明示并禁止选日。' } } },
  render: args => defineComponent({
    components: { MDatePicker, MInput },
    setup() { const value = ref(args.modelValue); const note = ref(''); watch(() => args.modelValue, next => { value.value = next; }); return { args, value, note }; },
    template: '<main class="kit-stack" style="width:min(100%,480px)"><MDatePicker v-bind="args" v-model="value" /><p class="kit-muted">父日期：{{ value || \'尚未选择\' }}</p><MInput v-model="note" label="日历外部备注" /></main>',
  }),
} satisfies Meta<typeof MDatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Range: Story = { name: '日期边界', args: { label: '封卷日期', min: '2024-02-27', max: '2024-03-03', hint: '仅允许 2024-02-27 至 2024-03-03，边界变化不擅自改写父模型。' } };
export const BoundaryYears: Story = {
  name: '首末年份',
  render: () => defineComponent({
    components: { MDatePicker, MButton },
    setup() { const value = ref('0001-01-01'); return { value, toggle: () => { value.value = value.value === '0001-01-01' ? '9999-12-31' : '0001-01-01'; } }; },
    template: '<main class="kit-stack" style="width:min(100%,480px)"><MDatePicker v-model="value" label="历法边界" hint="0001 年至 9999 年，所有计算保持整数公历。"/><div><MButton variant="secondary" @click="toggle">切换首末年份</MButton></div><p class="kit-muted">父日期：{{ value }}</p></main>',
  }),
};
export const InvalidRange: Story = { name: '配置错误', args: { label: '冲突范围', modelValue: '2024-02-15', min: '2024-03-01', max: '2024-02-01' } };
export const Disabled: Story = { args: { disabled: true } };
export const Error: Story = { args: { error: '这一天尚未通过归档校验。' } };
export const Controlled: Story = {
  name: '受控更新',
  render: () => defineComponent({
    components: { MDatePicker, MButton },
    setup() {
      const value = ref('2024-02-29'); const requests = ref(0); const accepts = ref(false);
      function update(next: string) { requests.value++; if (accepts.value) value.value = next; }
      return { value, requests, accepts, update, program: () => { value.value = '2025-01-31'; }, invalid: () => { value.value = '2025-02-30'; } };
    },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MDatePicker :model-value="value" label="受控日期" @update:model-value="update" hint="父级可拒绝请求，再次输入或选日仍可重试。"/><div class="kit-row"><MButton variant="secondary" @click="accepts = !accepts">{{ accepts ? \'拒绝后续更新\' : \'接受后续更新\' }}</MButton><MButton variant="ghost" @click="program">程序设置日期</MButton><MButton variant="ghost" @click="invalid">设为非法父值</MButton></div><p role="status">更新请求：{{ requests }} 次 · 父日期：{{ value }}</p></main>',
  }),
};
export const FormAttributes: Story = {
  name: '原生表单',
  render: () => defineComponent({
    components: { MDatePicker, MButton },
    setup() {
      const formId = `date-form-${useId()}`; const value = ref(''); const fixed = ref('2024-03-02');
      const locked = ref(false); const result = ref('尚未提交');
      function submit(event: Event) { const data = new FormData(event.target as HTMLFormElement); result.value = `提交日期：${data.get('archive') ?? '未提交'} · 固定：${data.get('fixed')} · 禁用：${data.get('ignored') ?? '未提交'}`; }
      function reset() { value.value = ''; fixed.value = '2024-03-02'; result.value = '尚未提交'; }
      return { formId, value, fixed, locked, result, submit, reset };
    },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MDatePicker v-model="value" label="交付日期" name="archive" :form="formId" required :readonly="locked" autocomplete="off" hint="此输入在 form 外，通过 form 属性归属；必填，日期草稿参与原生校验。"/><form :id="formId" class="kit-stack" @submit.prevent="submit" @reset="reset"><MDatePicker v-model="fixed" label="只读日期" name="fixed" readonly/><MDatePicker model-value="2024-03-03" label="禁用日期" name="ignored" disabled/><div class="kit-row"><MButton type="submit">提交日期表单</MButton><MButton type="reset" variant="secondary">重置日期表单</MButton><MButton variant="ghost" @click="locked = !locked">{{ locked ? \'允许编辑交付日期\' : \'锁定交付日期\' }}</MButton></div></form><p role="status">{{ result }}</p></main>',
  }),
};
export const CompositionAndLifecycle: Story = {
  name: '中文草稿与卸载',
  render: () => defineComponent({
    components: { MDatePicker, MButton, MInput },
    setup() {
      const value = ref('2024-02-29'); const requests = ref(0); const shown = ref(true); const note = ref('');
      const hint = ref('输入法期间不会提交未完成文字。');
      function update(next: string) { value.value = next; requests.value++; }
      return { value, requests, shown, note, hint, update, changed: () => { hint.value = '提示已更新，未提交草稿继续保留。'; } };
    },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MDatePicker v-if="shown" :model-value="value" label="中文草稿日期" :hint="hint" @input="changed" @update:model-value="update"/><div><MButton variant="secondary" @click="shown = !shown">{{ shown ? \'卸载日期组件\' : \'重新挂载日期组件\' }}</MButton></div><MInput v-model="note" label="历盘外部字段"/><p role="status">父日期：{{ value }} · 更新：{{ requests }} 次</p></main>',
  }),
};
