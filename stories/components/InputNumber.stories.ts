import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MInputNumber from '../../src/components/MInputNumber.vue';
import MSlider from '../../src/components/MSlider.vue';
import MButton from '../../src/components/MButton.vue';

const meta = {
  title: '二级组件/InputNumber 数字输入', component: MInputNumber, tags: ['autodocs'],
  args: { modelValue: 12, label: '校准强度', min: 0, max: 100, step: 1, disabled: false, hint: '手动输入，或拨动两侧刻度；失焦后归入有效范围。' },
  parameters: { docs: { description: { component: '使用原生number输入与表单校验，拨片通过原生stepUp/stepDown对齐步进，避免0.1步长的二进制累积误差。清空请求null；无效临时草稿与组合输入不发出NaN。有效数值请求会夹取边界，编辑草稿可继续输入，失焦后显示规范值。父级拒绝更新时恢复受控值，后续操作仍可重试。name、required、readonly等原生属性传给实际input；readonly也停用拨片。' } } },
  render: args => defineComponent({
    components: { MInputNumber },
    setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; },
    template: '<div class="kit-stack" style="width:min(100%,440px)"><MInputNumber v-bind="args" v-model="value" /><p class="kit-muted">父模型：{{ value === null ? \'未设置\' : value }}</p></div>',
  }),
} satisfies Meta<typeof MInputNumber>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Decimal: Story = { name: '小数刻度', args: { modelValue: .2, label: '步进幅度', min: 0, max: 1, step: .1, hint: '每步0.1，支持原生方向键与直接编辑。' } };
export const Empty: Story = { name: '空值', args: { modelValue: null } };
export const Disabled: Story = { args: { disabled: true } };
export const Error: Story = { args: { error: '当前强度超出本次任务允许范围。' } };
export const Controlled: Story = {
  name: '受控请求与组合输入',
  render: () => defineComponent({
    components: { MInputNumber, MButton },
    setup() {
      const value = ref<number | null>(1.2), requests = ref(0), accepts = ref(false), hint = ref('父级暂不确认更新，可反复尝试同一次拨动。');
      function update(next: number | null) { requests.value++; if (accepts.value) value.value = next; }
      function input() { hint.value = '原生input已触发；父页面的帮助文字更新不应打断组合草稿。'; }
      return { value, requests, accepts, hint, update, input };
    },
    template: '<div class="kit-stack" style="width:min(100%,440px)"><MInputNumber :model-value="value" label="受控强度" :min="0" :max="3" :step=".1" :hint="hint" @update:model-value="update" @input="input" /><p role="status">更新请求：{{ requests }} 次 · 父模型：{{ value === null ? \'未设置\' : value }}</p><div><MButton variant="secondary" @click="accepts = !accepts">{{ accepts ? \'拒绝更新\' : \'接受更新\' }}</MButton></div></div>',
  }),
};
export const FormAttributes: Story = {
  name: '表单、只读与禁用',
  render: () => defineComponent({
    components: { MInputNumber, MSlider, MButton },
    setup() {
      const amount = ref<number | null>(null), level = ref(40), readonly = ref(false), disabled = ref(false), message = ref('尚未提交');
      function submit(event: Event) { const data = new FormData(event.target as HTMLFormElement); message.value = `提交数值：${data.get('duration') ?? '未提交'}；滑轨：${data.get('level') ?? '未提交'}`; }
      return { amount, level, readonly, disabled, message, submit };
    },
    template: '<form class="kit-stack" style="width:min(100%,480px)" @submit.prevent="submit"><MInputNumber v-model="amount" label="检查时长" name="duration" autocomplete="off" required placeholder="请填写时长" :min="0" :max="3" :step=".1" :readonly="readonly" :disabled="disabled" hint="必填，范围0至3，步长0.1。" /><MSlider v-model="level" label="检查进度" name="level" :min="0" :max="100" :step="10" :disabled="disabled" /><div class="kit-row"><MButton type="submit">提交校准</MButton><MButton variant="secondary" @click="readonly = !readonly">{{ readonly ? \'允许编辑\' : \'设为只读\' }}</MButton><MButton variant="secondary" @click="disabled = !disabled">{{ disabled ? \'启用控件\' : \'禁用控件\' }}</MButton></div><p role="status">{{ message }}</p></form>',
  }),
};
