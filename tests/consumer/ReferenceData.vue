<script setup lang="ts">
import { ref } from 'vue';
import { MAutoComplete, MList, MListy, MVirtualList, MVirtualTable, MVirtualTree, MVirtualSelect, MScrollbar, MInfiniteScroll, MTable } from 'malang-ui';
import type { MAutoCompleteProps, MDataKey, MVirtualAlign, MVirtualScrollHandle, MVirtualListProps, MVirtualSelectProps, MVirtualSelectValue, MListProps, MListyProps, MVirtualTableProps, MVirtualTreeProps, MScrollbarProps, MInfiniteScrollProps, MTableColumn, MTreeNode } from 'malang-ui';
interface Archive { id: string; name: string; score: number }
const records: Archive[] = [{ id: 'ink', name: '墨关', score: 10 }];
const columns: MTableColumn[] = [{key:'name',label:'卷宗',sortable:true,filterOptions:[{value:'墨关',label:'墨关'}]},{key:'score',label:'分值',sortable:true}];
const nodes: MTreeNode[] = [{value:'root',label:'卷宗',children:[{value:'ink',label:'墨关'}]}];
const active = ref<MDataKey|null>(null), selected = ref<MDataKey[]>([]), expanded = ref<string[]>(['root']), tree = ref<string|null>(null), single = ref(''), multiple = ref<readonly string[]>([]);
const sort=ref<{key:string;order:'asc'|'desc'}|null>(null),filters=ref<Readonly<Record<string,string>>>({}),page=ref(1),opened=ref<MDataKey[]>([]);
const keyOf = (row: Archive) => row.id;
const listProps: MVirtualListProps<Archive> = {items:records,label:'虚拟卷宗',itemKey:keyOf};
const staticProps: MListProps<Archive> = {items:records,label:'静态卷宗'}, listyProps: MListyProps<Archive>={...listProps,numbered:true};
const tableProps: MVirtualTableProps<Archive>={rows:records,columns,caption:'虚拟表格',rowKey:keyOf};
const treeProps: MVirtualTreeProps={items:nodes,label:'虚拟目录',modelValue:null,expandedValues:['root']};
const scrollProps:MScrollbarProps={height:'20rem',maxHeight:400,viewportClass:'consumer-viewport',label:'滚动正文'};
const infiniteProps:MInfiniteScrollProps={loading:false,finished:false,height:240,label:'续读卷宗'};
const selectProps:MVirtualSelectProps={modelValue:'',options:[{value:'ink',label:'墨关'}],label:'单选'};
const multiProps:MVirtualSelectProps<true>={modelValue:['ink'],multiple:true,options:selectProps.options,label:'多选'};
const multiValue:MVirtualSelectValue<true>=['ink'];void multiValue;
const autoProps:MAutoCompleteProps={modelValue:'free text',options:selectProps.options,label:'自由输入'};
const virtual=ref<MVirtualScrollHandle>(); const align:MVirtualAlign='center';
function locate(){virtual.value?.scrollToIndex(0,align);virtual.value?.scrollTo({top:0});}
function consume(row:Archive){return row.score.toFixed(0);}
</script>
<template>
  <MList v-bind="staticProps"><template #item="{item,index}">{{item.name}} {{consume(item)}} {{index}}</template><template #header>卷宗</template><template #footer>卷末</template></MList>
  <MListy v-bind="listyProps" v-model="active"><template #item="{item,selected}">{{item.name}} {{selected}}</template></MListy>
  <MVirtualList ref="virtual" v-bind="listProps" v-model="active" selectable><template #item="{item,index}">{{item.name}} {{index}}</template></MVirtualList>
  <MVirtualTable v-bind="tableProps" v-model:sort="sort" v-model:selected-keys="selected" selectable><template #cell-name="{row,index,value}">{{row.name}} {{consume(row)}} {{index}} {{value}}</template></MVirtualTable>
  <MVirtualTree v-bind="treeProps" v-model="tree" v-model:expanded-values="expanded"><template #item="{item,level}">{{item.label}} {{level}}</template></MVirtualTree>
  <MVirtualSelect v-bind="selectProps" v-model="single" name="single" required /><MVirtualSelect v-bind="multiProps" v-model="multiple" name="multiple" />
  <MAutoComplete v-bind="autoProps" v-model="single" name="suggestion" @select="option => single = option.value" />
  <MScrollbar v-bind="scrollProps"><p>真实滚动正文</p></MScrollbar><MInfiniteScroll v-bind="infiniteProps" @load="locate"><p>按需续读</p></MInfiniteScroll>
  <MTable :rows="records" :columns="columns" caption="增强表格" selectable expandable :page-size="10" v-model:sort="sort" v-model:filters="filters" v-model:selected-keys="selected" v-model:expanded-keys="opened" v-model:page="page"><template #cell-name="{row,index}">{{row.name}} {{consume(row)}} {{index}}</template><template #expanded="{row}">{{row.name}}</template></MTable>
</template>
