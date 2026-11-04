<script setup lang="ts">
import { ref } from 'vue';
import {
  MButton, MInput, MSwitch, MCard, MTabs, MDialog, MToast, MToastViewport,
  MCheckbox, MRadioGroup, MSelect, MTextarea, MPopover, MTooltip, MTable,
  MPagination, MBreadcrumb, MBadge, MAlert, MSpinner, MSkeleton, MEmpty, MDivider,
  MDrawer, MDropdownMenu, MAccordion, MSteps, MProgress, MTimeline,
  MInputNumber, MSlider, MCombobox, MTag, MAvatar, MDescriptions,
  MDatePicker, MUpload, MMenu, MTree,
  MStatistic, MResult, MSpace, MBackTop, MMessage,
} from 'malang-ui';
import type { MChoiceOption, MTableColumn, MTabItem, MMenuItem, MTreeNode, MUploadRejection } from 'malang-ui';

// A normal business interface has no dictionary index signature.
interface Project { id: number; name: string; description: string }
const rows = ref<Project[]>([{ id: 1, name: '项目', description: '声明消费验证' }]);
const columns: MTableColumn[] = [{ key: 'name', label: '名称' }];
const options: MChoiceOption[] = [{ value: 'one', label: '第一项' }];
const tabs: MTabItem[] = [{ value: 'one', label: '示例' }];
const value = ref('one'); const checked = ref(false); const open = ref(false); const popup = ref(false); const page = ref(1);
const sections = ref<string[]>(['one']);
const amount = ref<number | null>(1); const intensity = ref(1);
const date = ref('2026-11-04'); const attachments = ref<File[]>([]);
const selected = ref<string | null>('one'); const expanded = ref<string[]>(['group']);
const scrollHost = ref<HTMLElement | null>(null);
const menuItems: readonly MMenuItem[] = [{value:'group',label:'分组',children:[{value:'one',label:'第一项',href:'#one'}]}];
const treeItems: readonly MTreeNode[] = [{value:'group',label:'目录',children:[{value:'one',label:'第一项'}]}];
function rejected(items: MUploadRejection[]) { value.value = items[0]?.reason || ''; }
function navigate(_value: string, event: MouseEvent) { event.preventDefault(); }
</script>
<template>
  <MBreadcrumb :items="[{ label: '组件', href: '/' }, { label: '验证' }]" />
  <MSpace direction="horizontal" :size="8" align="center" wrap inline><MButton>第一项</MButton><MButton variant="secondary">第二项</MButton></MSpace>
  <div ref="scrollHost"><MBackTop :target="() => scrollHost" :visibility-height="100" behavior="instant" label="回到消费页顶部" @click="navigate('top', $event)" /></div>
  <MToastViewport placement="top-center"><MToast v-model="checked" presentation="message" title="轻提示已就绪" :closable="false" :duration="3000" /></MToastViewport>
  <MMessage v-model="open" content="操作处理中" type="loading" :duration="0" :offset="8" />
  <MCard title="公开接口" heading-tag="h2"><MInput v-model="value" label="名称" /><MButton @click="open = true">编辑</MButton></MCard>
  <MSwitch v-model="checked" label="启用" /><MCheckbox v-model="checked" label="确认" />
  <MRadioGroup v-model="value" :options="options" label="单选" /><MSelect v-model="value" :options="options" label="分类" />
  <MTextarea v-model="value" label="说明" name="description" required />
  <MTabs v-model="value" :items="tabs" label="示例导航"><template #one="{ item, active }">{{ item.label }} / {{ active }}</template></MTabs>
  <MDialog v-model="open" title="编辑"><template #footer="{ close }"><MButton @click="close">完成</MButton></template></MDialog>
  <MPopover v-model="popup" label="设置"><template #default="{ close }"><MButton @click="close">关闭</MButton></template></MPopover>
  <MTooltip label="帮助" text="补充说明">?</MTooltip>
  <MTable :rows="rows" :columns="columns" caption="项目列表"><template #cell-name="{ row }">{{ row.name.toUpperCase() }} / {{ row.description }}</template></MTable>
  <MPagination v-model="page" :total="rows.length" />
  <MBadge tone="warning">注意</MBadge><MAlert title="就绪" /><MSpinner label="读取中" /><MSkeleton :lines="2" /><MEmpty title="暂无" /><MDivider label="完成" />
  <MToastViewport><MToast v-model="checked" title="已保存" variant="success" :duration="0" /></MToastViewport>
  <m-input v-model="value" label="短横线组件命名" />
  <MDrawer v-model="open" title="资料"><template #footer="{ close }"><MButton @click="close">完成</MButton></template></MDrawer>
  <MDropdownMenu v-model="popup" :items="[{value:'edit', label:'编辑'}]" label="项目操作" />
  <MAccordion v-model="sections" :items="tabs" label="章节"><template #one="{ item, expanded }">{{ item.label }} / {{ expanded }}</template></MAccordion>
  <MSteps v-model="value" :items="tabs" label="流程" interactive />
  <MProgress :value="42" label="检查进度" />
  <MTimeline :items="[{value:'created',title:'已建立',status:'success'}]" label="操作记录" />
  <MInputNumber v-model="amount" label="数值" :min="0" :max="10" :step="0.1" name="amount" required />
  <MSlider v-model="intensity" label="力度" :min="0" :max="10" :step="0.1" name="intensity" />
  <MCombobox v-model="value" :options="options" label="搜索选择" name="preset" required />
  <MTag tone="info" closable close-label="移除调校标签" @close="checked = true">调校</MTag>
  <MAvatar name="ML" alt="工坊标记" tone="jade" />
  <MDescriptions :items="[{key:'name',label:'名称',value:'预设'},{key:'state',label:'状态'}]" label="档案"><template #state="{ item }">{{ item.label }}</template></MDescriptions>
  <MDatePicker v-model="date" label="归档日期" name="date" required min="2025-01-01" max="2028-12-31" />
  <MUpload v-model="attachments" label="本地附件" name="attachments" multiple required :max-count="5" :max-size="2097152" @reject="rejected" />
  <MMenu v-model="selected" v-model:expanded-values="expanded" :items="menuItems" label="资料导航" @select="navigate" />
  <MTree v-model="selected" v-model:expanded-values="expanded" :items="treeItems" label="资料目录" />
  <MStatistic label="档案数量" :value="0" unit="份" tone="info" />
  <MResult title="资料已就位" description="可以继续编辑。" status="success"><template #footer><MButton>继续处理</MButton></template></MResult>
  <MToastViewport placement="top-center" label="顶部通知"><MToast v-model="checked" title="顶部居中提示" :duration="0" /></MToastViewport>
</template>
