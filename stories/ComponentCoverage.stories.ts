import { computed, defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MInput, MSelect, MTable, MTag } from '../src';
import type { MStatusTone, MTableColumn } from '../src';
import coverage from '../design/component-coverage.json';
import './ComponentCoverage.css';

const statusLabels: Record<string, string> = { added: '本轮补齐', available: '已具备', planned: '后续规划' };
const statusTones: Record<string, MStatusTone> = { added: 'success', available: 'info', planned: 'neutral' };
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'added', label: '本轮补齐' },
  { value: 'available', label: '已具备' },
  { value: 'planned', label: '后续规划' },
];
const columns: MTableColumn[] = [
  { key: 'capability', label: '能力与参考名称' },
  { key: 'available', label: 'MaLang 当前能力' },
  { key: 'boundary', label: '使用边界' },
  { key: 'status', label: '覆盖状态' },
  { key: 'next', label: '使用建议 / 后续优先级' },
];
const ComponentCoverage = defineComponent({
  components: { MInput, MSelect, MTable, MTag },
  setup() {
    const query = ref(''), status = ref('all');
    const rows = computed(() => {
      const terms = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      return coverage.items.filter(item => {
        if (status.value !== 'all' && item.status !== status.value) return false;
        const text = [item.capability, item.antDesign, item.elementPlus, ...item.components, item.available, item.boundary, item.next, item.priority, statusLabels[item.status]].join(' ').toLocaleLowerCase();
        return terms.every(term => text.includes(term));
      });
    });
    return {
      coverage, query, status, rows, columns, statusOptions, statusLabels, statusTones,
      additions: coverage.items.filter(item => item.status === 'added').length,
      priorities: coverage.items.filter(item => item.priority === 'P1'),
    };
  },
  template: `<main class="component-coverage">
    <header class="component-coverage__hero">
      <p class="component-coverage__eyebrow">MALANG / CAPABILITY ATLAS</p>
      <h1>补齐常用，再逐层深入。</h1>
      <p class="component-coverage__intro">从真实页面需要出发，查看已有能力、适用边界与下一步选择。{{ coverage.basis }}</p>
      <div class="component-coverage__meta"><MTag>对照日期 {{ coverage.checkedOn }}</MTag><span>参考 Ant Design 与 Element Plus 官方目录</span></div>
    </header>
    <dl class="component-coverage__summary" aria-label="覆盖概览">
      <div><dt>公开组件</dt><dd>{{ coverage.publicComponentCount }}<span> 个</span></dd><dd class="component-coverage__summary-note">MMessage 提供独立的全局轻提示入口。</dd></div>
      <div><dt>本轮补齐</dt><dd>{{ additions }}<span> 项能力</span></dd><dd class="component-coverage__summary-note">组件间距 · 返回顶部 · 操作后轻提示</dd></div>
      <div><dt>优先推进</dt><dd>{{ priorities.length }}<span> 项 P1</span></dd><dd class="component-coverage__summary-note">分段选择 · 轻量确认 · 图片 · 表单</dd></div>
    </dl>
    <section class="component-coverage__catalog" aria-labelledby="component-coverage-heading">
      <div class="component-coverage__section-head"><h2 id="component-coverage-heading">查能力，也看边界。</h2><p>一项可对应多个组件；同一组件也可承担不同用途。</p></div>
      <div class="component-coverage__filters" role="search" aria-label="筛选组件能力">
        <MInput v-model="query" label="搜索能力或组件" type="search" placeholder="例如：Form、图片、MToast、P1" autocomplete="off"/>
        <MSelect v-model="status" :options="statusOptions" label="覆盖状态"/>
      </div>
      <p class="component-coverage__count" role="status" aria-live="polite" aria-atomic="true">显示 {{ rows.length }} / {{ coverage.items.length }} 项能力</p>
      <MTable class="component-coverage__table" :columns="columns" :rows="rows" row-key="id" caption="MaLang 与 Ant Design / Element Plus 能力覆盖对照">
        <template #cell-capability="{ row }"><div class="component-coverage__capability"><strong>{{ row.capability }}</strong><dl><div><dt>Ant Design</dt><dd>{{ row.antDesign }}</dd></div><div><dt>Element Plus</dt><dd>{{ row.elementPlus }}</dd></div></dl></div></template>
        <template #cell-available="{ row }"><p class="component-coverage__cell-copy">{{ row.available }}</p><ul v-if="row.components.length" class="component-coverage__components" aria-label="可用组件"><li v-for="component in row.components" :key="component"><code>{{ component }}</code></li></ul></template>
        <template #cell-status="{ row }"><MTag :tone="statusTones[row.status]">{{ statusLabels[row.status] }}</MTag></template>
        <template #cell-next="{ row }"><MTag v-if="row.priority" :tone="row.priority === 'P1' ? 'warning' : 'neutral'">{{ row.priority }}</MTag><p class="component-coverage__cell-copy">{{ row.next }}</p></template>
      </MTable>
      <p class="component-coverage__scroll-note">窄屏可聚焦表格区域，横向滚动查看完整对照。</p>
    </section>
    <aside class="component-coverage__planning" aria-labelledby="component-coverage-priority"><h2 id="component-coverage-priority">先补高频，再按场景深入。</h2><p>{{ coverage.planning }}</p><ul><li v-for="item in priorities" :key="item.id"><span>P1</span><strong>{{ item.capability }}</strong><p>{{ item.next }}</p></li></ul></aside>
    <footer class="component-coverage__sources" aria-labelledby="component-coverage-sources"><h2 id="component-coverage-sources">官方参考</h2><p>名称与分类参考以下目录；MaLang 的能力与边界以本页说明及组件文档为准。</p><ul><li v-for="source in coverage.sources" :key="source.id"><a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }}<span class="component-coverage__sr-only">（新窗口打开）</span><span aria-hidden="true"> ↗</span></a></li></ul></footer>
  </main>`,
});

const meta = {
  title: '开始/组件覆盖对照',
  component: ComponentCoverage,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
} satisfies Meta<typeof ComponentCoverage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
