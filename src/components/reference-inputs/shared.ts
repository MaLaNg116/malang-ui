import { nextTick, onBeforeUnmount, onMounted, onUpdated } from 'vue';
import type { Ref } from 'vue';
export function useNativeOwner(control: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | undefined>, value: () => string, error: () => string = () => '') {
  let owner: Document | undefined, timer: ReturnType<typeof setTimeout> | undefined, alive = false;
  function sync() { if (control.value) { control.value.value = value(); control.value.setCustomValidity(error()); } }
  function cancel() { if (timer) clearTimeout(timer); timer = undefined; }
  function reset(event: Event) { if (control.value?.form !== event.target) return; cancel(); timer = setTimeout(() => { timer = undefined; if (alive && !event.defaultPrevented) sync(); }, 0); }
  onMounted(() => { alive = true; owner = control.value?.ownerDocument; owner?.addEventListener('reset', reset, true); control.value?.addEventListener('input', cancel); sync(); });
  onUpdated(sync); onBeforeUnmount(() => { alive = false; cancel(); owner?.removeEventListener('reset', reset, true); control.value?.removeEventListener('input', cancel); });
  return () => nextTick(sync);
}
export function timeSeconds(value: string): number | null { const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value); if (!match) return null; const [h,m,s] = [Number(match[1]),Number(match[2]),Number(match[3] || 0)]; return h < 24 && m < 60 && s < 60 ? h * 3600 + m * 60 + s : null; }
export function formatTime(seconds: number, showSeconds = false) { const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}${showSeconds ? ':' + String(s).padStart(2,'0') : ''}`; }
export function timeError(value: string, min?: string, max?: string, step = 60, t = (_key: string, fallback: string) => fallback) { const a = min ? timeSeconds(min) : 0, b = max ? timeSeconds(max) : 86399; if (a === null || b === null || a > b || !Number.isInteger(step) || step < 1) return t('time.config','时间范围或步长配置无效。'); if (!value) return ''; const n = timeSeconds(value); return n === null ? t('time.invalid','请输入有效时间 HH:mm 或 HH:mm:ss。') : n < a || n > b ? t('time.bounds','时间超出可用范围。') : (n - a) % step ? t('time.step','时间不符合步长。') : ''; }
export function useDraftReset(root: Ref<HTMLElement | undefined>, restore: () => void) {
  let owner:Document|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  const cancel=()=>{if(timer)clearTimeout(timer);timer=undefined;};
  const reset=(event:Event)=>{if(![...root.value?.querySelectorAll<HTMLInputElement>('input,select,textarea')||[]].some(input=>input.form===event.target))return;cancel();timer=setTimeout(()=>{timer=undefined;if(!event.defaultPrevented)restore();},0);};
  onMounted(()=>{owner=root.value?.ownerDocument;owner?.addEventListener('reset',reset,true);root.value?.addEventListener('input',cancel,true);});
  onBeforeUnmount(()=>{cancel();owner?.removeEventListener('reset',reset,true);root.value?.removeEventListener('input',cancel,true);});
}
