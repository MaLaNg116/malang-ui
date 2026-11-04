import { computed, defineComponent, nextTick, onBeforeUnmount, ref, useId } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAccordion, MBadge, MBreadcrumb, MButton, MDatePicker, MDescriptions, MDrawer, MEmpty, MInput, MMenu, MTable, MTag, MTimeline, MToast, MToastViewport, MTree, MUpload } from '../src';
import type { MDescriptionItem, MMenuItem, MTableColumn, MTreeNode } from '../src';
import { asyncLock } from '../src/utils';
import './ArchiveStudio.css';

interface ArchiveRecord { id: string; name: string; folder: string; date: string; fileNames: string[]; bytes: number; origin: '示例资料' | '本地登记' }
const folders: readonly MTreeNode[] = [{ value:'all', label:'全部卷宗', children:[{ value:'ink', label:'水墨与笔势', children:[{value:'brush',label:'原创墨迹'},{value:'seal',label:'朱砂印记'}] },{value:'mechanism',label:'机关构形'},{value:'sealed',label:'封存卷宗',disabled:true}] }];
const navigation: readonly MMenuItem[] = [{value:'workshop',label:'归档工坊',children:[{value:'register',label:'素材登记'},{value:'journal',label:'登记记录'}]},{value:'guide',label:'使用说明',href:'#archive-help'}];
const folderNames = new Map<string,string>(); const parents = new Map<string,string>();
function indexFolders(nodes: readonly MTreeNode[], parent?: string) { for (const node of nodes) { folderNames.set(node.value,node.label); if(parent)parents.set(node.value,parent); if(node.children)indexFolders(node.children,node.value); } }
indexFolders(folders);
function belongsTo(value: string, folder: string | null) { if(!folder)return false; let current:string|undefined=value; while(current){if(current===folder)return true;current=parents.get(current);}return false; }
function bytesLabel(value: number) { return value>=1024*1024 ? (value/(1024*1024)).toFixed(1)+' MB' : value>=1024 ? (value/1024).toFixed(1)+' KB' : value+' B'; }

const ArchiveStudio = defineComponent({
  components:{MAccordion,MBadge,MBreadcrumb,MButton,MDatePicker,MDescriptions,MDrawer,MEmpty,MInput,MMenu,MTable,MTag,MTimeline,MToast,MToastViewport,MTree,MUpload},
  setup(){
    const menu=ref<string|null>('register');const menuExpanded=ref(['workshop']);const folder=ref<string|null>('brush');const expanded=ref(['all','ink']);
    const name=ref('');const date=ref('2026-11-04');const files=ref<File[]>([]);const attempted=ref(false);const saving=ref(false);const notices=ref<string[]>([]);
    const records=ref<ArchiveRecord[]>([{id:'sample-1',name:'枯锋 · 起笔研究',folder:'brush',date:'2026-11-02',fileNames:['起笔纹理.png'],bytes:184320,origin:'示例资料'},{id:'sample-2',name:'回锋 · 干墨叠层',folder:'brush',date:'2026-11-03',fileNames:['干墨叠层.svg','回锋说明.txt'],bytes:32768,origin:'示例资料'},{id:'sample-3',name:'四向夹具 · 切面草图',folder:'mechanism',date:'2026-11-04',fileNames:['夹具构形.svg'],bytes:24576,origin:'示例资料'}]);
    const form=ref<HTMLFormElement>();const treeArea=ref<HTMLElement>();const recordsArea=ref<HTMLElement>();const listHeading=ref<HTMLHeadingElement>();
    const detailsOpen=ref(false);const selectedId=ref<string|null>(null);const toast=ref(false);const toastText=ref('');const toastTitle=ref('');const identity=useId();const nameId='archive-name-'+identity;const dateId='archive-date-'+identity;const filesId='archive-files-'+identity;
    let alive=true;let nextId=1;let notice=0;
    onBeforeUnmount(()=>{alive=false;notice++;});
    const nameError=computed(()=>attempted.value&&!name.value.trim()?'请填写条目名称。':'');
    const dateError=computed(()=>attempted.value&&!date.value?'请选择归档日期。':'');
    const filesError=computed(()=>attempted.value&&!files.value.length?'请至少选择一个本地附件。':'');
    const folderName=computed(()=>folderNames.get(folder.value||'')||'未选择目录');
    const filtered=computed(()=>records.value.filter(record=>belongsTo(record.folder,folder.value)));
    const selectedRecord=computed(()=>records.value.find(record=>record.id===selectedId.value));
    const columns:MTableColumn[]=[{key:'name',label:'卷宗条目'},{key:'date',label:'归档日期'},{key:'fileNames',label:'附件'},{key:'actions',label:'操作',align:'end'}];
    const totalBytes=computed(()=>files.value.reduce((total,file)=>total+file.size,0));
    const preview=computed<MDescriptionItem[]>(()=>[{key:'folder',label:'目标目录',value:folderName.value},{key:'date',label:'归档日期',value:date.value||'未选择'},{key:'files',label:'已选附件',value:files.value.length+' 个'},{key:'bytes',label:'合计大小',value:bytesLabel(totalBytes.value)}]);
    const detailItems=computed<MDescriptionItem[]>(()=>selectedRecord.value?[{key:'name',label:'条目名称',value:selectedRecord.value.name,span:2},{key:'folder',label:'所在目录',value:folderNames.get(selectedRecord.value.folder)||selectedRecord.value.folder},{key:'date',label:'归档日期',value:selectedRecord.value.date},{key:'source',label:'资料来源',value:selectedRecord.value.origin},{key:'size',label:'合计大小',value:bytesLabel(selectedRecord.value.bytes)},{key:'files',label:'附件清单',value:selectedRecord.value.fileNames.join(' · '),span:2}]:[]);
    const history=computed(()=>notices.value.map((description,index)=>({value:'notice-'+index,title:description,status:'success' as const})));
    async function notify(title:string,description:string){const token=++notice;toast.value=false;await nextTick();if(!alive||token!==notice)return;toastTitle.value=title;toastText.value=description;toast.value=true;}
    const register=asyncLock(async()=>{
      saving.value=true;attempted.value=true;
      try{await nextTick();if(!alive)return;
        if(!folder.value){treeArea.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();return;}
        if(nameError.value||filesError.value){document.getElementById(nameError.value?nameId:filesId)?.focus();return;}
        if(!form.value||!form.value.reportValidity())return;
        // A valid date draft may still hold focus during requestSubmit; submit the actual form value.
        const submittedDate=new FormData(form.value).get('date');
        if(typeof submittedDate!=='string')return;
        date.value=submittedDate;
        const next:ArchiveRecord={id:'local-'+nextId++,name:name.value.trim(),folder:folder.value,date:submittedDate,fileNames:files.value.map(file=>file.name),bytes:totalBytes.value,origin:'本地登记'};
        records.value=[next,...records.value];notices.value=[`已登记「${next.name}」至${folderName.value}，含 ${files.value.length} 个本地附件。`,...notices.value];
        await notify('本地登记完成',`${next.name} · ${files.value.length} 个附件，${bytesLabel(next.bytes)}。`);
      }finally{if(alive)saving.value=false;}
    });
    function resetDraft(){name.value='';date.value='2026-11-04';files.value=[];attempted.value=false;form.value?.reset();}
    function viewRecord(record:ArchiveRecord){selectedId.value=record.id;detailsOpen.value=true;}
    async function removeRecord(record:ArchiveRecord){const index=filtered.value.findIndex(item=>item.id===record.id);records.value=records.value.filter(item=>item.id!==record.id);notices.value=[`已从当前演示移除「${record.name}」。`,...notices.value];await nextTick();const buttons=recordsArea.value?.querySelectorAll<HTMLButtonElement>('[data-view-record]');(buttons?.[Math.min(index,buttons.length-1)]||listHeading.value)?.focus();void notify('条目已移除',record.name);}
    return{menu,menuExpanded,folder,expanded,name,date,files,attempted,saving,records,form,treeArea,recordsArea,listHeading,detailsOpen,selectedRecord,toast,toastTitle,toastText,nameId,dateId,filesId,nameError,dateError,filesError,folderName,filtered,columns,preview,detailItems,history,register,resetDraft,viewRecord,removeRecord,folders,navigation,bytesLabel,breadcrumbs:[{label:'组件工坊',href:'#archive-top'},{label:'藏品归档'}],helpItems:[{value:'local',label:'这份登记会保存到哪里？'},{value:'keyboard',label:'如何使用键盘浏览目录？'}],helpExpanded:ref(['local'])};
  },
  template:`<main id="archive-top" class="archive-studio"><MBreadcrumb :items="breadcrumbs"/><header class="archive-studio__hero"><div><p class="archive-studio__eyebrow">MALANG / ARCHIVE ATELIER</p><h1>藏锋于卷，万象有序。</h1><p>为一段笔势、一枚印记、一份构形，留下一处有章法的归所。</p></div><MTag tone="info">本地归档演练</MTag></header>
    <div class="archive-studio__workspace"><aside class="archive-studio__sidebar"><MMenu v-model="menu" v-model:expanded-values="menuExpanded" :items="navigation" label="归档导航"/><section ref="treeArea" class="archive-studio__directory" aria-labelledby="archive-directory-heading"><div class="archive-studio__section-heading"><h2 id="archive-directory-heading">卷宗目录</h2><span aria-hidden="true">01 / FOLDERS</span></div><MTree v-model="folder" v-model:expanded-values="expanded" :items="folders" label="素材卷宗目录"/><p v-if="attempted && !folder" class="archive-studio__error" role="alert">请选择归档目录。</p></section><p class="archive-studio__muted">方向键浏览目录，Enter 或空格确认选择。文字与附件草稿会继续保留。</p></aside>
      <div class="archive-studio__main"><section v-show="menu !== 'journal'" class="archive-studio__editor" aria-labelledby="archive-editor-heading"><div class="archive-studio__section-heading"><h2 id="archive-editor-heading">登记本地素材</h2><MBadge tone="neutral">{{ folderName }}</MBadge></div><form ref="form" class="archive-studio__form" novalidate @submit.prevent="register"><MInput :id="nameId" v-model="name" label="条目名称" name="name" required maxlength="60" :error="nameError" placeholder="例如：折锋 · 墨迹试作"/><MDatePicker :id="dateId" v-model="date" label="归档日期" name="date" required min="2025-01-01" max="2028-12-31" :error="dateError" hint="输入完整日期，或打开历盘选择。"/><MUpload :id="filesId" v-model="files" label="本地附件" name="attachments" required multiple accept=".png,.jpg,.jpeg,.svg,.txt,.pdf" :max-count="5" :max-size="2097152" :error="filesError" hint="最多 5 个附件，每个不超过 2 MB；支持图片、SVG、TXT 和 PDF。"/><div class="archive-studio__actions"><MButton type="submit" :loading="saving">登记素材 <span aria-hidden="true">↗</span></MButton><MButton variant="secondary" :disabled="saving" @click="resetDraft">清空草稿</MButton></div></form></section>
      <section v-show="menu !== 'journal'" ref="recordsArea" class="archive-studio__records" aria-labelledby="archive-list-heading"><div class="archive-studio__section-heading"><h2 id="archive-list-heading" ref="listHeading" tabindex="-1">当前卷宗素材</h2><MBadge>{{ filtered.length }} 条</MBadge></div><MTable :rows="filtered" :columns="columns" caption="当前卷宗素材清单"><template #cell-name="{ row }"><div class="archive-studio__record-name"><strong>{{ row.name }}</strong><MTag :tone="row.origin === '本地登记' ? 'success' : 'neutral'">{{ row.origin }}</MTag></div></template><template #cell-fileNames="{ row }">{{ row.fileNames.length }} 个</template><template #cell-actions="{ row }"><div class="archive-studio__row-actions"><MButton variant="ghost" size="sm" :data-view-record="row.id" :aria-label="'查看'+row.name" @click="viewRecord(row)">查看</MButton><MButton variant="ghost" size="sm" :aria-label="'移除'+row.name" @click="removeRecord(row)">移除</MButton></div></template><template #empty><MEmpty title="这一卷尚待落笔" description="选择本地附件，完成上方登记，即可在这里查看。"/></template></MTable></section>
      <section v-show="menu === 'journal'" class="archive-studio__journal" aria-labelledby="archive-journal-heading"><div class="archive-studio__section-heading"><h2 id="archive-journal-heading">登记记录</h2><MTag>{{ history.length }} 次操作</MTag></div><MTimeline :items="history" label="本次归档操作记录"/><p class="archive-studio__muted">只记录当前演示中的操作，重新打开页面后恢复示例资料。</p></section></div>
      <aside class="archive-studio__summary"><div class="archive-studio__section-heading"><span aria-hidden="true">02 / MANIFEST</span><MTag tone="warning">尚未上传</MTag></div><MDescriptions :items="preview" label="本次登记预览" :columns="1"/><p class="archive-studio__muted">选择附件与登记均在本地完成，演示不会把文件发送到服务器。</p></aside></div>
    <footer id="archive-help" class="archive-studio__help"><MAccordion v-model="helpExpanded" :items="helpItems" label="归档使用说明"><template #local><p>登记只保留条目与本地附件信息，刷新后恢复初始示例。正式接入项目时，再由应用决定文件保存的位置。</p></template><template #keyboard><p>侧栏导航保留常规 Tab 顺序；卷宗目录使用方向键浏览，Enter 或空格确认。展开、焦点和选择分别管理，浏览时不会丢失表单草稿。</p></template></MAccordion></footer>
    <MDrawer v-model="detailsOpen" title="卷宗详情" :description="selectedRecord ? selectedRecord.name : undefined" size="md"><MDescriptions :items="detailItems" label="卷宗条目资料"/><template #footer="{ close }"><MButton variant="secondary" @click="close">返回清单</MButton></template></MDrawer><MToastViewport><MToast v-model="toast" :title="toastTitle" :description="toastText" variant="success" :duration="6000"/></MToastViewport></main>`,
});
const meta={title:'开始/藏品归档台',component:ArchiveStudio,parameters:{layout:'fullscreen',controls:{disable:true}}} satisfies Meta<typeof ArchiveStudio>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Default:Story={name:'择卷 · 登记 · 归档'};
