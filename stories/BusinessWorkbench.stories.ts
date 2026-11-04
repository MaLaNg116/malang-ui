import { computed, defineComponent, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { DefineComponent } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAlert, MBadge, MBreadcrumb, MButton, MCard, MCheckbox, MDialog, MDivider, MInput, MPagination, MPopover, MRadioGroup, MSelect, MSkeleton, MSpinner, MTable, MTextarea, MToast, MToastViewport, MTooltip, debounce } from '../src';
import type { MStatusTone, MTableColumn, MTableProps } from '../src';
import './BusinessWorkbench.css';

interface Project { id: number; name: string; team: string; stage: string; description: string; featured: boolean }
const teams = [{ value: 'design', label: '设计组' }, { value: 'motion', label: '交互组' }, { value: 'engineering', label: '研发组' }];
const stages = [{ value: 'planned', label: '待开始' }, { value: 'active', label: '进行中' }, { value: 'done', label: '已完成' }];
const titles = ['观山设计档案', '墨线动效研究', '组件工作台', '书页导航方案', '空间交互规范', '落印反馈编排', '笔触材质实验', '项目文档整理'];
const initial = (): Project[] => Array.from({ length: 24 }, (_, index) => ({ id: index + 1, name: titles[index % titles.length]! + (index >= titles.length ? ` · ${Math.floor(index / titles.length) + 1}` : ''), team: teams[index % 3]!.value, stage: stages[index % 3]!.value, description: '在同一套组件语言下，验证内容、表单和交互的真实协作。', featured: index % 4 === 0 }));
const TableView = MTable as unknown as DefineComponent<MTableProps<Project>>;
const columns: MTableColumn[] = [{ key: 'name', label: '项目名称' }, { key: 'team', label: '归属团队' }, { key: 'stage', label: '项目阶段' }, { key: 'action', label: '操作', align: 'end' }];

const BusinessWorkbench = defineComponent({
  name: 'BusinessWorkbench',
  components: { MAlert, MBadge, MBreadcrumb, MButton, MCard, MCheckbox, MDialog, MDivider, MInput, MPagination, MPopover, MRadioGroup, MSelect, MSkeleton, MSpinner, MTable: TableView, MTextarea, MToast, MToastViewport, MTooltip },
  setup() {
    const projects = ref(initial());
    const query = ref(''); const settledQuery = ref(''); const stage = ref(''); const featuredOnly = ref(false);
    const page = ref(1); const pageSize = 6;
    const preferences = ref(false); const density = ref('inherit');
    const loading = ref(false); let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const updateSearch = debounce((value: string) => { settledQuery.value = value.trim().toLowerCase(); page.value = 1; }, 250);
    watch(query, value => updateSearch(value));
    watch([stage, featuredOnly], () => { page.value = 1; });
    const filtered = computed(() => projects.value.filter(item => (!stage.value || item.stage === stage.value) && (!featuredOnly.value || item.featured) && (!settledQuery.value || `${item.name} ${item.description}`.toLowerCase().includes(settledQuery.value))));
    const visibleRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
    const completed = computed(() => projects.value.filter(item => item.stage === 'done').length);
    const editor = ref(false); const editingId = ref<number | null>(null); const draftName = ref(''); const draftTeam = ref('design'); const draftStage = ref('planned'); const draftDescription = ref(''); const draftFeatured = ref(false); const attempted = ref(false);
    const listHeading = ref<HTMLHeadingElement>(); let editorTrigger: HTMLElement | undefined;
    const nameError = computed(() => attempted.value && !draftName.value.trim() ? '请填写项目名称。' : '');
    const id = useId(); const formId = `project-editor-${id}`; const nameId = `project-name-${id}`;
    const toast = ref(false); const toastText = ref(''); const result = ref('记录只在当前预览中保存，刷新后恢复初始数据。');
    let nextId = 25; let notification = 0;
    function teamLabel(value: string) { return teams.find(item => item.value === value)?.label || value; }
    function stageLabel(value: string) { return stages.find(item => item.value === value)?.label || value; }
    function stageTone(value: string): MStatusTone { return value === 'done' ? 'success' : value === 'active' ? 'info' : 'neutral'; }
    function edit(project?: Project) {
      editorTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      editingId.value = project?.id ?? null; draftName.value = project?.name ?? ''; draftTeam.value = project?.team ?? 'design'; draftStage.value = project?.stage ?? 'planned'; draftDescription.value = project?.description ?? ''; draftFeatured.value = project?.featured ?? false; attempted.value = false; editor.value = true;
    }
    // The browser can blur a closed dialog after Vue's update has finished.
    function restoreListFocus(event?: FocusEvent) {
      if (event?.relatedTarget && event.relatedTarget !== document.body && event.relatedTarget !== document.documentElement) return;
      if (!editor.value && editorTrigger && !editorTrigger.isConnected && document.activeElement === document.body) {
        editorTrigger = undefined;
        listHeading.value?.focus();
      }
    }
    async function save() {
      attempted.value = true;
      if (!draftName.value.trim()) { await nextTick(); document.getElementById(nameId)?.focus(); return; }
      const project: Project = { id: editingId.value ?? nextId++, name: draftName.value.trim(), team: draftTeam.value, stage: draftStage.value, description: draftDescription.value.trim(), featured: draftFeatured.value };
      if (editingId.value === null) projects.value.unshift(project); else projects.value = projects.value.map(item => item.id === project.id ? project : item);
      editor.value = false;
      // A changed record can leave the active filter or last page.
      page.value = Math.min(page.value, Math.max(1, Math.ceil(filtered.value.length / pageSize)));
      result.value = `「${project.name}」已保存到当前预览。`;
      const version = ++notification; toast.value = false; await nextTick();
      if (version === notification) {
        // The native dialog cannot restore an edit button removed by filtering.
        restoreListFocus();
        toastText.value = result.value; toast.value = true;
      }
    }
    function clearFilters() { updateSearch.cancel(); query.value = ''; settledQuery.value = ''; stage.value = ''; featuredOnly.value = false; page.value = 1; }
    function refresh() { if (loading.value) return; loading.value = true; refreshTimer = setTimeout(() => { loading.value = false; refreshTimer = undefined; }, 650); }
    onBeforeUnmount(() => { updateSearch.cancel(); if (refreshTimer !== undefined) clearTimeout(refreshTimer); notification++; });
    return { projects, query, stage, featuredOnly, page, pageSize, preferences, density, loading, filtered, visibleRows, completed, editor, editingId, draftName, draftTeam, draftStage, draftDescription, draftFeatured, nameError, formId, nameId, listHeading, toast, toastText, result, teams, stages, columns, teamLabel, stageLabel, stageTone, edit, save, restoreListFocus, clearFilters, refresh, breadcrumbs: [{ label: '工作台', href: '#projects-top' }, { label: '项目档案' }], densityOptions: [{ value: 'inherit', label: '跟随全局' }, { value: 'comfortable', label: '舒适' }, { value: 'compact', label: '紧凑' }], filterOptions: [{ value: '', label: '全部阶段' }, ...stages] };
  },
  template: `
    <main id="projects-top" class="business-workbench" :data-ui-density="density === 'inherit' ? undefined : density">
      <MBreadcrumb :items="breadcrumbs" />
      <header class="business-workbench__header"><div><p class="business-workbench__eyebrow">MALANG UI / BUSINESS WORKBENCH</p><h1>落笔成档，井然有序。</h1><p class="business-workbench__muted">从列表筛选到编辑保存，用真实操作检验组件之间的配合。</p></div><MButton :disabled="loading" @click="edit()">新建项目 <span aria-hidden="true">↗</span></MButton></header>
      <section class="business-workbench__stats" aria-label="项目概览"><MCard title="项目档案" heading-tag="h2"><p class="business-workbench__number">{{ projects.length }}<span>项，在当前预览中管理</span></p></MCard><MCard title="已完成" heading-tag="h2"><p class="business-workbench__number">{{ completed }}<span>项，保留每一步进展</span></p></MCard><MCard title="当前结果" heading-tag="h2"><p class="business-workbench__number">{{ filtered.length }}<span>项，匹配当前筛选</span></p></MCard></section>
      <MAlert title="这是可操作的本地示例" description="筛选、分页和保存会立即生效；刷新页面后恢复初始项目，不会向服务器提交数据。" />
      <section class="business-workbench__list" aria-labelledby="project-list-heading">
        <div class="business-workbench__list-heading"><h2 id="project-list-heading" ref="listHeading" tabindex="-1">项目档案</h2><div class="business-workbench__toolbar"><MPopover v-model="preferences" label="显示设置" trigger-label="显示设置"><MRadioGroup v-model="density" label="界面密度" :options="densityOptions" /><MDivider /><MCheckbox v-model="featuredOnly" label="仅显示重点项目" /><template #trigger>显示设置</template></MPopover><MButton variant="ghost" :disabled="loading" @click="refresh">{{ loading ? '读取中' : '刷新列表' }}</MButton></div></div>
        <div class="business-workbench__filters"><MInput v-model="query" label="搜索项目" placeholder="输入项目名称或说明" type="search" :disabled="loading" hint="停顿 250ms 后筛选，支持中文输入。" /><MSelect v-model="stage" label="项目阶段" :options="filterOptions" :disabled="loading" /><MButton variant="secondary" :disabled="loading" @click="clearFilters">清空筛选</MButton></div>
        <MTable :columns="columns" :rows="visibleRows" caption="项目列表" :loading="loading" empty-title="没有匹配的项目" empty-description="调整筛选条件，或创建一条新的项目记录。">
          <template #cell-name="{ row }"><div class="business-workbench__name"><strong>{{ row.name }}</strong><MBadge v-if="row.featured" tone="warning">重点</MBadge></div></template>
          <template #cell-team="{ value }">{{ teamLabel(value) }}</template>
          <template #cell-stage="{ value }"><MBadge :tone="stageTone(value)">{{ stageLabel(value) }}</MBadge></template>
          <template #cell-action="{ row }"><div class="business-workbench__row-actions"><MTooltip :label="'项目说明：' + row.name" :text="row.description || '尚未填写项目说明。'">说明</MTooltip><MButton variant="ghost" size="sm" :aria-label="'编辑' + row.name" @click="edit(row)">编辑</MButton></div></template>
          <template #loading><div class="business-workbench__loading"><MSpinner label="正在读取项目" /><MSkeleton :lines="3" /></div></template>
          <template #empty><div class="business-workbench__empty"><p>没有匹配的项目</p><MButton variant="secondary" @click="clearFilters">恢复完整列表</MButton></div></template>
        </MTable>
        <div class="business-workbench__pagination"><MPagination v-model="page" :total="filtered.length" :page-size="pageSize" :disabled="loading" /></div>
      </section>
      <footer class="business-workbench__result"><span aria-hidden="true">↳</span><p>{{ result }}</p></footer>
      <MDialog v-model="editor" :title="editingId === null ? '新建项目' : '编辑项目'" description="调整项目内容，保存后会更新列表并显示轻提示。" @focusout="restoreListFocus">
        <form :id="formId" class="business-workbench__form" @submit.prevent="save"><MInput :id="nameId" v-model="draftName" label="项目名称" :error="nameError" name="projectName" maxlength="40" autocomplete="off" /><MSelect v-model="draftTeam" label="归属团队" :options="teams" name="team" /><MRadioGroup v-model="draftStage" label="项目阶段" :options="stages" name="projectStage" /><MTextarea v-model="draftDescription" label="项目说明" name="description" :rows="3" maxlength="240" hint="最多 240 字；支持中文组合输入。" /><MCheckbox v-model="draftFeatured" label="标为重点项目" name="featured" /></form>
        <template #footer="{ close }"><MButton variant="secondary" @click="close">取消</MButton><MButton type="submit" :form="formId">保存项目 <span aria-hidden="true">↗</span></MButton></template>
      </MDialog>
      <MToastViewport><MToast v-model="toast" title="项目已保存" :description="toastText" variant="success" :duration="6000" /></MToastViewport>
    </main>`,
});
const meta = { title: '开始/业务组合工作台', component: BusinessWorkbench, parameters: { layout: 'fullscreen', controls: { disable: true } } } satisfies Meta<typeof BusinessWorkbench>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: '筛选 · 编辑 · 保存' };
