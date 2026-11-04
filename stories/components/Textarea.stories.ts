import { defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MTextarea from '../../src/components/MTextarea.vue';
import MButton from '../../src/components/MButton.vue';

const meta = {
  title: '基础组件/Textarea 多行输入', component: MTextarea, tags: ['autodocs'],
  args: { modelValue: '', label: '项目说明', hint: '写下想法，可向下拖动调整输入区域。', rows: 4, disabled: false },
  render: args => defineComponent({ components: { MTextarea }, setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; }, template: '<div class="kit-stack" style="width:min(100%,560px)"><MTextarea v-bind="args" v-model="value" placeholder="这一次，想做些什么？" /><p class="kit-muted">已输入 {{ value.length }} 个字符</p></div>' }),
} satisfies Meta<typeof MTextarea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { modelValue: '一份说明', error: '请再补充一些项目背景。' } };
export const Disabled: Story = { args: { modelValue: '这份说明已归档。', disabled: true } };
export const CompositionWithChangingHint: Story = {
  name: '中文组合输入与父级更新',
  render: () => defineComponent({
    components: { MTextarea },
    setup() { const value = ref(''); const hint = ref('使用中文输入法开始输入。'); const updates = ref(0); function start() { hint.value = '提示已更新，尚未提交的中文仍应保留。'; } function update(next: string) { value.value = next; updates.value++; } return { value, hint, updates, start, update }; },
    template: '<div class="kit-stack" style="max-width:560px"><MTextarea :model-value="value" label="中文项目说明" :hint="hint" @compositionstart="start" @update:model-value="update" /><p data-testid="textarea-value">已提交：{{ value || "尚未提交" }}</p><p data-testid="textarea-updates">模型更新：{{ updates }} 次</p></div>',
  }),
};
export const FormAttributes: Story = {
  name: '原生表单提交',
  render: () => defineComponent({
    components: { MTextarea, MButton },
    setup() { const value = ref(''); const message = ref('尚未提交'); function submit(event: Event) { message.value = `提交说明：${new FormData(event.target as HTMLFormElement).get('notes')}`; } return { value, message, submit }; },
    template: '<form class="kit-stack" style="max-width:560px" @submit.prevent="submit"><MTextarea v-model="value" label="归档说明" name="notes" maxlength="200" :rows="3" required autocomplete="off" hint="最多 200 个字符。" /><div><MButton type="submit">提交说明</MButton></div><p role="status">{{ message }}</p></form>',
  }),
};
