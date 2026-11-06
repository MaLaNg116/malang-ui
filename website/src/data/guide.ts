export const cloneCode = `git clone https://github.com/MaLaNg116/malang-ui.git
cd malang-ui
pnpm install
pnpm build
pnpm pack`;
export const installCode = `# 在你的 Vue 3 项目中安装本地构建包
pnpm add /实际路径/malang-ui-0.1.0.tgz vue@^3.5.0

# 使用 motion 或 all 入口时安装
pnpm add gsap@^3.15.0`;
export const quickStartCode = `<script setup lang="ts">
import { ref } from 'vue';
import { MButton, MInput } from 'malang-ui';
import 'malang-ui/style.css';

const name = ref('我的下一份创作');
</script>

<template>
  <main data-ui-theme="dark">
    <MInput v-model="name" label="项目名称" />
    <MButton @click="name = ''">重新命名</MButton>
  </main>
</template>`;
export const themeCode = `<script setup lang="ts">
import { MConfigProvider, MButton } from 'malang-ui';
</script>

<template>
  <MConfigProvider theme="light" palette="celadon">
    <MButton>以青瓷为底</MButton>
  </MConfigProvider>
</template>`;
export const utilityCode = `import { debounce, throttle, asyncLock } from 'malang-ui/utils';

const search = debounce((value: string) => {
  console.log(value);
}, 280);

// 不依赖 Vue、样式或 GSAP，也可用于其他框架。`;
export const transitionCode = `<script setup lang="ts">
import { ref } from 'vue';
import { useMTransition } from 'malang-ui';

const records = ref([{ id: 'ink', label: '墨迹卷宗' }]);
const { transition, moveClass } = useMTransition({
  preset: 'reveal', group: true
});
</script>

<template>
  <TransitionGroup v-bind="transition" :move-class="moveClass"
    tag="ul" class="ui-transition-group">
    <li v-for="item in records" :key="item.id">{{ item.label }}</li>
  </TransitionGroup>
</template>`;
