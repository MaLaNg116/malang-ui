import { defineComponent, ref, useId, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MUpload from '../../src/components/MUpload.vue';
import MButton from '../../src/components/MButton.vue';
import type { MUploadRejection } from '../../src/components/types';

function sample(name: string, type = 'text/plain', text = '本地交付资料') { return new File([text], name, { type, lastModified: 1700000000000 }); }
const meta = {
  title: '二级组件/Upload 本地文件', component: MUpload, tags: ['autodocs'],
  args: { modelValue: [], label: '归档附件', accept: '.pdf,image/*', multiple: false, maxSize: 5 * 1024 * 1024, disabled: false, readonly: false, hint: '仅管理本地清单，提交到服务器由使用方负责。' },
  parameters: { docs: { description: { component: '本地文件收件槽，原生 file input 是唯一选择入口和 Tab 停靠点。v-model 接收真正的 File[]；不会发起网络请求、读取文件内容或伪造上传进度。单选替换，多选追加，按选择顺序部分接收合法文件并逐项发出 reject；name/size/type/lastModified 相同视作元数据重复，不比较文件内容。accept 仅做扩展名与已知 MIME 检查；空 MIME 只在扩展名明确允许时通过，不代表内容安全验证。限制包含端点，maxSize 单位为 bytes，maxCount 为非负整数。取消选择保留列表，父级拒绝更新后恢复 FileList 并可重试。真实 input.files 与父模型保持同步，name/form/required/disabled 支持原生 FormData 与校验；readonly 为组件语义，阻止选择、拖放及移除，但保留表单值。原生 reset 后重新同步当前父模型，使用方可以在 reset 事件中更新模型。无文件预览 URL，无后台上传协议。' } } },
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
