import { computed, defineComponent, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MInput, MSelect, MTable, MTag } from '../src';
import type { MStatusTone, MTableColumn } from '../src';
import coverage from '../design/component-coverage.json';
import './ComponentCoverage.css';

const statusLabels: Record<string, string> = { added: '新增实现', available: '已具备', planned: '仍有缺项' };
const statusTones: Record<string, MStatusTone> = { added: 'success', available: 'info', planned: 'neutral' };
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'added', label: '新增实现' },
  { value: 'available', label: '已具备' },
  { value: 'planned', label: '仍有缺项' },
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
    const matches = (text: string) => query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).every(term => text.toLocaleLowerCase().includes(term));
    const rows = computed(() => {
      const terms = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      return coverage.items.filter(item => {
        if (status.value !== 'all' && item.status !== status.value) return false;
        const names = coverage.referenceCatalogs.flatMap(library => library.groups.flatMap(group => group.items.filter(entry => entry.capability === item.id).map(entry => entry.name)));
        const text = [item.capability, item.antDesign, item.elementPlus, ...item.components, ...names, ...names.map(name => name.replaceAll(' ', '')), item.available, item.boundary, item.next, item.priority, statusLabels[item.status]].join(' ').toLocaleLowerCase();
        return terms.every(term => text.includes(term));
      });
    });
    return {
      coverage, query, status, rows, columns, statusOptions, statusLabels, statusTones,
      catalogs: computed(() => coverage.referenceCatalogs.map(library => ({ ...library,
        total: library.groups.flatMap(group => group.items).length,
        items: library.groups.flatMap(group => group.items.map(item => ({ ...item, category: group.category }))).filter(item => matches([item.name, item.name.replaceAll(' ', ''), item.category, ...item.components].join(' ')) && (status.value === 'all' || coverage.items.find(row => row.id === item.capability)?.status === status.value)),
      }))),
      additions: coverage.items.filter(item => item.status === 'added').length,
      priorities: coverage.items.filter(item => item.priority === 'P1'),
    };
  },
  template: `<main class="component-coverage">
    <header class="component-coverage__hero">
      <p class="component-coverage__eyebrow">MALANG / CAPABILITY ATLAS</p>
      <h1>逐项核对，让能力有据可查。</h1>
      <p class="component-coverage__intro">从真实页面需要出发，查看已有能力、适用边界与下一步选择。{{ coverage.basis }}</p>
      <div class="component-coverage__meta"><MTag>对照日期 {{ coverage.checkedOn }}</MTag><span>Ant Design {{ coverage.referenceVersions.antDesign }} / Element Plus {{ coverage.referenceVersions.elementPlus }}</span></div>
    </header>
    <dl class="component-coverage__summary" aria-label="覆盖概览">
      <div><dt>公开组件</dt><dd>{{ coverage.publicComponentCount }}<span> 个</span></dd><dd class="component-coverage__summary-note">按真实公开导出统计，不以重复别名增加数量。</dd></div>
      <div><dt>新增实现</dt><dd>{{ additions }}<span> 项能力</span></dd><dd class="component-coverage__summary-note">目录对应与验证状态分别记录。</dd></div>
      <div><dt>逐项对照</dt><dd>155<span> 个目录条目</span></dd><dd class="component-coverage__summary-note">Ant Design 73项 · Element Plus 82项</dd></div>
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
    <section class="component-coverage__references" aria-labelledby="component-reference-heading"><h2 id="component-reference-heading">逐项核对官方目录</h2><p>按各自目录计数；Border、Color 等设计文档单独标记。实现与通过验证是两个阶段，完整边界仍以组件文档为准。</p>
      <details v-for="library in catalogs" :key="library.id" :open="!!query.trim()"><summary><strong>{{ library.id === 'ant-design' ? 'Ant Design' : 'Element Plus' }} {{ library.version }}</strong><span>{{ library.items.length }} / {{ library.total }} 项</span></summary>
        <ul><li v-for="item in library.items" :key="item.name"><strong>{{ item.name }}</strong><span>{{ item.category }} · {{ item.coverage === 'verified' ? '已验证' : item.coverage === 'design-token' ? '设计变量' : item.coverage === 'implementation-pending-verification' ? '已实现 · 验证中' : '待补齐' }}</span><code v-if="item.components.length">{{ item.components.join(' · ') }}</code></li></ul>
        <p v-if="!library.items.length">没有匹配的目录条目。</p>
      </details>
    </section>
    <aside class="component-coverage__planning" aria-labelledby="component-coverage-priority"><h2 id="component-coverage-priority">当前核对范围</h2><p>{{ coverage.planning }}</p></aside>
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
