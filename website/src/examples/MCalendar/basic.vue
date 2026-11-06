<script setup lang="ts">
import { ref } from 'vue';
import { MCalendar } from 'malang-ui';

const selected = ref('2026-11-06');
const agenda: Record<string, string> = {
  '2026-11-06': '初审',
  '2026-11-12': '交稿',
  '2026-11-20': '归档',
};
</script>

<template>
  <div class="example">
    <MCalendar v-model="selected" label="设计排期">
      <template #date="{ date, day }">
        <span class="calendar-day">
          {{ day }}
          <small v-if="agenda[date]">{{ agenda[date] }}</small>
        </span>
      </template>
    </MCalendar>
    <p>{{ selected }}：{{ agenda[selected] || '没有排期' }}</p>
  </div>
</template>

<style scoped>
.example { display: grid; gap: 12px; width: 100%; min-width: 0; }
.example p { margin: 0; overflow-wrap: anywhere; }
.calendar-day { display: grid; gap: 2px; min-width: 0; text-align: start; }
.calendar-day small { color: var(--ui-color-accent); font-size: 10px; }
</style>
