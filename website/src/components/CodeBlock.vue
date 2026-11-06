<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
const props = withDefaults(defineProps<{ code: string; language?: string; filename?: string }>(), { language: 'vue', filename: '示例' });
const copied = ref(false), fallback = ref(false), manual = ref<HTMLTextAreaElement>();
let timer: ReturnType<typeof setTimeout> | undefined;
let mounted = true;
let copyRequest = 0;
watch(() => props.code, () => {
  copyRequest += 1;
  clearTimeout(timer);
  copied.value = false;
  fallback.value = false;
});
const tokens = computed(() => {
  const pattern = /("[^"\n]*"|'[^'\n]*'|`[^`\n]*`|\/\/[^\n]*|#[^\n]*|\b(?:import|from|const|let|return|export|function|onMounted|onBeforeUnmount|true|false)\b|<\/?[\w-]+)/g;
  const output: { text: string; kind: string }[] = [];
  let end = 0;
  for (const match of props.code.matchAll(pattern)) {
    if (match.index > end) output.push({ text: props.code.slice(end, match.index), kind: '' });
    const value = match[0];
    output.push({ text: value, kind: /^['"`]/.test(value) ? 'string' : /^(\/\/|#)/.test(value) ? 'comment' : value.startsWith('<') ? 'tag' : 'keyword' });
    end = match.index + value.length;
  }
  output.push({ text: props.code.slice(end), kind: '' });
  return output;
});
async function copy() {
  const request = ++copyRequest;
  const code = props.code;
  clearTimeout(timer);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(code);
    if (!mounted || request !== copyRequest) return;
    copied.value = true; fallback.value = false;
    timer = setTimeout(() => { copied.value = false; }, 2200);
  } catch {
    if (!mounted || request !== copyRequest) return;
    copied.value = false; fallback.value = true;
    await nextTick(); manual.value?.focus(); manual.value?.select();
  }
}
onBeforeUnmount(() => { mounted = false; clearTimeout(timer); });
</script>
<template>
  <section class="site-code" :aria-label="filename">
    <div class="site-code__bar"><span><i aria-hidden="true" />{{ filename }}</span><button type="button" :aria-label="`复制 ${filename} 代码`" @click="copy">{{ copied ? '已复制 ✓' : '复制代码' }}</button></div>
    <pre tabindex="0" :aria-label="`${filename} ${language}代码`"><code><span v-for="(token, index) in tokens" :key="index" :class="token.kind && `syntax-${token.kind}`">{{ token.text }}</span></code></pre>
    <span class="site-sr-only" role="status">{{ copied ? '代码已复制' : '' }}</span>
    <div v-if="fallback" class="site-code__fallback"><p role="status">复制受限，可选中下方代码手动复制。</p><textarea ref="manual" readonly aria-label="可手动复制的代码" :value="code" @focus="manual?.select()" /></div>
  </section>
</template>
