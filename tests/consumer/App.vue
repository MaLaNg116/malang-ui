<script setup lang="ts">
import { ref } from 'vue';
import {
  UiButton, UiInput, UiSwitch, UiCard, UiTabs, UiDialog, UiToast, UiToastViewport,
  UiCheckbox, UiRadioGroup, UiSelect, UiTextarea, UiPopover, UiTooltip, UiTable,
  UiPagination, UiBreadcrumb, UiBadge, UiAlert, UiSpinner, UiSkeleton, UiEmpty, UiDivider,
} from 'malang-ui';
import type { UiChoiceOption, UiTableColumn, UiTabItem } from 'malang-ui';

// A normal business interface has no dictionary index signature.
interface Project { id: number; name: string; description: string }
const rows = ref<Project[]>([{ id: 1, name: '项目', description: '声明消费验证' }]);
const columns: UiTableColumn[] = [{ key: 'name', label: '名称' }];
const options: UiChoiceOption[] = [{ value: 'one', label: '第一项' }];
const tabs: UiTabItem[] = [{ value: 'one', label: '示例' }];
const value = ref('one'); const checked = ref(false); const open = ref(false); const popup = ref(false); const page = ref(1);
</script>
<template>
  <UiBreadcrumb :items="[{ label: '组件', href: '/' }, { label: '验证' }]" />
  <UiCard title="公开接口" heading-tag="h2"><UiInput v-model="value" label="名称" /><UiButton @click="open = true">编辑</UiButton></UiCard>
  <UiSwitch v-model="checked" label="启用" /><UiCheckbox v-model="checked" label="确认" />
  <UiRadioGroup v-model="value" :options="options" label="单选" /><UiSelect v-model="value" :options="options" label="分类" />
  <UiTextarea v-model="value" label="说明" name="description" required />
  <UiTabs v-model="value" :items="tabs" label="示例导航"><template #one="{ item, active }">{{ item.label }} / {{ active }}</template></UiTabs>
  <UiDialog v-model="open" title="编辑"><template #footer="{ close }"><UiButton @click="close">完成</UiButton></template></UiDialog>
  <UiPopover v-model="popup" label="设置"><template #default="{ close }"><UiButton @click="close">关闭</UiButton></template></UiPopover>
  <UiTooltip label="帮助" text="补充说明">?</UiTooltip>
  <UiTable :rows="rows" :columns="columns" caption="项目列表"><template #cell-name="{ row }">{{ row.name.toUpperCase() }} / {{ row.description }}</template></UiTable>
  <UiPagination v-model="page" :total="rows.length" />
  <UiBadge tone="warning">注意</UiBadge><UiAlert title="就绪" /><UiSpinner label="读取中" /><UiSkeleton :lines="2" /><UiEmpty title="暂无" /><UiDivider label="完成" />
  <UiToastViewport><UiToast v-model="checked" title="已保存" variant="success" :duration="0" /></UiToastViewport>
</template>
