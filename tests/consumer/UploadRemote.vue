<script setup lang="ts">
import { ref } from 'vue';
import { MUpload } from 'malang-ui';
import type { MUploadCustomRequest, MUploadFileState, MUploadProgress, MUploadProps, MUploadRequestData, MUploadRequestOptions, MUploadStatus } from 'malang-ui';
const files = ref<File[]>([]), latest = ref<readonly MUploadFileState[]>([]), status = ref<MUploadStatus>('ready');
const fields: MUploadRequestData = { collection: 'consumer', tags: ['ink', 'paper'], version: 2, approved: false };
const options: Partial<MUploadProps> = { action: async file => `/upload?name=${encodeURIComponent(file.name)}`, method: 'PUT', headers: { 'X-Archive': 'consumer' }, data: fields, fieldName: 'asset', autoUpload: false, withCredentials: true };
const custom: MUploadCustomRequest = async (request: MUploadRequestOptions) => {
  const response = await fetch(request.action, { method: request.method, headers: request.headers, body: request.file, signal: request.signal, credentials: request.withCredentials ? 'include' : 'same-origin' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text();
};
function progress(file: File, value: MUploadProgress) { status.value = 'uploading'; void file.name; void value.loaded; }
function changed(value: readonly MUploadFileState[]) { latest.value = value; status.value = value[0]?.status ?? 'ready'; }
function failure(file: File, error: unknown) { void file.name; if (error instanceof Error) void error.message; }
</script>
<template><MUpload v-bind="options" v-model="files" label="真实远程附件" multiple @progress="progress" @status-change="changed" @error="failure"/><MUpload v-model="files" label="自定义传输附件" url="/custom-upload" :custom-request="custom" :auto-upload="false"/><p>{{status}} / {{latest.length}}</p></template>
