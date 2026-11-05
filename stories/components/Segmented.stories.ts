import { computed, defineComponent, ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSegmented from '../../src/components/MSegmented.vue';
import { MButton, MInput } from '../../src';

const options = [
  { value: 'overview', label: '总览', description: '看清当前工作面。' },
  { value: 'locked', label: '审核', description: '暂未开放。', disabled: true },
  { value: 'canvas', label: '画布', description: '进入内容编排。' },
  { value: 'archive', label: '归档', description: '查看资料与版本。' },
];
const shortOptions = options.map(({ value, label, disabled }) => ({ value, label, disabled }));
const meta = {
  title: '基础组件/Segmented 分段选择', component: MSegmented, tags: ['autodocs'],
  args: { modelValue: 'overview', options, label: '工作视图', disabled: false, size: 'md', block: false, orientation: 'horizontal' },
  parameters: { docs: { description: { component: '机械滑轨上的原生单选组。fieldset / legend 提供分组，radio 保留 name、form、required 与 FormData；它表达一个值，不使用标签页语义。方向键跳过禁用项，左右遵循阅读方向，空格选择。选中滑块只跟随父模型，并在容器、标签与字体变化后重新测量。options.value 同组唯一；未匹配值保持无选择。原生 reset 后按当前父模型恢复，不自行改写业务值；需要清空时由父页面修改 modelValue。' } } },
  render: args => defineComponent({
    components: { MSegmented },
    setup() { const value = ref(args.modelValue); watch(() => args.modelValue, next => { value.value = next; }); return { args, value }; },
    template: '<main class="kit-stack" style="max-width:760px"><MSegmented v-bind="args" v-model="value"/><p class="kit-muted" data-segment-model>当前视图：{{ value || "未选择" }}</p></main>',
  }),
} satisfies Meta<typeof MSegmented>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const SizesAndOrientation: Story = { render: () => defineComponent({
  components: { MSegmented },
  setup: () => ({ options: shortOptions, small: ref('overview'), medium: ref('canvas'), large: ref('archive'), vertical: ref('canvas') }),
  template: '<main class="kit-stack" style="max-width:760px"><MSegmented v-model="small" :options="options" label="紧凑视图" size="sm"/><MSegmented v-model="medium" :options="options" label="常规视图" block/><MSegmented v-model="large" :options="options" label="宽松视图" size="lg"/><MSegmented v-model="vertical" :options="options" label="纵向工具" orientation="vertical" style="width:min(100%,320px)"/><MSegmented model-value="overview" :options="options" label="锁定视图" disabled/></main>',
}) };
export const Controlled: Story = { render: () => defineComponent({
  components: { MSegmented, MButton },
  setup() {
    const value = ref('overview'), accepting = ref(false), requests = ref(0), requested = ref('');
    function request(next: string) { requests.value++; requested.value = next; if (accepting.value) value.value = next; }
    return { options, value, accepting, requests, requested, request };
  },
  template: '<main class="kit-stack" style="max-width:760px"><MSegmented :model-value="value" :options="options" label="受控工作视图" @update:model-value="request"/><div class="kit-row"><MButton @click="accepting = !accepting">{{ accepting ? "暂停接受更新" : "允许更新" }}</MButton><MButton variant="secondary" @click="value = \'missing\'">设为不可用值</MButton><MButton variant="ghost" @click="value = \'overview\'">还原选择</MButton></div><p role="status">更新请求：{{ requests }} 次 · 父模型：{{ value }} · 最近请求：{{ requested || "无" }}</p></main>',
}) };
export const FormAttributes: Story = { render: () => defineComponent({
  components: { MSegmented, MButton, MInput },
  setup() {
    const form = ref<HTMLFormElement>(), value = ref(''), disabled = ref(false), requests = ref(0), title = ref('观山卷宗'), result = ref('尚未提交');
    const update = (next: string) => { requests.value++; value.value = next; };
    function submit(event: Event) { const data = new FormData(event.target as HTMLFormElement); result.value = `提交：${data.get('title')} · ${data.get('view') || '未提交视图'}`; }
    function clear() { value.value = ''; form.value?.reset(); }
    return { form, value, disabled, requests, title, result, options, update, submit, clear };
  },
  template: '<main class="kit-stack" style="max-width:760px"><form id="segmented-native-form" ref="form" class="kit-stack" @submit.prevent="submit"><MInput v-model="title" label="卷宗名称" name="title"/><div class="kit-row"><MButton type="submit">提交视图</MButton><MButton type="reset" variant="secondary">原生还原表单</MButton><MButton type="button" variant="ghost" @click="clear">清空选择</MButton><MButton type="button" variant="ghost" @click="disabled = !disabled">{{ disabled ? "启用分段" : "禁用分段" }}</MButton></div></form><MSegmented :model-value="value" :options="options" label="外部表单视图" name="view" form="segmented-native-form" required :disabled="disabled" @update:model-value="update"/><p class="kit-muted" data-segment-form-owner>父模型：{{ value || "未选择" }} · 更新请求：{{ requests }} 次</p><output role="status">{{ result }}</output></main>',
}) };
export const Responsive: Story = { render: () => defineComponent({
  components: { MSegmented, MButton },
  setup() {
    const value = ref('archive'), narrow = ref(false), long = ref(false), large = ref(false), rtl = ref(false), mounted = ref(true);
    const responsiveOptions = computed(() => shortOptions.map(option => ({ ...option, label: long.value && option.value === 'archive' ? 'ArchiveWithoutArtificialClipping'.repeat(3) : option.label })));
    const stageStyle = computed(() => ({ width: narrow.value ? '280px' : '660px', maxWidth: '100%', minWidth: '0', '--ui-font-size-body': large.value ? '23px' : '14px' }));
    return { value, narrow, long, large, rtl, mounted, responsiveOptions, stageStyle };
  },
  template: '<main class="kit-stack" style="max-width:840px;grid-template-columns:minmax(0,1fr)"><div class="kit-row"><MButton @click="narrow = !narrow">切换容器宽度</MButton><MButton variant="secondary" @click="long = !long">切换长标签</MButton><MButton variant="secondary" @click="large = !large">切换字级</MButton><MButton variant="secondary" @click="rtl = !rtl">切换阅读方向</MButton><MButton variant="ghost" @click="mounted = !mounted">{{ mounted ? "卸载分段" : "挂载分段" }}</MButton></div><section :dir="rtl ? \'rtl\' : \'ltr\'" :style="stageStyle" data-segment-stage><MSegmented v-if="mounted" v-model="value" :options="responsiveOptions" label="随字校准视图" block/></section><p class="kit-muted" data-segment-responsive-owner>当前视图：{{ value }} · 阅读方向：{{ rtl ? "RTL" : "LTR" }}</p></main>',
}) };
export const ReducedMotion: Story = { globals: { motion: 'reduced' }, args: { block: true } };
