import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MUpload from '../../src/components/MUpload.vue';
import MButton from '../../src/components/MButton.vue';
import type { MUploadCustomRequest, MUploadProgress, MUploadRejection } from '../../src/components/types';
import MSwitch from '../../src/components/MSwitch.vue';

function sample(name: string, type = 'text/plain', text = '本地交付资料') { return new File([text], name, { type, lastModified: 1700000000000 }); }
const meta = {
  title: '二级组件/Upload 本地文件', component: MUpload, tags: ['autodocs'],
  args: { modelValue: [], label: '归档附件', accept: '.pdf,image/*', multiple: false, maxSize: 5 * 1024 * 1024, disabled: false, readonly: false, hint: '仅管理本地清单，提交到服务器由使用方负责。' },
  parameters: { docs: { description: { component: '文件收件槽，原生file input是选择入口，v-model始终接收真正的File[]。默认不配置action/url/customRequest时只管理本地文件；配置远程地址后以XHR multipart上传，fieldName/name决定文件字段，支持method/headers/data/withCredentials。autoUpload默认true，false时手动提交；进度只来自真实transport，HTTP 2xx或customRequest成功完成才标为成功。customRequest接收file/action/method/headers/data/fieldName/withCredentials/signal/onProgress并返回Promise；取消后迟到的进度、成功与失败均被隔离。实例公开submit(file?)/retry(file)/abort(file?)与states；upload/progress/success/error/abort/status-change事件反映真实状态。父级先接受File[]才会启动请求；接受移除、禁用、只读、配置改变和卸载会中止独立请求。FileList、原生FormData、required、只读和reset仍遵循受控模型。类型/大小/数量/元数据重复校验继续生效，accept不代表文件内容安全验证。示例地址未连接后端时会明确失败，不生成虚构成功。' } } },
  render: args => defineComponent({
    components: { MUpload },
    setup() { const files = ref<readonly File[]>(args.modelValue); watch(() => args.modelValue, value => { files.value = value; }); return { args, files }; },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MUpload v-bind="args" v-model="files" /><p class="kit-muted" data-owner-files>父模型：{{ files.map(file => file.name).join(\'、\') || \'空\' }}</p></main>',
  }),
} satisfies Meta<typeof MUpload>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Multiple: Story = {
  name: '多文件追加',
  render: () => defineComponent({
    components: { MUpload },
    setup() { const files = ref<readonly File[]>([sample('墨迹说明.txt'), sample('落印图.png', 'image/png', 'image-data')]); return { files }; },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MUpload v-model="files" label="追加附件" multiple hint="再次选择会追加；重复元数据会明确提示。" /><p data-owner-files>父模型：{{ files.map(file => file.name).join(\'、\') }}</p></main>',
  }),
};
export const Limited: Story = {
  name: '限制与逐项拒绝',
  render: () => defineComponent({
    components: { MUpload },
    setup() { const files = ref<readonly File[]>([]), requests = ref(0), rejections = ref('无'); function update(next: File[]) { requests.value++; files.value = next; } function reject(items: MUploadRejection[]) { rejections.value = items.map(item => `${item.file.name}:${item.reason}`).join('|'); } return { files, requests, rejections, update, reject }; },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MUpload :model-value="files" label="校验附件" accept=".txt,image/png" multiple :max-count="2" :max-size="1024" @update:model-value="update" @reject="reject" /><p data-owner-files>父模型：{{ files.map(file => file.name).join(\'、\') || \'空\' }} · 更新请求：{{ requests }}</p><p data-rejections style="overflow-wrap:anywhere">拒绝原因：{{ rejections }}</p></main>',
  }),
};
export const Controlled: Story = {
  name: '受控拒绝与程序更新',
  render: () => defineComponent({
    components: { MUpload, MButton },
    setup() { const files = ref<readonly File[]>([sample('initial.txt')]), requests = ref(0), accepts = ref(false); function update(next: File[]) { requests.value++; if (accepts.value) files.value = next; } return { files, requests, accepts, update, replace: () => { files.value = [sample('program.txt')]; }, duplicate: () => { const file = sample('duplicate.txt'); files.value = [file, file]; } }; },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MUpload :model-value="files" label="受控附件" @update:model-value="update" /><p data-owner-files>父模型：{{ files.map(file => file.name).join(\'、\') || \'空\' }} · 更新请求：{{ requests }}</p><div class="kit-row"><MButton variant="secondary" @click="accepts = !accepts">{{ accepts ? \'拒绝后续文件更新\' : \'接受后续文件更新\' }}</MButton><MButton variant="secondary" @click="replace">程序替换附件</MButton><MButton variant="ghost" @click="duplicate">程序设置重复父值</MButton></div></main>',
  }),
};
export const FormAttributes: Story = {
  name: '原生表单、动态只读与禁用',
  render: () => defineComponent({
    components: { MUpload, MButton },
    setup() {
      const formId = `upload-form-${useId()}`, files = ref<readonly File[]>([]), readonly = ref(false), disabled = ref(false), result = ref('尚未提交');
      const proof = [sample('proof.txt')], excluded = [sample('excluded.txt')];
      function submit(event: Event) { result.value = JSON.stringify([...new FormData(event.currentTarget as HTMLFormElement)].map(([name, value]) => [name, value instanceof File ? { name: value.name, size: value.size, type: value.type } : value])); }
      return { formId, files, proof, excluded, readonly, disabled, result, submit };
    },
    template: '<main class="kit-stack" style="width:min(100%,560px)"><MUpload v-model="files" :form="formId" name="attachments" label="必填附件" multiple required :readonly="readonly" :disabled="disabled" hint="组件位于 form 外，通过 form 属性关联。" /><MUpload :model-value="proof" :form="formId" name="proof" label="只读证明附件" readonly /><MUpload :model-value="excluded" :form="formId" name="excluded" label="禁用证明附件" disabled /><form :id="formId" class="kit-row" @submit.prevent="submit" @reset="files = []"><MButton type="submit">提交本地附件</MButton><MButton type="reset" variant="secondary">重置本地附件</MButton><MButton variant="ghost" @click="readonly = !readonly">{{ readonly ? \'允许修改附件\' : \'设为只读附件\' }}</MButton><MButton variant="ghost" @click="disabled = !disabled">{{ disabled ? \'启用附件控件\' : \'禁用附件控件\' }}</MButton></form><p data-form-result style="overflow-wrap:anywhere">{{ result }}</p><p data-owner-files>父模型：{{ files.map(file => file.name).join(\'、\') || \'空\' }}</p></main>',
  }),
};
export const LongContent: Story = {
  name: '长文件名与字节清单',
  render: () => defineComponent({
    components: { MUpload },
    setup() { const files = ref<readonly File[]>([sample(`Archive${'WithoutArtificialClipping'.repeat(6)}.txt`), sample('水墨科技与机械刻印交付规范'.repeat(9) + '.pdf', 'application/pdf'), sample('README', '', '')]); return { files }; },
    template: '<main style="width:min(100%,520px)"><MUpload v-model="files" label="长文件附件" multiple hint="完整文件名可以换行阅读；移除按钮不挤压正文。" /></main>',
  }),
};
export const Error: Story = { args: { error: '交付资料需要补充项目说明，请重新检查本地附件。' } };
export const UnmountCleanup: Story = {
  name: '卸载与原生重置清理',
  render: () => defineComponent({
    components: { MUpload, MButton },
    setup() { const visible = ref(true), files = ref<readonly File[]>([sample('保留的草稿.txt')]), formId = `cleanup-form-${useId()}`; return { visible, files, formId }; },
    template: '<main class="kit-stack" style="width:min(100%,520px)"><MUpload v-if="visible" v-model="files" :form="formId" label="可卸载附件" multiple /><div><MButton variant="secondary" @click="visible = !visible">{{ visible ? \'卸载文件组件\' : \'重新挂载文件组件\' }}</MButton></div><form :id="formId"><MButton type="reset" variant="ghost">原生重置草稿</MButton></form></main>',
  }),
};

export const RemoteManual: Story = {
  name: '远程上传与重试',
  render: () => defineComponent({
    components: { MUpload },
    setup() {
      const files = ref<File[]>([]), started = ref(0), completed = ref(0), failed = ref(0), progress = ref(0), last = ref('尚未请求');
      function success(file: File, response: unknown) { completed.value++; last.value = file.name + ' · ' + JSON.stringify(response); }
      function onProgress(_file: File, value: MUploadProgress) { progress.value++; last.value = value.total ? `已传输 ${value.loaded} / ${value.total} bytes` : `已传输 ${value.loaded} bytes，总量未知`; }
      return { files, started, completed, failed, progress, last, success, onProgress };
    },
    template: `<main class="kit-stack" style="width:min(100%,640px);grid-template-columns:minmax(0,1fr);overflow-wrap:anywhere"><h1>真实传输，每一步有据。</h1><p>选择后手动上传。预览地址未连接后端时会明确失败，可取消并重试；原始File与表单值继续保留。</p><MUpload v-model="files" label="服务器附件" multiple action="/__malang-upload__/manual" method="PUT" field-name="asset" with-credentials :headers="{'X-Archive':'manual'}" :data="{collection:'demo',tags:['paper','ink']}" :auto-upload="false" name="attachments" @upload="started++" @progress="onProgress" @success="success" @error="failed++"/><p data-remote-result>开始 {{started}} · 成功 {{completed}} · 失败 {{failed}} · 进度事件 {{progress}}</p><output data-remote-response style="overflow-wrap:anywhere">{{last}}</output><p data-owner-files>父模型：{{files.map(file=>file.name).join('、')||'空'}}</p></main>`,
  }),
};
export const RemoteAutomatic: Story = {
  name: '自动上传与独立取消',
  render: () => defineComponent({
    components: { MUpload, MButton, MSwitch },
    setup() { return { files: ref<File[]>([]), mounted: ref(true), disabled: ref(false), readonly: ref(false), completed: ref(0), aborted: ref(0) }; },
    template: `<main class="kit-stack" style="width:min(100%,640px);grid-template-columns:minmax(0,1fr);overflow-wrap:anywhere"><h1>逐份发送，各自归位。</h1><div class="kit-row"><MButton @click="mounted=!mounted">{{mounted?'卸载远程上传':'恢复远程上传'}}</MButton><MButton variant="secondary" @click="files=[]">程序移除全部附件</MButton></div><MSwitch v-model="disabled" label="禁用远程上传"/><MSwitch v-model="readonly" label="远程附件只读"/><MUpload v-if="mounted" v-model="files" label="自动远程附件" multiple action="/__malang-upload__/automatic" :disabled="disabled" :readonly="readonly" @success="completed++" @abort="aborted++"/><p data-remote-result>成功 {{completed}} · 取消 {{aborted}}</p><p data-owner-files>父模型：{{files.map(file=>file.name).join('、')||'空'}}</p></main>`,
  }),
};
export const CustomTransport: Story = {
  name: '自定义传输与迟到隔离',
  render: () => defineComponent({
    components: { MUpload, MSwitch },
    setup() {
      const files=ref<File[]>([]), ignore=ref(false), completed=ref(0), failed=ref(0), aborted=ref(0);
      const request: MUploadCustomRequest = async options => {
        const response=await fetch(options.action,{method:options.method,headers:options.headers,body:options.file,signal:ignore.value?undefined:options.signal,credentials:options.withCredentials?'include':'same-origin'});
        if(!response.ok)throw new globalThis.Error(`自定义传输失败（HTTP ${response.status}）。`);return response.json();
      };
      return{files,ignore,request,completed,failed,aborted};
    },
    template: `<main class="kit-stack" style="width:min(100%,640px);grid-template-columns:minmax(0,1fr);overflow-wrap:anywhere"><h1>协议可换，边界依旧。</h1><p>此示例用fetch发送原始文件，不提供可测的上传进度，因此等待响应时显示不确定进度。取消即隔离本轮结果。</p><MSwitch v-model="ignore" label="传输故意忽略取消信号"/><MUpload v-model="files" label="自定义远程附件" action="/__malang-upload__/custom" method="POST" :custom-request="request" :auto-upload="false" @success="completed++" @error="failed++" @abort="aborted++"/><p data-remote-result>成功 {{completed}} · 失败 {{failed}} · 取消 {{aborted}}</p></main>`,
  }),
};
export const RemoteControlled: Story = {
  name: '远程受控确认',
  render: () => defineComponent({
    components: { MUpload, MSwitch },
    setup(){const files=ref<File[]>([]),accepts=ref(false),requests=ref(0),started=ref(0);function update(next:File[]){requests.value++;if(accepts.value)files.value=next;}return{files,accepts,requests,started,update};},
    template: `<main class="kit-stack" style="width:min(100%,640px);grid-template-columns:minmax(0,1fr);overflow-wrap:anywhere"><MSwitch v-model="accepts" label="接受远程文件更新"/><MUpload :model-value="files" label="受控远程附件" action="/__malang-upload__/controlled" @update:model-value="update" @upload="started++"/><p data-remote-result>父级请求 {{requests}} · 启动上传 {{started}}</p><p data-owner-files>父模型：{{files.map(file=>file.name).join('、')||'空'}}</p></main>`,
  }),
};
