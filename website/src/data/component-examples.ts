const sfc = (imports: string, setup: string, template: string) => `<script setup lang="ts">
${imports}
import 'malang-ui/style.css';
${setup ? `\n${setup}\n` : ''}</script>

<template>
${template}
</template>`;

export const buttonLevelsCode = sfc(
  "import { MButton } from 'malang-ui';",
  '',
  '  <div style="display: flex; flex-wrap: wrap; gap: 12px">\n    <MButton>主要操作</MButton>\n    <MButton variant="secondary">次要操作</MButton>\n    <MButton variant="ghost">文字操作</MButton>\n  </div>',
);
export const buttonSizesCode = (size: string) => sfc(
  "import { MButton } from 'malang-ui';", '',
  `  <MButton size="${size}">创建项目</MButton>\n  <MButton size="${size}" variant="secondary">取消</MButton>`,
);
export const buttonAsyncCode = sfc(
  "import { onBeforeUnmount, ref } from 'vue';\nimport { MButton } from 'malang-ui';",
  `const loading = ref(false);
const message = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

function save() {
  if (loading.value) return;
  loading.value = true;
  message.value = '';
  // 模拟请求；接入业务时，在请求的 finally 中复位 loading。
  timer = setTimeout(() => {
    loading.value = false;
    message.value = '模拟保存完成';
  }, 800);
}

onBeforeUnmount(() => clearTimeout(timer));`,
  `  <MButton :loading="loading" @click="save">
    {{ loading ? '正在保存…' : '模拟保存' }}
  </MButton>
  <MButton disabled>暂不可用</MButton>
  <p role="status">{{ message }}</p>`,
);
export const inputBasicCode = sfc(
  "import { ref } from 'vue';\nimport { MInput } from 'malang-ui';",
  "const name = ref('山海之间');",
  `  <MInput
    v-model="name"
    label="项目名称"
    hint="支持中文输入，最多 32 个字符。"
    placeholder="为新项目起个名字"
    :maxlength="32"
  />
  <p>当前值：{{ name || '尚未填写' }}</p>`,
);
export const inputStatesCode = sfc(
  "import { ref } from 'vue';\nimport { MInput } from 'malang-ui';",
  "const name = ref('已存在的名称');",
  `  <MInput v-model="name" label="存在冲突" error="这个名称已被使用，请更换。" />
  <MInput model-value="仅供展示的内容" label="禁用输入" disabled />`,
);
export const inputFormCode = sfc(
  "import { ref } from 'vue';\nimport { MButton, MInput } from 'malang-ui';",
  `const email = ref('');
const submitted = ref('');
function submit() {
  submitted.value = email.value;
}`,
  `  <form @submit.prevent="submit">
    <MInput
      v-model="email"
      label="联系邮箱"
      type="email"
      name="email"
      autocomplete="email"
      placeholder="you@example.com"
      required
    />
    <MButton type="submit">校验并确认</MButton>
    <p role="status">{{ submitted ? '已确认：' + submitted : '' }}</p>
  </form>`,
);
