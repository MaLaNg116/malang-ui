import componentCoverage from '../design/component-coverage.json';
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { MAlert, MBackTop, MButton, MCard, MDescriptions, MSelect, MSteps, MTag, useReducedMotion } from '../src';
import type { MDescriptionItem } from '../src';
import { createBrandSequence, createSealSequence, createStaggerSequence, createWaitingSequence } from '../src/motion';
import type { BrandSequenceController, BrandSequenceState, SealSequenceController, StaggerSequenceController, StaggerSequenceState, WaitingSequenceController, WaitingSequenceState } from '../src/motion';
import './LibraryHome.css';

type ResultMode = 'success' | 'failure' | 'slow';
type RequestStatus = 'idle' | 'pending' | 'success' | 'error' | 'cancelled';
const cards = [
  { key:'input', number:'01', title:'落笔有度', description:'输入、日期与附件', text:'从一条墨线到完整表单，让编辑、校验和提交各有落点。', href:'./?path=/story/开始-藏品归档台--default', link:'体验素材归档' },
  { key:'navigation', number:'02', title:'行止有章', description:'导航、目录与流程', text:'焦点、选择和展开各司其职，让复杂界面仍然走得明白。', href:'./?path=/story/开始-铸刃工坊--default', link:'进入铸刃工坊' },
  { key:'motion', number:'03', title:'蓄势成锋', description:'六套 MG 与 GSAP', text:'轨道、墨迹、落印、品牌、等待与经纬；每一次运动都能停、能看、能归位。', href:'./?path=/story/开始-归印调校台--default', link:'调校一次落印' },
  { key:'utilities', number:'04', title:'从容运转', description:'独立工具与 Vue 适配', text:'防抖、节流、异步锁与实例清理，留住华丽，也照顾日常使用。', href:'./?path=/story/开始-基础版使用指南--default', link:'查看接入指南' },
];
const modes = [{value:'success',label:'成功响应 · 3.2s'},{value:'failure',label:'失败响应 · 1.6s'},{value:'slow',label:'慢响应 · 5.2s'}];
const durations: Record<ResultMode,number> = {success:3200,failure:1600,slow:5200};
const statusCopy: Record<RequestStatus,{title:string;description:string}> = {
  idle:{title:'静候起势',description:'发起一次本地请求演练，看等待如何自然转为落印。'},
  pending:{title:'本地请求处理中',description:'双轨回流只表示等待，不代表业务完成百分比。'},
  success:{title:'响应已确认',description:'本地请求返回成功，随后以朱砂落印收束。'},
  error:{title:'演练请求失败',description:'本次没有成功落印，可以调整结果后重试。'},
  cancelled:{title:'本轮已取消',description:'可以重新开始；上一轮迟到的结果会被忽略。'},
};

const LibraryHome = defineComponent({
  props:{motionProfile:{type:String,default:'standard'}},
  components:{MAlert,MBackTop,MButton,MCard,MDescriptions,MSelect,MSteps,MTag},
  setup(props){
    const brandCanvas=ref<HTMLCanvasElement>(); const waitingCanvas=ref<HTMLCanvasElement>(); const sealCanvas=ref<HTMLCanvasElement>(); const cardArea=ref<HTMLElement>();
    const systemMotion=useReducedMotion(); const reduced=computed(()=>props.motionProfile==='reduced'||systemMotion.value);
    const brandState=shallowRef<BrandSequenceState>(); const waitingState=shallowRef<WaitingSequenceState>(); const listState=shallowRef<StaggerSequenceState>();
    const mode=ref<ResultMode>('success'); const status=ref<RequestStatus>('idle'); const confirmed=ref(0);
    const requestStart=ref<InstanceType<typeof MButton>>(); const requestCancel=ref<InstanceType<typeof MButton>>();
    let brand:BrandSequenceController|undefined; let waiting:WaitingSequenceController|undefined; let seal:SealSequenceController|undefined; let stagger:StaggerSequenceController|undefined;
    let alive=false,brandGeneration=0,waitingGeneration=0,listGeneration=0,request=0;
    const jobs=new Map<number,{timer:ReturnType<typeof setTimeout>;resolve:(value:boolean|null)=>void}>();
    function createBrand(preserve=false){
      if(!alive||!brandCanvas.value)return; const previous=preserve?brand?.state:undefined; const token=++brandGeneration; brand?.dispose();
      brand=createBrandSequence(brandCanvas.value,{amplitude:1.2,reducedMotion:reduced.value,onUpdate:state=>{if(alive&&token===brandGeneration)brandState.value=state;}});
      if(previous&&!reduced.value){brand.seek(previous.time);if(previous.playing)brand.play();}
    }
    function createWaiting(){
      if(!alive||!waitingCanvas.value)return; const token=++waitingGeneration; waiting?.dispose();
      waiting=createWaitingSequence(waitingCanvas.value,{loop:true,reducedMotion:reduced.value,onUpdate:state=>{if(alive&&token===waitingGeneration)waitingState.value=state;}});
      if(status.value==='pending')waiting.play();
    }
    function createSeal(preserve=false){
      if(!alive||!sealCanvas.value)return;const previous=preserve?seal?.state:undefined;seal?.dispose();
      seal=createSealSequence(sealCanvas.value,{reducedMotion:reduced.value});
      if(status.value!=='success')seal.seek(0);
      else if(previous&&!reduced.value){seal.seek(previous.time);if(previous.playing)seal.play();}
    }
    function toggleBrand(){if(!brand)return;if(brand.state.playing)brand.pause();else brand.play();}
    function skipBrand(){brand?.pause();brand?.seek(brand.duration);}
    function replayBrand(){brand?.replay();}
    async function revealCards(){
      await nextTick();if(!alive||!cardArea.value)return;const token=++listGeneration;stagger?.dispose();
      stagger=createStaggerSequence([...cardArea.value.querySelectorAll<HTMLElement>('[data-motion-card]')],{direction:'up',distance:24,duration:.48,stagger:.09,reducedMotion:reduced.value,onUpdate:state=>{if(alive&&token===listGeneration)listState.value=state;}});
      stagger.replay();
    }
    async function start(){
      if(!alive||status.value==='pending')return;const token=++request;const resultMode=mode.value;status.value='pending';repairActionFocus(requestStart.value?.$el,'cancel');seal?.pause();seal?.seek(0);waiting?.replay();
      // The local service deliberately permits late responses so cancellation can be exercised.
      const result=await new Promise<boolean|null>(resolve=>{const timer=setTimeout(()=>{jobs.delete(token);resolve(resultMode!=='failure');},durations[resultMode]);jobs.set(token,{timer,resolve});});
      if(!alive||token!==request||result===null)return;waiting?.pause();status.value=result?'success':'error';repairActionFocus(requestCancel.value?.$el,'start');
      if(result){confirmed.value++;await nextTick();if(alive&&token===request)seal?.replay();}
    }
    function repairActionFocus(from:HTMLButtonElement|undefined,to:'start'|'cancel'){
      const document=from?.ownerDocument;if(!from||!document||document.activeElement!==from)return;
      void nextTick(()=>{if(!alive)return;const target=(to==='start'?requestStart.value?.$el:requestCancel.value?.$el) as HTMLButtonElement|undefined;const active=document.activeElement;if(target&&!target.disabled&&(!active||active===document.body||active===document.documentElement||active===from))target.focus({preventScroll:true});});
    }
    function cancel(){if(status.value!=='pending')return;request++;waiting?.pause();seal?.pause();seal?.seek(0);status.value='cancelled';repairActionFocus(requestCancel.value?.$el,'start');}
    watch(reduced,()=>{createBrand(true);createWaiting();createSeal(true);listGeneration++;stagger?.dispose();stagger=undefined;listState.value=undefined;});
    onMounted(()=>{alive=true;createBrand();createWaiting();createSeal();if(!reduced.value)brand?.play();});
    onBeforeUnmount(()=>{alive=false;request++;brandGeneration++;waitingGeneration++;listGeneration++;for(const job of jobs.values()){clearTimeout(job.timer);job.resolve(null);}jobs.clear();brand?.dispose();waiting?.dispose();seal?.dispose();stagger?.dispose();});
    const copy=computed(()=>statusCopy[status.value]);
    const stage=computed(()=>status.value==='success'?'seal':status.value==='idle'?'prepare':'waiting');
    const facts:MDescriptionItem[]=[{key:'components',label:'公开组件',value:componentCoverage.publicComponentCount+' 个'},{key:'motion',label:'MG 家族',value:'6 套'},{key:'framework',label:'首发框架',value:'Vue 3 + TypeScript'},{key:'access',label:'交互基础',value:'键盘 · 原生表单 · 减少动效'}];
    return{componentCount:componentCoverage.publicComponentCount,brandCanvas,waitingCanvas,sealCanvas,cardArea,requestStart,requestCancel,reduced,brandState,waitingState,listState,mode,status,confirmed,copy,stage,facts,cards,modes,toggleBrand,skipBrand,replayBrand,revealCards,start,cancel,steps:[{value:'prepare',label:'准备'},{value:'waiting',label:'等待响应'},{value:'seal',label:'确认落印'}]};
  },
  template:`<main class="library-home"><header class="library-home__masthead"><a href="./?path=/story/开始-组件库展示首页--default" target="_top" aria-label="MaLang UI 展示首页">MALANG <span>UI</span></a><div><MTag>Vue 3 + TypeScript</MTag><MTag tone="warning">0.1 · 本地验证版</MTag></div></header>
    <section class="library-home__hero" aria-labelledby="home-title"><div class="library-home__hero-copy"><p class="library-home__eyebrow">INK / MECHANISM / MOTION</p><h1 id="home-title" aria-label="以墨为骨，以动成章。">以墨为骨，<br/>以动成章。</h1><p class="library-home__intro">一套属于 MaLang 的功夫朋克组件语言。让笔势、切面与机械节奏，进入真正能用的界面。</p><a class="library-home__link" href="./?path=/story/开始-基础版使用指南--default" target="_top">从接入指南开始 <span aria-hidden="true">↗</span></a><div class="library-home__hero-facts"><span><strong>{{ componentCount }}</strong>公开组件</span><span><strong>06</strong>MG 家族</span><span><strong>M</strong>统一引用前缀</span></div></div><div class="library-home__brand"><canvas ref="brandCanvas" width="900" height="560" role="img" aria-label="MaLang 原创品牌开场，墨迹构形成 MALANG UI 字标"></canvas><div class="library-home__brand-tools"><MButton variant="secondary" size="sm" @click="toggleBrand">{{ brandState?.playing ? '暂停开场' : '播放开场' }}</MButton><MButton variant="ghost" size="sm" @click="replayBrand">重播开场</MButton><MButton variant="ghost" size="sm" @click="skipBrand">跳过开场</MButton><span>{{ (brandState?.time || 0).toFixed(2) }} / 4.80s</span></div><p v-if="reduced" class="library-home__muted">减少动态效果已启用，直接呈现完整字标；导航与正文始终可用。</p></div></section>
    <section class="library-home__families" aria-labelledby="home-families"><div class="library-home__section-heading"><div><p class="library-home__eyebrow">01 / A LANGUAGE OF ITS OWN</p><h2 id="home-families">各有所长，同出一脉。</h2></div><MButton variant="secondary" @click="revealCards">重播列表入场 <span aria-hidden="true">↗</span></MButton></div><p class="library-home__muted">列表默认可读。重播时短促错峰，键盘焦点进入内容会立即收束到可读状态。</p><div ref="cardArea" class="library-home__cards"><MCard v-for="card in cards" :key="card.key" :title="card.title" :description="card.description" :data-motion-card="card.key" :aria-labelledby="'home-card-'+card.key"><p>{{ card.text }}</p><template #header><p class="library-home__card-number">{{ card.number }} / MALANG</p><h3 :id="'home-card-'+card.key">{{ card.title }}</h3><p class="library-home__card-description">{{ card.description }}</p></template><template #footer><a class="library-home__link" :href="card.href" target="_top">{{ card.link }} <span aria-hidden="true">↗</span></a></template></MCard></div><p class="library-home__animation-note" aria-hidden="true">{{ listState?.playing ? '错峰入场中' : '内容已就位' }}</p></section>
    <section class="library-home__request" aria-labelledby="home-request"><div class="library-home__section-heading"><div><p class="library-home__eyebrow">02 / WAIT WITH PURPOSE</p><h2 id="home-request">等到确认，再落一印。</h2></div><MTag tone="info">本地请求演练</MTag></div><div class="library-home__request-grid"><div class="library-home__request-copy"><p>等待有自己的节奏，成功有清楚的落点。这个演练使用本地 Promise，不请求服务器，也不会把动画周期当成业务进度。</p><MSelect v-model="mode" :options="modes" label="演练结果" :disabled="status === 'pending'"/><MSteps :model-value="stage" :items="steps" label="本地请求演练阶段" :status="status === 'error' ? 'error' : status === 'success' ? 'success' : 'process'"/><div class="library-home__request-actions"><MButton ref="requestStart" :disabled="status === 'pending'" @click="start">开始请求演练 <span aria-hidden="true">↗</span></MButton><MButton v-if="status === 'pending'" ref="requestCancel" variant="secondary" @click="cancel">取消本轮</MButton></div><p class="library-home__muted">已确认 {{ confirmed }} 次成功响应。取消和失败均不触发落印。</p><MAlert :tone="status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'" :title="copy.title" :description="copy.description" :announce="status !== 'idle'"/></div><div class="library-home__request-art" role="region" :aria-busy="status === 'pending'" aria-label="本地请求反馈画面"><div class="library-home__stage-label" aria-hidden="true"><span>{{ status === 'pending' ? 'PROCESSING' : status === 'success' ? 'CONFIRMED' : 'WAIT / RESPONSE' }}</span><span>{{ status === 'pending' ? '双轨回流' : status === 'success' ? '朱砂成章' : '静候起势' }}</span></div><canvas v-show="status !== 'success'" ref="waitingCanvas" data-home-sequence="waiting" width="800" height="480" aria-hidden="true"></canvas><canvas v-show="status === 'success'" ref="sealCanvas" data-home-sequence="seal" width="800" height="480" aria-hidden="true"></canvas><p class="library-home__stage-note">{{ status === 'success' ? '响应确认后才呈现成功落印。' : reduced ? '静态等待姿态，仍需真实结果才能完成。' : '循环只表达等待，结果由请求决定。' }}</p></div></div></section>
    <section class="library-home__details"><MDescriptions :items="facts" label="组件库当前基础"/><p class="library-home__muted">组件统一使用 MInput / &lt;m-input&gt; 一类引用名。UI、纯工具与 GSAP 动效按入口分开使用；目前先在自己的文档和组合页中验证。</p></section><footer class="library-home__footer"><span>MALANG UI / 功夫朋克</span><a class="library-home__link" href="./?path=/story/开始-功夫朋克规范--default" target="_top">查看设计与品质约定 <span aria-hidden="true">↗</span></a></footer><MBackTop label="回到展示页顶部" /></main>`,
});
const meta={title:'开始/组件库展示首页',component:LibraryHome,parameters:{layout:'fullscreen',controls:{disable:true}},render:(_args,context)=>defineComponent({components:{LibraryHome},setup:()=>({motionProfile:computed(()=>context.globals.motion)}),template:'<LibraryHome :motion-profile="motionProfile" />'})} satisfies Meta<typeof LibraryHome>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Default:Story={name:'品牌 · 能力 · 真实反馈'};
