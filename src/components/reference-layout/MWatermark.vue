<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { MWatermarkProps } from './types';
import { bounded, browserOf } from './_shared';
const props = withDefaults(defineProps<MWatermarkProps>(), { content: 'MALANG UI', gap: () => [120,90], rotate: -22, opacity: .12, fontSize: 14 });
const emit = defineEmits<{ error: [event: Event] }>();
const host = ref<HTMLElement>(), background = ref(''); let observer: ResizeObserver | undefined, theme: MutationObserver | undefined, picture: HTMLImageElement | undefined, generation = 0, alive = true, frame = 0;
function draw(image?: HTMLImageElement) {
  if (!alive || !host.value) return; const document = host.value.ownerDocument, browser = browserOf(host.value)!;
  const size = bounded(props.fontSize,8,72,14), lines = typeof props.content === 'string' ? [props.content] : [...props.content];
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d'); if (!context) return;
  context.font = `${size}px ${getComputedStyle(host.value).fontFamily}`;
  const width = Math.ceil(Math.max(image ? 120 : Math.max(0,...lines.map(line => context.measureText(line).width)),80) + bounded(props.gap[0],0,1000,120));
  const height = Math.ceil(Math.max(image ? 64 : lines.length*size*1.6,36) + bounded(props.gap[1],0,1000,90)), dpr = bounded(browser.devicePixelRatio,1,3,1);
  canvas.width = Math.ceil(width*dpr); canvas.height = Math.ceil(height*dpr); context.scale(dpr,dpr); context.translate(width/2,height/2); context.rotate(bounded(props.rotate,-180,180,-22)*Math.PI/180);
  context.fillStyle = props.color || getComputedStyle(host.value).getPropertyValue('--ui-color-text-secondary').trim() || '#59685f'; context.font = `${size}px ${getComputedStyle(host.value).fontFamily}`; context.textAlign = 'center'; context.textBaseline = 'middle';
  if (image) { const ratio = Math.min(120/image.naturalWidth,64/image.naturalHeight); context.drawImage(image,-image.naturalWidth*ratio/2,-image.naturalHeight*ratio/2,image.naturalWidth*ratio,image.naturalHeight*ratio); }
  else lines.forEach((line,index) => context.fillText(line,0,(index-(lines.length-1)/2)*size*1.6));
  try { background.value = `url("${canvas.toDataURL()}")`; host.value.style.setProperty('--ui-watermark-size',`${width}px ${height}px`); } catch { background.value = ''; }
}
function paint() { const token = ++generation; if (picture) { picture.onload = null; picture.onerror = null; } if (!props.image) { picture = undefined; draw(); return; } const image = host.value?.ownerDocument.createElement('img'); if (!image) return; picture = image; image.crossOrigin = 'anonymous'; image.onload = () => { if (alive && token === generation && image.naturalWidth) draw(image); }; image.onerror = event => { if (alive && token === generation) { draw(); if (typeof event !== 'string') emit('error',event); } }; image.src = props.image; }
function schedule() { const browser = browserOf(host.value); if (!browser || frame || !alive) return; frame = browser.requestAnimationFrame(() => { frame = 0; if (picture?.complete && picture.naturalWidth && props.image) draw(picture); else paint(); }); }
watch(() => [props.content,props.image,props.gap,props.rotate,props.fontSize,props.color],paint,{deep:true,flush:'post'});
onMounted(() => { const browser = browserOf(host.value); if (browser) { observer = new browser.ResizeObserver(schedule); observer.observe(host.value!); theme = new browser.MutationObserver(schedule); for (let node: HTMLElement|null = host.value!;node;node=node.parentElement) theme.observe(node,{attributes:true,attributeFilter:['data-ui-theme','data-ui-palette','class']}); } paint(); void host.value?.ownerDocument.fonts?.ready.then(schedule); });
onBeforeUnmount(() => { alive = false; generation++; observer?.disconnect(); theme?.disconnect(); if (frame) browserOf(host.value)?.cancelAnimationFrame(frame); if (picture) { picture.onload = null; picture.onerror = null; picture.src = ''; } });
</script>
<template><div ref="host" class="ui-watermark"><slot /><div class="ui-watermark__pattern" aria-hidden="true" :style="{ backgroundImage: background || undefined, opacity: bounded(opacity,0,1,.12) }" /></div></template>
<style scoped>.ui-watermark{position:relative;isolation:isolate;min-width:0}.ui-watermark__pattern{position:absolute;inset:0;z-index:1;pointer-events:none;background-repeat:repeat;background-size:var(--ui-watermark-size,240px 160px)}@media(forced-colors:active){.ui-watermark__pattern{opacity:.08!important}}</style>
