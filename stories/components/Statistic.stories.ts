import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MStatistic from '../../src/components/MStatistic.vue';
import MButton from '../../src/components/MButton.vue';
import MInput from '../../src/components/MInput.vue';

const meta = {
  title: '基础组件/Statistic 指标', component: MStatistic, tags: ['autodocs'],
  args: { label: '本地归档', value: 128, unit: '份', description: '当前工作区已登记的资料。', tone: 'neutral', placeholder: '—' },
  render: args => defineComponent({ components: { MStatistic }, setup: () => ({ args }), template: '<div style="width:min(100%,420px)"><MStatistic v-bind="args" /></div>' }),
  parameters: { docs: { description: { component: '静态业务指标以原生 dl / dt / dd 表达名称与读数。数值或已格式化字符串原样显示，可加前缀、后缀、单位与说明；不做跳数、自动格式化或播报。null、空字符串和非有限数值显示 placeholder，0 保持有效；占位时省略前后缀与单位。tone 仅用于视觉强调，业务含义由名称与说明提供。' } } },
} satisfies Meta<typeof MStatistic>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const FormattedValues: Story = {
  name: '前后缀与单位',
  render: () => defineComponent({ components: { MStatistic }, template: '<main style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;max-width:960px"><MStatistic label="本次用量" :value="64" unit="MB" description="包含纹理与说明文件。"/><MStatistic label="预算上限" value="12,800" prefix="¥" suffix="/ 月" description="展示应用已格式化的预算。" tone="info"/><MStatistic label="资料完整度" value="98.4" suffix="%" description="已核对字段占全部字段的比例。" tone="success"/></main>' }),
};
export const Placeholder: Story = {
  name: '占位与零值',
  render: () => defineComponent({ components: { MStatistic }, setup: () => ({ unknown: Number.NaN }), template: '<main class="kit-stack" style="width:min(100%,420px)"><MStatistic label="待汇总条目" :value="null" placeholder="待汇总" prefix="约" suffix="以上" unit="份" description="收齐本地资料后再汇总。"/><MStatistic label="已撤回条目" :value="0" unit="项"/><MStatistic label="未返回用量" :value="unknown" unit="MB" description="暂无可显示的读数。"/></main>' }),
};
export const Tones: Story = {
  name: '指标语义',
  render: () => defineComponent({ components: { MStatistic }, template: '<main style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:24px;max-width:1040px"><MStatistic label="资料总量" :value="128" unit="份"/><MStatistic label="正在校验" :value="3" unit="份" tone="info"/><MStatistic label="归档通过" :value="96" unit="份" tone="success"/><MStatistic label="等待确认" :value="4" unit="份" tone="warning"/><MStatistic label="校验失败" :value="1" unit="份" tone="error"/></main>' }),
};
export const LongContent: Story = { name: '长名称与长读数', args: { label: 'ArchiveMetricLabelWithoutArtificialTruncation', value: '123456789012345678901234567890.0123456789', unit: 'ArchiveUnitsWithoutArtificialClipping', description: 'ArchiveDescriptionWithoutArtificialTruncation'.repeat(4), tone: 'info' } };
export const SnapshotChange: Story = {
  name: '外部快照更新',
  render: () => defineComponent({
    components: { MStatistic, MButton, MInput },
    setup() { const value = ref(48), note = ref(''); return { value, note, load: () => { value.value = value.value === 48 ? 64 : 48; } }; },
    template: '<main class="kit-stack" style="width:min(100%,480px)"><MStatistic label="已登记条目" :value="value" unit="份" description="当前载入的归档快照。"/><div><MButton variant="secondary" @click="load">载入下一份快照</MButton></div><MInput v-model="note" label="指标旁备注"/></main>',
  }),
};
