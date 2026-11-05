<script setup lang="ts">
import { ref } from 'vue';
import { MQRCode, MIcon, MTypography, MText, MLink, MConfigProvider, MApp, MMessageBox, MLoading, MFormList, MCheckboxGroup, MSelect, vMLoading, createMLoading, useMConfig, useMApp } from 'malang-ui';
import type { MGetProps, MGetProp, MGetRef, MQRCodeLevel, MIconName, MConfig, MAppContext, MMessageBoxResult, MTypographyProps, MFormListProps } from 'malang-ui';
const text = ref('档案'), open = ref(false), loading = ref(false);
const members = ref([{ id: 1, name: '观山' }]), selected = ref<string[]>([]);
const listProps: MFormListProps<{id: number; name: string}> = { name: 'members', modelValue: members.value, itemKey: 'id' };
void listProps;
const level: MQRCodeLevel = 'H', icon: MIconName = 'copy';
const qr = ref<MGetRef<typeof MQRCode>>();
const props: MGetProps<typeof MTypography> = { modelValue: '字骨' };
const tone: MGetProp<MTypographyProps, 'type'> = 'secondary';
const locale: MConfig['locale'] = 'zh-CN';
function result(_result: MMessageBoxResult) {}
function context(_app: MAppContext) {}
void [createMLoading, useMConfig, useMApp, context];
</script>
<template><MConfigProvider :locale="locale"><MApp><MQRCode ref="qr" :value="text" :error-level="level" /><MIcon :name="icon" /><MTypography v-bind="props" v-model="text" editable copyable /><MText :type="tone">正文</MText><MLink href="#reference">详情</MLink><MMessageBox v-model="open" title="确认" kind="prompt" @result="result" /><MLoading v-model="loading"><div v-m-loading="loading">内容</div></MLoading><MFormList v-model="members" name="members" item-key="id" v-slot="{fields,add}"><span v-for="field in fields" :key="field.key">{{field.value.name}}</span><button @click="add({id:2,name:'听雨'})">添加</button></MFormList><MCheckboxGroup v-model="selected" :options="[]" label="分类" /><MSelect multiple v-model:selected-values="selected" :options="[]" label="原生多选" /></MApp></MConfigProvider></template>
