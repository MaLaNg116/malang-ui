import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MCheckboxGroup from '../../src/components/reference-common/MCheckboxGroup.vue';
import MButton from '../../src/components/MButton.vue';
const meta={
  title:'基础组件/CheckboxGroup 复选组',component:MCheckboxGroup,tags:['autodocs'],
  args:{label:'纸墨材质',name:'materials',modelValue:['paper'],options:[{value:'paper',label:'宣纸'},{value:'ink',label:'浓墨'},{value:'jade',label:'青玉'},{value:'locked',label:'封存',disabled:true}],required:true,max:2},
  render:args=>defineComponent({components:{MCheckboxGroup,MButton},setup(){const model=ref([...args.modelValue]),accepted=ref(true),requests=ref(0),result=ref('尚未提交'),formId=`checkbox-fixture-${useId()}`;watch(()=>args.modelValue,value=>model.value=[...value]);function update(values:string[]){requests.value++;if(accepted.value)model.value=values;}function submit(event:Event){event.preventDefault();result.value=JSON.stringify([...new FormData(event.target as HTMLFormElement)]);}return{args,model,accepted,requests,result,formId,update,submit};},template:`<main class="kit-stack" style="max-width:640px"><form :id="formId" @submit="submit" class="kit-row"><MButton type="submit">提交材质</MButton><MButton type="reset" variant="secondary">原生重置</MButton><MButton type="button" variant="ghost" @click="accepted=!accepted">{{accepted?'拒绝材质更新':'接受材质更新'}}</MButton></form><MCheckboxGroup v-bind="args" :model-value="model" :form="formId" @update:model-value="update"/><p class="kit-muted">校验按实际启用且去重的选项计算；外置表单关联与父模型分别保留。</p><output data-checkbox-owner style="overflow-wrap:anywhere">{{JSON.stringify(model)}}</output><output data-checkbox-requests>请求 {{requests}}</output><output data-checkbox-result style="overflow-wrap:anywhere">{{result}}</output></main>`}),
} satisfies Meta<typeof MCheckboxGroup>;
export default meta;type Story=StoryObj<typeof meta>;
export const Default:Story={};
export const UnknownValue:Story={name:'未知值不满足必填也不占上限',args:{modelValue:['missing','unknown'],max:1}};
export const DuplicateValues:Story={name:'重复值不满足最少项目',args:{modelValue:['paper','paper'],min:2,max:2}};
export const DisabledSelection:Story={name:'禁用值不参与原生提交',args:{modelValue:['locked'],max:1}};
export const EmptyOptions:Story={name:'无可选项仍保留校验',args:{modelValue:[],options:[]}};
export const AboveMaximum:Story={name:'外部超限可逐项恢复',args:{modelValue:['paper','ink','jade'],max:1}};
