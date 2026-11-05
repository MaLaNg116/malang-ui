import { computed, defineComponent, nextTick, reactive, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MButton, MCard, MEmpty, MForm, MFormItem, MImage, MInput, MMessage, MPopconfirm, MSegmented, MTag, MTextarea } from '../src';
import type { MFormModel, MFormRules } from '../src';
import './ArchivePublisher.css';

const images = ['ink-gate','jade-wheel','gilt-weave'].map(name => new URL(`./assets/archive/${name}.svg`, import.meta.url).href);
const wait = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 380);
  const abort = () => { clearTimeout(timer); reject(new DOMException('演练已取消', 'AbortError')); };
  if (signal.aborted) abort(); else signal.addEventListener('abort', abort, {once:true});
});
const ArchivePublisher = defineComponent({
  components: { MButton, MCard, MEmpty, MForm, MFormItem, MImage, MInput, MMessage, MPopconfirm, MSegmented, MTag, MTextarea },
  setup() {
    const model = reactive({title:'',code:'',note:''}), filter = ref('all'), notice = ref(false), content = ref(''), filterElement = ref<HTMLElement>();
    const records = ref([{id:1,title:'墨关 · 机械山水',code:'ink-gate',note:'层叠墨山，与青玉机关共守归途。',archived:false,image:images[0]!,confirm:false}]);
    let identity = 1;
    const options = [{value:'all',label:'全部档案'},{value:'draft',label:'待归档'},{value:'archived',label:'已归档'}];
    const visible = computed(()=>records.value.filter(item=>filter.value==='all'||item.archived===(filter.value==='archived')));
    const announce = (text:string)=>{content.value=text;notice.value=true;};
    const rules:MFormRules = {title:[{required:true,message:'请填写作品名称。'},{max:40,message:'作品名称不超过40个字符。'}],code:[{required:true,message:'请填写档案代号。'},{pattern:/^[a-z][a-z0-9-]{2,23}$/,message:'使用小写字母开头的3–24位字母、数字或短横线。'},{async validator(value,_model,signal){await wait(signal);return !records.value.some(record=>record.code===value)||'此代号已存在，请换一个。';}}]};
    const save = (value:MFormModel)=>{const id=++identity;records.value.unshift({id,title:String(value.title),code:String(value.code),note:String(value.note),archived:false,image:images[(id-1)%images.length]!,confirm:false});filter.value='all';announce('新档案已登记，可预览并确认归档。');};
    const archive = (record:typeof records.value[number])=>{const document=filterElement.value?.ownerDocument;const owned=document?.activeElement?.closest('[data-archive-record]')?.getAttribute('data-archive-record')===record.code;record.archived=true;record.confirm=false;announce(`「${record.title}」已归档。`);void nextTick(()=>{if(owned&&!visible.value.includes(record)&&document?.activeElement===document.body)filterElement.value?.querySelector<HTMLInputElement>('input:checked')?.focus({preventScroll:true});});};
    return {model,filter,filterElement,options,records,visible,notice,content,rules,images,save,archive,wait,reset:(value:MFormModel)=>Object.assign(model,value)};
  },
  template:`<main class="archive-publisher"><header><p class="archive-publisher__eyebrow">MALANG / ARCHIVE OPERATIONS</p><h1>作品入册，核验成章。</h1><p>用同一套纸墨语言完成登记、筛选、图片核对与异步确认。编号校验和归档等待仅在本页演练，操作结果由真实状态决定。</p></header>
    <div class="archive-publisher__layout"><MCard title="登记新档案" heading-tag="h2"><MForm :model="model" :rules="rules" label="作品登记" @submit="save" @reset="reset" v-slot="{validating}">
      <MFormItem name="title" label="作品名称" v-slot="{field}"><MInput v-model="model.title" v-bind="field" autocomplete="off" /></MFormItem>
      <MFormItem name="code" label="档案代号" hint="同页已有ink-gate，可用它演练重复校验。" v-slot="{field}"><MInput v-model="model.code" v-bind="field" autocomplete="off" /></MFormItem>
      <MFormItem name="note" label="作品说明" v-slot="{field}"><MTextarea v-model="model.note" v-bind="field" :maxlength="160" /></MFormItem>
      <div class="kit-row"><MButton type="submit" :loading="validating">核对并登记档案</MButton><MButton type="reset" variant="secondary">恢复初始草稿</MButton></div>
    </MForm></MCard>
    <section class="archive-publisher__collection" aria-label="档案列表"><div ref="filterElement" class="archive-publisher__filter"><MSegmented v-model="filter" :options="options" label="筛选档案" block /><p>显示 {{visible.length}} / {{records.length}} 份</p></div>
      <div class="archive-publisher__cards"><MCard v-for="record in visible" :key="record.id" :title="record.title" heading-tag="h2" :data-archive-record="record.code"><MImage :src="record.image" :alt="record.title+'，原创水墨机械插图'" :preview-sources="images" :width="600" :height="360" loading="eager" /><p class="archive-publisher__note">{{record.note||'尚未添加作品说明。'}}</p><template #footer><div class="archive-publisher__record-actions"><MTag :tone="record.archived?'success':'info'">{{record.archived?'已归档':'待归档'}}</MTag><code>{{record.code}}</code><MPopconfirm v-if="!record.archived" v-model="record.confirm" :title="'确认归档「'+record.title+'」？'" description="请先核对大图，确认后将这份档案加入已归档清单。" :trigger-label="'归档'+record.title" confirm-text="确认归档" :before-confirm="wait" @confirm="archive(record)" /></div></template></MCard></div>
      <MEmpty v-if="!visible.length" title="此处尚无档案" description="切换筛选条件，或先登记并确认归档。" />
    </section></div><MMessage v-model="notice" :content="content" type="success" /></main>`,
});
const meta={title:'开始/档案发布台',component:ArchivePublisher,parameters:{layout:'fullscreen',controls:{disable:true}}} satisfies Meta<typeof ArchivePublisher>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Default:Story={};
