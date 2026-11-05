<script setup lang="ts">
import { ref } from 'vue';
import { MTree, MRadio } from 'malang-ui';
import type { MTreeNode, MTreeProps, MRadioProps } from 'malang-ui';
const items:readonly MTreeNode[]=[{value:'paper',label:'纸本',children:[{value:'ink',label:'墨迹'},{value:'seal',label:'刻印',disabled:true}]}];
const selected=ref<string|null>('ink'),checked=ref<string[]>(['ink']),selections=ref<string[]>(['ink']),expanded=ref(['paper']);
const treeApi:MTreeProps={modelValue:null,items,expandedValues:[],label:'复选目录',checkable:true,checkedValues:[],checkStrictly:false,multiple:true,selectedValues:[]};
const material=ref('paper');const radioApi:MRadioProps={modelValue:'paper',value:'paper',label:'宣纸',name:'material',form:'selection-form',required:true};
</script>
<template><form id="selection-form"><MTree v-bind="treeApi" v-model="selected" v-model:checked-values="checked" v-model:selected-values="selections" v-model:expanded-values="expanded"/><MTree v-bind="treeApi" v-model="selected" v-model:checked-values="checked" check-strictly/><MRadio v-bind="radioApi" v-model="material"/><MRadio v-model="material" label="绢素" value="cloth" name="material" required/></form><MRadio v-model="material" label="外置材质" value="external" name="material" form="selection-form" required/></template>
