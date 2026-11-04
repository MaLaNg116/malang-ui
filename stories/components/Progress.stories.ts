import { defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAlert, MBadge, MButton, MCard, MInput, MProgress, MStatistic, MSteps, MTag, MTimeline } from '../../src';
import type { MStatusTone, MStepItem, MTimelineItem } from '../../src';
const meta = {
  title: '二级组件/Progress 进度条', component: MProgress, tags: ['autodocs'],
  args: { label: '铸刃进度', value: 42, max: 100, status: 'default', indeterminate: false, showValue: true },
  parameters: { docs: { description: { component: '以分节滑轨呈现进度；青灰进行中、青玉完成、朱红异常，完成与异常另有独立图形。确定进度提供真实数值，indeterminate 不伪造百分比，错误或完成时停止不确定进度的滑动。组件不自动播报每次数值变化，完成与异常由业务层提示。减少动效时停止滑动与过渡。' } } },
  render: args => defineComponent({ components: { MProgress }, setup: () => ({ args }), template: '<div class="kit-stack" style="max-width:640px"><MProgress v-bind="args">归位、校准，再落下最后一道印。</MProgress></div>' }),
} satisfies Meta<typeof MProgress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Interactive: Story = { render: () => defineComponent({ components: { MProgress, MButton }, setup: () => ({ value: ref(0) }), template: '<div class="kit-stack" style="max-width:640px"><MProgress label="文档检查" :value="value" :status="value === 100 ? \'success\' : \'default\'"/><div class="kit-row"><MButton @click="value = Math.min(100, value + 25)">推进检查</MButton><MButton variant="secondary" @click="value = 0">重置</MButton></div></div>' }) };
export const Indeterminate: Story = { args: { label: '正在准备资料', indeterminate: true } };
export const Error: Story = { args: { label: '构建检查', value: 68, status: 'error' } };
export const Complete: Story = { args: { value: 100, status: 'success' } };
export const InvalidValues: Story = { args: { value: -5, max: 0 } };
export const ReducedMotion: Story = { args: { indeterminate: true }, globals: { motion: 'reduced' } };
export const StateComparison: Story = { render: () => defineComponent({
  components: { MAlert, MBadge, MCard, MInput, MProgress, MStatistic, MSteps, MTag, MTimeline },
  setup() {
    const steps: MStepItem[] = [{ value: 'receive', label: '接收资料' }, { value: 'process', label: '核对内容' }, { value: 'archive', label: '完成归档' }];
    const timeline: MTimelineItem[] = [{ value: 'processing', title: '正在处理', status: 'active' }, { value: 'failed', title: '处理异常', status: 'error' }, { value: 'complete', title: '处理完成', status: 'success' }];
    const tones: { tone: MStatusTone; title: string; value: number }[] = [{ tone: 'info', title: '青灰进行中', value: 42 }, { tone: 'success', title: '青玉成功', value: 100 }, { tone: 'warning', title: '金色警告', value: 2 }, { tone: 'error', title: '朱红错误', value: 1 }];
    return { steps, timeline, tones, draft: ref('卷宗校对') };
  },
  template: `<div class="kit-stack" style="max-width:1120px">
    <h2>青灰进行中 / 青玉完成 / 朱红异常</h2><p>状态同时用颜色、文字与图形表达，处理中与异常有明确区别。</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:24px;min-width:0">
      <MCard title="进行中"><MProgress label="进行中进度" :value="42"/></MCard>
      <MCard title="异常"><MProgress label="异常进度" :value="68" status="error"/></MCard>
      <MCard title="完成"><MProgress label="完成进度" :value="100" status="success"/></MCard>
    </div>
    <MSteps model-value="process" :items="steps" label="状态对照步骤" status="process"/>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px;min-width:0">
      <MCard title="进度未知时的结果"><div class="kit-stack"><MProgress label="异常进度未知" indeterminate status="error"/><MProgress label="完成进度未知" indeterminate status="success"/><MProgress label="仅图形异常进度" :value="68" :show-value="false" status="error"/><MProgress label="仅图形完成进度" :value="100" :show-value="false" status="success"/></div></MCard>
      <MCard title="流转记录"><MTimeline :items="timeline" label="状态对照时间线"/></MCard>
    </div>
    <h3>青灰进行中 / 青玉成功 / 金色警告 / 朱红错误</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:20px;min-width:0">
      <MCard v-for="sample in tones" :key="sample.tone" :title="sample.title"><div class="kit-stack" style="gap:16px"><div class="kit-row"><MBadge :tone="sample.tone">{{ sample.title }}</MBadge><MTag :tone="sample.tone">{{ sample.title }}</MTag></div><MAlert :tone="sample.tone" :title="sample.title"/><MStatistic :tone="sample.tone" :label="sample.title+'指标'" :value="sample.value" unit="份"/></div></MCard>
    </div>
    <MCard title="编辑焦点与错误说明"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:24px;min-width:0"><MInput v-model="draft" label="正常聚焦输入" hint="普通编辑使用青灰焦点。"/><MInput v-model="draft" label="异常聚焦输入" error="此项需要修正。"/></div></MCard>
  </div>`,
}) };
