import { defineComponent, ref, watch, useId } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MRadio from '../../src/components/reference-inputs/MRadio.vue';
import MButton from '../../src/components/MButton.vue';
const meta = {
  title: '基础组件/Radio 单选', component: MRadio, tags: ['autodocs'],
  args: { modelValue: 'paper', value: 'paper', label: '宣纸', required: true, disabled: false },
  render: args => defineComponent({ components: { MRadio, MButton }, setup() {
    const selected=ref(args.modelValue),accepted=ref(true),requests=ref(0),data=ref('尚未提交'),formId=`radio-form-${useId()}`;
    watch(()=>args.modelValue,value=>selected.value=value);
    function change(value:string){requests.value++;if(accepted.value)selected.value=value;}
    function submit(event:Event){event.preventDefault();data.value=JSON.stringify([...new FormData(event.target as HTMLFormElement)]);}
    return{args,selected,accepted,requests,data,formId,change,submit};
  }, template:`<main class="kit-stack" style="max-width:560px"><form :id="formId" class="kit-stack" @submit="submit" @reset="selected=args.modelValue"><fieldset style="border:0;margin:0;padding:0;min-width:0"><legend>材质</legend><MRadio v-bind="args" :model-value="selected" value="paper" label="宣纸" name="material" @update:model-value="change"/><MRadio v-bind="args" :model-value="selected" value="cloth" label="绢素" name="material" @update:model-value="change"/><MRadio v-bind="args" :model-value="selected" value="locked" label="封存" name="material" disabled @update:model-value="change"/></fieldset><div class="kit-row"><MButton type="submit">提交材质</MButton><MButton type="reset" variant="secondary">恢复材质</MButton><MButton type="button" variant="ghost" @click="accepted=!accepted">{{accepted?'拒绝材质更新':'接受材质更新'}}</MButton></div></form><MRadio :model-value="selected" value="external" label="外置材质" name="material" :form="formId" :disabled="args.disabled" :required="args.required" @update:model-value="change"/><output data-radio-model>{{selected}}</output><output data-radio-requests>请求 {{requests}}</output><output data-radio-form>{{data}}</output></main>` }),
} satisfies Meta<typeof MRadio>;
export default meta; type Story=StoryObj<typeof meta>;
export const Default:Story={};
export const Boundary:Story={name:'必填空值与长标签',args:{modelValue:'',hint:'原生必填、同名分组与独立表单关联。'}};
export const Disabled:Story={args:{disabled:true}};
